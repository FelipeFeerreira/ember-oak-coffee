import { randomUUID } from "node:crypto";
import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { db } from "@/lib/db";
import { ADMIN_COOKIE, adminConfigured, createAdminSession, getAdminSession, sessionCookie, verifyAdminToken } from "@/lib/admin/auth";
import { readDashboard } from "@/lib/admin/dashboard";
import { POST as login, DELETE as logout } from "@/app/api/admin/session/route";
import { PATCH as updateLead } from "@/app/api/admin/leads/[id]/route";

const target = new URL(process.env.DATABASE_URL!);
if (!["localhost", "127.0.0.1", "[::1]"].includes(target.hostname) || !target.pathname.endsWith("_test")) throw new Error("Local test database required.");
const secret = "owner-test-fixture-only-not-a-real-access-token";
const leadId = "owner-test-lead";
function request(method: string, path: string, body?: unknown, token?: string, origin = "http://localhost:3100") {
  return new Request(`http://localhost:3100${path}`, { method, headers: {
    origin, "Content-Type": "application/json", cookie: token ? `${ADMIN_COOKIE}=${token}` : "", "x-forwarded-for": "owner-integration",
  }, ...(body !== undefined && { body: JSON.stringify(body) }) });
}
const context = { params: Promise.resolve({ id: leadId }) };

async function cleanup() {
  await db.adminSession.deleteMany(); await db.rateLimit.deleteMany();
  await db.lead.deleteMany(); await db.conversation.deleteMany();
  await db.order.deleteMany({ where: { checkoutKey: { startsWith: "owner-test-" } } });
  await db.product.deleteMany({ where: { id: "owner-test-product" } });
}
beforeEach(async () => { vi.stubEnv("ADMIN_TOKEN", secret); await cleanup(); });
afterAll(async () => { await cleanup(); vi.unstubAllEnvs(); await db.$disconnect(); });

describe("private owner access", () => {
  it("fails closed without a sufficiently long configured token", async () => {
    vi.stubEnv("ADMIN_TOKEN", "");
    expect(adminConfigured()).toBe(false); expect(verifyAdminToken(secret)).toBe(false);
    expect((await login(request("POST", "/api/admin/session", { token: secret }))).status).toBe(503);
    expect(await readDashboard(undefined, {})).toBeNull();
    vi.stubEnv("ADMIN_TOKEN", "short"); expect(adminConfigured()).toBe(false);
  });
  it("rejects bad credentials and issues only an opaque, private session", async () => {
    expect((await login(request("POST", "/api/admin/session", { token: "wrong" }))).status).toBe(401);
    const response = await login(request("POST", "/api/admin/session", { token: secret }));
    expect(response.status).toBe(200); expect(response.headers.get("cache-control")).toBe("no-store");
    const cookie = response.headers.get("set-cookie")!;
    expect(cookie).toContain("HttpOnly"); expect(cookie).toContain("SameSite=Strict"); expect(cookie.includes(secret)).toBe(false);
    const token = cookie.split(";")[0].split("=")[1];
    const session = await getAdminSession(token);
    expect(session).not.toBeNull(); expect(session!.tokenHash).not.toBe(token);
    expect(session!.secretHash === secret).toBe(false);
    vi.stubEnv("NODE_ENV", "production"); expect(sessionCookie(token)).toContain("Secure"); vi.stubEnv("NODE_ENV", "test");
  });
  it("revokes sessions on expiry, secret rotation and logout", async () => {
    const token = await createAdminSession();
    vi.stubEnv("ADMIN_TOKEN", `${secret}-rotated`); expect(await getAdminSession(token)).toBeNull();
    vi.stubEnv("ADMIN_TOKEN", secret);
    await db.adminSession.updateMany({ data: { expiresAt: new Date(0) } });
    expect(await getAdminSession(token)).toBeNull();
    const fresh = await createAdminSession();
    expect((await logout(request("DELETE", "/api/admin/session", undefined, fresh))).status).toBe(200);
    expect(await getAdminSession(fresh)).toBeNull();
    expect(await getAdminSession("a".repeat(64))).toBeNull();
  });
  it("requires same-origin requests, even with a valid session", async () => {
    const token = await createAdminSession();
    expect((await login(request("POST", "/api/admin/session", { token: secret }, undefined, "https://other.example"))).status).toBe(403);
    expect((await logout(request("DELETE", "/api/admin/session", undefined, token, "https://other.example"))).status).toBe(403);
    expect((await updateLead(request("PATCH", "/api/admin/leads/x", { status: "CLOSED", expectedStatus: "OPEN" }, token, "https://other.example"), context)).status).toBe(403);
    expect(await getAdminSession(token)).not.toBeNull();
  });
  it("limits repeated login attempts in Postgres", async () => {
    for (let i = 0; i < 8; i++) expect((await login(request("POST", "/api/admin/session", { token: "bad" }))).status).toBe(401);
    expect((await login(request("POST", "/api/admin/session", { token: secret }))).status).toBe(429);
  });
  it("bounds login bodies and rejects malformed JSON", async () => {
    const tooLarge = await login(request("POST", "/api/admin/session", { token: "x".repeat(1100) }));
    expect(tooLarge.status).toBe(413);
    const malformed = new Request("http://localhost:3100/api/admin/session", { method: "POST", headers: { origin: "http://localhost:3100" }, body: "{" });
    expect((await login(malformed)).status).toBe(400);
  });
});

describe("owner data and lead workflow", () => {
  it("blocks unauthenticated reads and writes", async () => {
    expect(await readDashboard(undefined, { view: "orders" })).toBeNull();
    expect(await readDashboard("f".repeat(64), { view: "leads" })).toBeNull();
    expect((await updateLead(request("PATCH", "/api/admin/leads/x", { status: "CLOSED", expectedStatus: "OPEN" }), context)).status).toBe(401);
  });
  it("persists a lead status and rejects stale or invalid changes", async () => {
    await db.lead.create({ data: { id: leadId, requestId: randomUUID(), name: "Demo Customer", email: "demo@example.com", question: "Help with a coffee gift" } });
    const token = await createAdminSession();
    const patch = (status: string, expectedStatus = "OPEN") => updateLead(request("PATCH", "/api/admin/leads/x", { status, expectedStatus }, token), context);
    expect((await patch("CONTACTED")).status).toBe(200);
    expect((await db.lead.findUniqueOrThrow({ where: { id: leadId } })).status).toBe("CONTACTED");
    expect((await patch("CLOSED")).status).toBe(409);
    expect((await patch("REFUNDED")).status).toBe(400);
    expect((await patch("CLOSED", "CONTACTED")).status).toBe(200);
  });
  it("counts distinct chat conversions, ignores empty sessions, and returns only selected private fields", async () => {
    const token = await createAdminSession();
    await db.product.create({ data: { id: "owner-test-product", slug: "owner-test-product", name: "Owner fixture coffee", type: "COFFEE", tagline: "Fixture", description: "Fixture", priceCents: 1900, stock: 5, tastingNotes: [], brewMethods: [], imageUrl: "/images/products/huila-hearth.webp", imageAlt: "Coffee" } });
    const first = await db.conversation.create({ data: { tokenHash: randomUUID(), expiresAt: new Date(Date.now() + 10000) } });
    const second = await db.conversation.create({ data: { tokenHash: randomUUID(), expiresAt: new Date(Date.now() + 10000) } });
    await db.conversation.create({ data: { tokenHash: randomUUID(), expiresAt: new Date(Date.now() + 10000) } });
    for (const conversationId of [first.id, second.id]) {
      await db.chatMessage.create({ data: { conversationId, requestId: randomUUID(), role: "USER", content: "Which coffee is best for a gift?" } });
    }
    for (let i = 0; i < 2; i++) await db.chatMessage.create({ data: { conversationId: first.id, requestId: randomUUID(), role: "ASSISTANT", content: "A verified recommendation.", topic: "products", recommendations: { create: { productId: "owner-test-product", addedToCartAt: new Date() } } } });
    await db.order.create({ data: { number: `EO-${randomUUID().replaceAll("-", "").slice(0, 16).toUpperCase()}`, checkoutKey: `owner-test-${randomUUID()}`, requestHash: "private-hash", checkoutOrigin: "http://localhost:3100", status: "PAID", subtotalCents: 1900, shippingCents: 0, totalCents: 1900, paymentIntentId: "private-payment-id", shippingAddress: { address: "private address" }, items: { create: { productId: "owner-test-product", name: "Owner fixture coffee", quantity: 1, unitPriceCents: 1900 } } } });
    const data = (await readDashboard(token, {}))!;
    expect(data.metrics).toMatchObject({ conversations: 2, converted: 1, conversionRate: 50 });
    expect(data.recommendations[0].count).toBe(2); expect(data.topics[0].label).toBe("Product recommendations");
    expect(data.daily.reduce((sum, day) => sum + day.count, 0)).toBe(2);
    const orders = (await readDashboard(token, { view: "orders" }))!.orders;
    const fixture = orders.find(order => order.items.some(item => item.name === "Owner fixture coffee"))!;
    expect(fixture).toBeDefined(); expect(fixture).not.toHaveProperty("paymentIntentId"); expect(fixture).not.toHaveProperty("shippingAddress"); expect(fixture).not.toHaveProperty("requestHash");
    const thread = (await readDashboard(token, { view: "conversations", conversation: first.id }))!;
    expect(thread.transcript!.messages).toHaveLength(3); expect(thread.threads[0]).not.toHaveProperty("tokenHash");
  });
  it("paginates lead lists and clamps out-of-range pages", async () => {
    const token = await createAdminSession();
    await db.lead.createMany({ data: Array.from({ length: 21 }, (_, i) => ({ requestId: randomUUID(), name: `Demo ${i}`, email: "demo@example.com", question: "A fixture question" })) });
    const first = (await readDashboard(token, { view: "leads" }))!;
    expect(first.leads).toHaveLength(20); expect(first.pages).toBe(2);
    const last = (await readDashboard(token, { view: "leads", page: "999" }))!;
    expect(last.page).toBe(2); expect(last.leads).toHaveLength(1);
  });
  it("uses honest zero metrics for an empty conversation history", async () => {
    const data = (await readDashboard(await createAdminSession(), { view: "overview" }))!;
    expect(data.metrics.conversations).toBe(0); expect(data.metrics.conversionRate).toBe(0);
    expect(data.topics).toEqual([]); expect(data.daily).toHaveLength(7);
  });
});
