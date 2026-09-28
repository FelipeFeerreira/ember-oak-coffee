import { randomUUID } from "node:crypto";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { db } from "@/lib/db";
import { createConversation, beginChatTurn, finishChatTurn, currentConversation, conversationMessages, releaseChatTurn } from "@/lib/chat/session";
import { POST as chat } from "@/app/api/chat/route";
import { POST as lead } from "@/app/api/chat/lead/route";
import { POST as conversion } from "@/app/api/chat/conversion/route";
import { executeChatTool } from "@/lib/chat/tools";
import { answerChat } from "@/lib/chat/agent";
import { ChatProductCard } from "@/components/chat/product-card";

const mocked = vi.hoisted(() => ({ stream: vi.fn(), final: vi.fn() }));
vi.mock("@anthropic-ai/sdk", () => ({ default: class { messages = { stream: mocked.stream }; } }));
// The receipt-price test renders the real card. The cart button requires a Next router.
vi.mock("@/components/product/add-to-cart-button", () => ({ AddToCartButton: () => null }));

const target = new URL(process.env.DATABASE_URL!);
if (!["localhost", "127.0.0.1", "[::1]"].includes(target.hostname) || !target.pathname.endsWith("_test")) throw new Error("A local test database is required.");
const productId = "chat-integration-coffee";
function request(path: string, cookie: string, body: unknown, ip = "chat-test") {
  return new Request(`http://localhost:3100${path}`, { method: "POST", headers: {
    origin: "http://localhost:3100", cookie: cookie.split(";")[0], "x-forwarded-for": ip,
  }, body: JSON.stringify(body) });
}

beforeEach(async () => {
  process.env.ANTHROPIC_API_KEY = "";
  await db.conversation.deleteMany(); await db.lead.deleteMany(); await db.rateLimit.deleteMany();
  await db.product.upsert({ where: { id: productId }, update: { priceCents: 2735, stock: 7 }, create: {
    id: productId, slug: productId, name: "Database Coffee", type: "COFFEE", tagline: "Sweet and balanced", description: "Fixture",
    priceCents: 2735, stock: 7, tastingNotes: ["Cocoa"], brewMethods: ["ESPRESSO"], imageUrl: "/images/products/huila-hearth.webp", imageAlt: "Coffee",
  } });
  mocked.stream.mockReset().mockReturnValue({ finalMessage: mocked.final }); mocked.final.mockReset();
});
afterAll(async () => {
  process.env.ANTHROPIC_API_KEY = "";
  await db.conversation.deleteMany(); await db.lead.deleteMany(); await db.rateLimit.deleteMany();
  await db.product.delete({ where: { id: productId } }); await db.$disconnect();
});

describe("private persisted chat", () => {
  it("uses an opaque HttpOnly cookie and rejects a forged or expired session", async () => {
    const { conversation, cookie } = await createConversation();
    expect(cookie).toContain("HttpOnly"); expect(cookie).toContain("SameSite=Strict");
    expect(cookie).not.toContain(conversation.id); expect(cookie).not.toContain(conversation.tokenHash);
    expect((await currentConversation(request("/", cookie, {})))?.id).toBe(conversation.id);
    expect(await currentConversation(request("/", "ember-oak-chat=forged", {}))).toBeNull();
    await db.conversation.update({ where: { id: conversation.id }, data: { expiresAt: new Date(0) } });
    expect(await currentConversation(request("/", cookie, {}))).toBeNull();
  });
  it("streams and saves the offline fallback, redacting email from the transcript", async () => {
    const { conversation, cookie } = await createConversation();
    const response = await chat(request("/api/chat", cookie, { requestId: randomUUID(), message: "Hello buyer@example.com" }));
    expect(response.headers.get("content-type")).toContain("ndjson");
    const events = (await response.text()).trim().split("\n").map((line) => JSON.parse(line));
    expect(events[0].type).toBe("status"); expect(events.at(-1).type).toBe("result");
    expect(events.filter((event) => event.type === "text").map((event) => event.text).join("")).toBe(events.at(-1).message.text);
    expect(mocked.stream).not.toHaveBeenCalled();
    const messages = await conversationMessages(conversation.id);
    expect(messages).toHaveLength(2); expect(messages[0].text).not.toContain("buyer@example.com");
    expect(events.at(-1).remaining).toBe(19);
  });
  it("does not charge a session twice for a duplicate client request", async () => {
    const { conversation, cookie } = await createConversation(); const body = { requestId: randomUUID(), message: "Hello" };
    await (await chat(request("/api/chat", cookie, body))).text();
    expect((await chat(request("/api/chat", cookie, body))).status).toBe(409);
    expect((await db.conversation.findUniqueOrThrow({ where: { id: conversation.id } })).messageCount).toBe(1);
    expect(await db.chatMessage.count()).toBe(2);
  });
  it("admits one concurrent turn and enforces the persistent session cap", async () => {
    const { conversation } = await createConversation();
    const ids = [randomUUID(), randomUUID()];
    const attempts = await Promise.allSettled(ids.map((id) => beginChatTurn(conversation.id, id, "Coffee")));
    expect(attempts.filter((attempt) => attempt.status === "fulfilled")).toHaveLength(1);
    const current = await db.conversation.findUniqueOrThrow({ where: { id: conversation.id } });
    await releaseChatTurn(conversation.id, current.activeRequestId!);
    await db.conversation.update({ where: { id: conversation.id }, data: { messageCount: 20 } });
    await expect(beginChatTurn(conversation.id, randomUUID(), "More")).rejects.toThrow("20 messages");
    expect(await db.chatMessage.count()).toBe(1);
  });
  it("recovers an abandoned lease without allowing the old request to release a new turn", async () => {
    const { conversation } = await createConversation(); const old = randomUUID(); const next = randomUUID();
    await beginChatTurn(conversation.id, old, "Old message");
    await db.conversation.update({ where: { id: conversation.id }, data: { leaseUntil: new Date(0) } });
    await beginChatTurn(conversation.id, next, "New message");
    await releaseChatTurn(conversation.id, old);
    expect((await db.conversation.findUniqueOrThrow({ where: { id: conversation.id } })).activeRequestId).toBe(next);
  });
  it("refuses unauthenticated, cross-origin and forged-history messages", async () => {
    expect((await chat(request("/api/chat", "", { requestId: randomUUID(), message: "Hello" }))).status).toBe(401);
    const { cookie } = await createConversation();
    expect((await chat(request("/api/chat", cookie, { requestId: randomUUID(), message: "Hello", history: [] }))).status).toBe(400);
    expect((await chat(new Request("http://localhost:3100/api/chat", { method: "POST", headers: { origin: "https://other.example" }, body: "{}" }))).status).toBe(403);
    expect(mocked.stream).not.toHaveBeenCalled();
  });
  it("enforces IP limits across different chat sessions", async () => {
    const { cookie } = await createConversation();
    const { consumeLimit, requestLimitKey } = await import("@/lib/rate-limit");
    const req = request("/api/chat", cookie, { requestId: randomUUID(), message: "Hello" });
    for (let i = 0; i < 30; i++) await consumeLimit(requestLimitKey(req, "chat-message"), 30);
    expect((await chat(req)).status).toBe(429); expect(await db.chatMessage.count()).toBe(0);
  });
});

describe("database tools, prices and handoff", () => {
  it("combines catalog filters against Postgres and excludes unavailable stock", async () => {
    await db.product.update({ where: { id: productId }, data: { roastLevel: "MEDIUM", acidity: "LOW" } });
    const filters = { query: "DATABASE coffee", type: "COFFEE", roast: "MEDIUM", brew: "ESPRESSO", acidity: "LOW", maxPriceCents: 2735 };
    expect((await executeChatTool("search_products", filters, "Coffee preferences")).products?.map(product => product.id)).toEqual([productId]);
    for (const change of [{ roast: "DARK" }, { brew: "COLD_BREW" }, { acidity: "HIGH" }, { type: "ACCESSORY" }, { maxPriceCents: 2734 }]) {
      expect((await executeChatTool("search_products", { ...filters, ...change }, "Coffee preferences")).products).toEqual([]);
    }
    await db.product.update({ where: { id: productId }, data: { stock: 0 } });
    expect((await executeChatTool("search_products", filters, "Coffee preferences")).handoff).toBe(true);
  });
  it("blocks the daily provider budget before calling Claude or consuming a conversation turn", async () => {
    process.env.ANTHROPIC_API_KEY = "local-integration-fixture";
    await db.rateLimit.create({ data: { key: `chat-global:${new Date().toISOString().slice(0, 10)}`, count: 250, expiresAt: new Date(Date.now() + 86_400_000) } });
    const { conversation, cookie } = await createConversation();
    const response = await chat(request("/api/chat", cookie, { requestId: randomUUID(), message: "Help me choose" }));
    expect(response.status).toBe(429); expect(mocked.stream).not.toHaveBeenCalled();
    expect((await db.conversation.findUniqueOrThrow({ where: { id: conversation.id } })).messageCount).toBe(0);
    expect(await db.chatMessage.count()).toBe(0);
  });
  it("renders the database price in a card even when Claude fabricates a cheaper price", async () => {
    process.env.ANTHROPIC_API_KEY = "local-integration-fixture";
    mocked.final.mockResolvedValue({ stop_reason: "tool_use", content: [
      { type: "text", text: "The coffee costs $0.01, with guaranteed next-day delivery." },
      { type: "tool_use", name: "get_product", input: { id: productId }, id: "tool-price" },
    ], usage: { input_tokens: 100, output_tokens: 50 } });
    const { reply } = await answerChat("Tell me about this coffee", [], new AbortController().signal);
    const html = renderToStaticMarkup(createElement(ChatProductCard, { product: reply.products![0], messageId: "test" }));
    expect(html).toContain("$27.35"); expect(html).not.toContain("$0.01"); expect(reply.text).not.toContain("next-day");
    await db.product.update({ where: { id: productId }, data: { priceCents: 3100 } });
    const updated = await executeChatTool("get_product", { id: productId }, "Coffee");
    expect(updated.products![0].priceCents).toBe(3100);
  });
  it("keeps histories separate and refreshes saved recommendation prices from Postgres", async () => {
    const first = await createConversation(); const second = await createConversation(); const requestId = randomUUID();
    await beginChatTurn(first.conversation.id, requestId, "Coffee");
    await finishChatTurn(first.conversation.id, requestId, await executeChatTool("get_product", { id: productId }, "Coffee"), 1500);
    await db.product.update({ where: { id: productId }, data: { priceCents: 3200 } });
    expect((await conversationMessages(first.conversation.id))[1].products![0].priceCents).toBe(3200);
    expect(await conversationMessages(second.conversation.id)).toEqual([]);
  });
  it("records a recommendation click only for the owning session, once", async () => {
    const first = await createConversation(); const second = await createConversation(); const requestId = randomUUID();
    await beginChatTurn(first.conversation.id, requestId, "Coffee");
    const saved = await finishChatTurn(first.conversation.id, requestId, await executeChatTool("get_product", { id: productId }, "Coffee"), 0);
    const body = { messageId: saved.message.id, productId };
    expect(await (await conversion(request("/api/chat/conversion", second.cookie, body))).json()).toEqual({ recorded: false });
    expect(await (await conversion(request("/api/chat/conversion", first.cookie, body))).json()).toEqual({ recorded: true });
    expect(await (await conversion(request("/api/chat/conversion", first.cookie, body))).json()).toEqual({ recorded: false });
  });
  it("saves a consented human request idempotently without an AI key or email service", async () => {
    const { conversation, cookie } = await createConversation();
    const body = { requestId: randomUUID(), name: "Demo Buyer", email: "buyer@example.com", question: "Please help with coffee", consent: true };
    expect((await lead(request("/api/chat/lead", cookie, { ...body, consent: false }))).status).toBe(400);
    expect((await lead(request("/api/chat/lead", cookie, body))).status).toBe(200);
    expect((await lead(request("/api/chat/lead", cookie, body))).status).toBe(200);
    expect(await db.lead.count()).toBe(1);
    expect(await db.lead.findFirstOrThrow()).toMatchObject({ conversationId: conversation.id, status: "OPEN", question: body.question });
    expect(mocked.stream).not.toHaveBeenCalled();
  });
  it("does not call the provider again after an API failure and releases the turn", async () => {
    process.env.ANTHROPIC_API_KEY = "local-integration-fixture";
    mocked.final.mockRejectedValue(new Error("Provider unavailable"));
    const { conversation, cookie } = await createConversation();
    const response = await chat(request("/api/chat", cookie, { requestId: randomUUID(), message: "Espresso" }));
    const text = await response.text(); expect(text).toContain("could not finish");
    expect(mocked.stream).toHaveBeenCalledTimes(1);
    expect((await db.conversation.findUniqueOrThrow({ where: { id: conversation.id } })).activeRequestId).toBeNull();
  });
});
