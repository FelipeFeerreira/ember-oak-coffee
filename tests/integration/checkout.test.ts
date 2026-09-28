import { randomBytes, randomUUID } from "node:crypto";
import Stripe from "stripe";
import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { db } from "@/lib/db";
import { POST as webhook } from "@/app/api/stripe/webhook/route";
import { POST as tracking } from "@/app/api/orders/track/route";
import { POST as confirmation } from "@/app/api/orders/confirmation/route";
import { POST as checkoutRoute } from "@/app/api/checkout/route";
import { createCheckout } from "@/lib/checkout/create-session";
import { lookupOrder } from "@/lib/orders/lookup";
import { consumeLimit } from "@/lib/rate-limit";

const stripe = new Stripe("sk_test_local_fixture");
const mocks = vi.hoisted(() => ({ create: vi.fn(), retrieve: vi.fn(), send: vi.fn() }));
vi.mock("@/lib/checkout/stripe", async (original) => ({
  ...await original<typeof import("@/lib/checkout/stripe")>(),
  getStripe: () => ({ webhooks: stripe.webhooks, checkout: { sessions: { create: mocks.create, retrieve: mocks.retrieve } } }),
}));
vi.mock("resend", () => ({ Resend: class { emails = { send: mocks.send }; } }));

const testUrl = new URL(process.env.DATABASE_URL!);
if (!["localhost", "127.0.0.1", "[::1]"].includes(testUrl.hostname) || !testUrl.pathname.endsWith("_test")) {
  throw new Error("Refusing to run integration tests outside a local test database.");
}

const productId = "checkout-integration-coffee";
async function makeOrder(quantity = 2) {
  return db.order.create({ data: {
    number: `EO-${randomBytes(8).toString("hex").toUpperCase()}`, checkoutKey: randomUUID(), requestHash: "fixture",
    checkoutOrigin: "http://localhost:3100", subtotalCents: quantity * 1900, shippingCents: 600, totalCents: quantity * 1900 + 600,
    items: { create: [{ productId, name: "Test coffee", quantity, unitPriceCents: 1900, grind: "FILTER" }] },
  } });
}

function paidEvent(order: { id: string; totalCents: number }, eventId = `evt_${randomUUID()}`) {
  return {
    id: eventId, object: "event", created: Math.floor(Date.now() / 1000), livemode: false, type: "checkout.session.completed",
    data: { object: {
      id: `cs_test_${order.id}`, object: "checkout.session", mode: "payment", livemode: false,
      client_reference_id: order.id, metadata: { orderId: order.id }, payment_status: "paid",
      amount_total: order.totalCents, currency: "usd", payment_intent: `pi_${order.id}`,
      customer_details: { email: "BUYER@example.com", name: "Demo Customer" },
      collected_information: { shipping_details: { name: "Demo Customer", address: { country: "US", city: "Portland" } } },
    } },
  };
}

async function deliver(event: ReturnType<typeof paidEvent>, invalidSignature = false) {
  const payload = JSON.stringify(event);
  const signature = stripe.webhooks.generateTestHeaderString({ payload, secret: invalidSignature ? "wrong" : process.env.STRIPE_WEBHOOK_SECRET! });
  return webhook(new Request("http://localhost:3100/api/stripe/webhook", {
    method: "POST", headers: { "stripe-signature": signature }, body: payload,
  }));
}

beforeEach(async () => {
  // Only this suite's fixtures are removed, even though the database is isolated.
  await db.order.deleteMany({ where: { items: { some: { productId } } } });
  await db.rateLimit.deleteMany();
  await db.product.upsert({ where: { id: productId }, update: { stock: 10, priceCents: 1900 }, create: {
    id: productId, slug: productId, name: "Test coffee", type: "COFFEE", tagline: "Test", description: "Test",
    priceCents: 1900, stock: 10, tastingNotes: [], brewMethods: [], imageUrl: "/test.webp", imageAlt: "Test",
  } });
  process.env.RESEND_API_KEY = "";
  vi.spyOn(console, "info").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
  mocks.create.mockReset(); mocks.retrieve.mockReset(); mocks.send.mockReset();
  mocks.create.mockImplementation(async (params) => ({ id: `cs_test_${params.metadata.orderId}`, url: "https://checkout.stripe.com/c/pay/test", status: "open", livemode: false }));
  mocks.retrieve.mockImplementation(async (id) => ({ id, url: "https://checkout.stripe.com/c/pay/test", status: "open", livemode: false }));
});

afterAll(async () => {
  await db.order.deleteMany({ where: { items: { some: { productId } } } });
  await db.product.delete({ where: { id: productId } });
  await db.rateLimit.deleteMany();
  await db.$disconnect();
});

describe("signed payment processing against PostgreSQL", () => {
  it("rejects an old signed event before recording a payment", async () => {
    const order = await makeOrder(); const payload = JSON.stringify(paidEvent(order));
    const signature = stripe.webhooks.generateTestHeaderString({ payload, secret: process.env.STRIPE_WEBHOOK_SECRET!, timestamp: 1 });
    const response = await webhook(new Request("http://localhost:3100/api/stripe/webhook", { method: "POST", headers: { "stripe-signature": signature }, body: payload }));
    expect(response.status).toBe(400);
    expect((await db.order.findUniqueOrThrow({ where: { id: order.id } })).status).toBe("PENDING");
    expect(await db.stripeEvent.count()).toBe(0);
  });
  it.each(["currency", "client_reference_id"] as const)("rolls back a signed payment with a mismatched %s", async (field) => {
    const order = await makeOrder(); const event = paidEvent(order);
    event.data.object[field] = field === "currency" ? "eur" : "another-order";
    expect((await deliver(event)).status).toBe(500);
    expect((await db.order.findUniqueOrThrow({ where: { id: order.id } })).status).toBe("PENDING");
    expect((await db.product.findUniqueOrThrow({ where: { id: productId } })).stock).toBe(10);
    expect(await db.stripeEvent.count()).toBe(0);
  });
  it("rejects a forged signature before touching orders or stock", async () => {
    const order = await makeOrder();
    expect((await deliver(paidEvent(order), true)).status).toBe(400);
    expect((await db.order.findUniqueOrThrow({ where: { id: order.id } })).status).toBe("PENDING");
    expect((await db.product.findUniqueOrThrow({ where: { id: productId } })).stock).toBe(10);
    expect(await db.stripeEvent.count()).toBe(0);
  });
  it("confirms and decrements once when the same signed event arrives concurrently", async () => {
    const order = await makeOrder();
    const event = paidEvent(order);
    const responses = await Promise.all([deliver(event), deliver(event)]);
    expect(responses.map((r) => r.status)).toEqual([200, 200]);
    expect(await db.order.count()).toBe(1);
    expect(await db.stripeEvent.count()).toBe(1);
    expect((await db.product.findUniqueOrThrow({ where: { id: productId } })).stock).toBe(8);
    expect(await db.order.findUniqueOrThrow({ where: { id: order.id } })).toMatchObject({ status: "PAID", email: "buyer@example.com", emailSentAt: expect.any(Date) });
    expect(console.info).toHaveBeenCalledTimes(1);
  });
  it("does not decrement twice for two event IDs referring to the same payment", async () => {
    const order = await makeOrder();
    await Promise.all([deliver(paidEvent(order)), deliver(paidEvent(order))]);
    expect((await db.product.findUniqueOrThrow({ where: { id: productId } })).stock).toBe(8);
    expect(await db.stripeEvent.count()).toBe(2);
  });
  it("rejects mismatched amounts without any partial transaction", async () => {
    const order = await makeOrder();
    const event = paidEvent(order); event.data.object.amount_total = 1;
    expect((await deliver(event)).status).toBe(500);
    expect(await db.stripeEvent.count()).toBe(0);
    expect((await db.product.findUniqueOrThrow({ where: { id: productId } })).stock).toBe(10);
  });
  it("rolls back stock when a database constraint rejects confirmation", async () => {
    const first = await makeOrder(); const second = await makeOrder();
    await deliver(paidEvent(first));
    const event = paidEvent(second); event.data.object.payment_intent = `pi_${first.id}`;
    expect((await deliver(event)).status).toBe(500);
    expect((await db.order.findUniqueOrThrow({ where: { id: second.id } })).status).toBe("PENDING");
    expect((await db.product.findUniqueOrThrow({ where: { id: productId } })).stock).toBe(8);
    expect(await db.stripeEvent.count()).toBe(1);
  });
  it("does not confirm an unpaid or live session", async () => {
    const order = await makeOrder();
    const unpaid = paidEvent(order); unpaid.data.object.payment_status = "unpaid";
    expect((await deliver(unpaid)).status).toBe(200);
    const live = paidEvent(order); live.livemode = true;
    expect((await deliver(live)).status).toBe(400);
    expect((await db.order.findUniqueOrThrow({ where: { id: order.id } })).status).toBe("PENDING");
    expect(console.info).not.toHaveBeenCalled();
  });
  it("keeps the second payment under review when two buyers compete for the last stock", async () => {
    await db.product.update({ where: { id: productId }, data: { stock: 2 } });
    const first = await makeOrder(); const second = await makeOrder();
    expect((await Promise.all([deliver(paidEvent(first)), deliver(paidEvent(second))])).map((r) => r.status)).toEqual([200, 200]);
    const statuses = (await db.order.findMany()).map((o) => o.status).sort();
    expect(statuses).toEqual(["PAID", "PAYMENT_REVIEW"]);
    expect((await db.product.findUniqueOrThrow({ where: { id: productId } })).stock).toBe(0);
  });
  it("does not undo confirmation for a late expiration event", async () => {
    const order = await makeOrder();
    await deliver(paidEvent(order));
    const expired = paidEvent(order); expired.type = "checkout.session.expired";
    expect((await deliver(expired)).status).toBe(200);
    expect((await db.order.findUniqueOrThrow({ where: { id: order.id } })).status).toBe("PAID");
  });
  it("retries email failures without repeating the stock transaction", async () => {
    process.env.RESEND_API_KEY = "re_local_fixture";
    mocks.send.mockResolvedValueOnce({ error: { message: "Temporary failure" } }).mockResolvedValue({ error: null });
    const order = await makeOrder(); const event = paidEvent(order);
    expect((await deliver(event)).status).toBe(500);
    expect((await db.order.findUniqueOrThrow({ where: { id: order.id } })).status).toBe("PAID");
    expect((await deliver(event)).status).toBe(200);
    expect((await db.product.findUniqueOrThrow({ where: { id: productId } })).stock).toBe(8);
    expect(mocks.send.mock.calls[0][1]).toEqual(mocks.send.mock.calls[1][1]);
  });
});

describe("checkout snapshots and order privacy", () => {
  const input = () => ({ items: [{ productId, quantity: 2 }], checkoutKey: randomUUID(), expectedTotalCents: 4400 });
  it("uses database prices for Stripe and reuses the pending order on retry", async () => {
    const body = input();
    await createCheckout(body);
    const params = mocks.create.mock.calls[0][0];
    expect(params.line_items[0].price_data.unit_amount).toBe(1900);
    expect(params.shipping_options[0].shipping_rate_data.fixed_amount.amount).toBe(600);
    const order = await db.order.findFirstOrThrow();
    mocks.retrieve.mockResolvedValue({ id: order.stripeSessionId, url: "https://checkout.stripe.com/c/pay/test", status: "open" });
    await createCheckout(body);
    expect(mocks.create).toHaveBeenCalledTimes(1);
    expect(await db.order.count()).toBe(1);
    expect(order.status).toBe("PENDING");
    expect((await db.product.findUniqueOrThrow({ where: { id: productId } })).stock).toBe(10);
  });
  it("rejects a stale displayed price and combined grinds exceeding stock", async () => {
    await expect(createCheckout({ ...input(), expectedTotalCents: 1 })).rejects.toThrow("Prices have changed");
    await expect(createCheckout({ ...input(), items: [
      { productId, quantity: 6, grind: "FILTER" }, { productId, quantity: 6, grind: "ESPRESSO" },
    ] })).rejects.toThrow("unavailable");
    expect(mocks.create).not.toHaveBeenCalled();
  });
  it("recovers an interrupted Stripe request with the same parameters and idempotency key", async () => {
    const body = input();
    mocks.create.mockRejectedValueOnce(new Error("Connection interrupted"));
    await expect(createCheckout(body)).rejects.toThrow("Connection interrupted");
    await createCheckout(body);
    expect(mocks.create.mock.calls[0]).toEqual(mocks.create.mock.calls[1]);
    expect(await db.order.count()).toBe(1);
  });
  it("serializes concurrent checkout retries into one order and one Stripe idempotency key", async () => {
    const body = input();
    await Promise.all([createCheckout(body), createCheckout(body)]);
    expect(await db.order.count()).toBe(1);
    const keys = mocks.create.mock.calls.map((call) => call[1].idempotencyKey);
    expect(new Set(keys).size).toBe(1);
  });
  it("never marks an order paid when the confirmation page polls it", async () => {
    const order = await makeOrder();
    await db.order.update({ where: { id: order.id }, data: { stripeSessionId: `cs_test_${order.id}` } });
    const response = await confirmation(new Request("http://localhost:3100/api/orders/confirmation", {
      method: "POST", headers: { origin: "http://localhost:3100" }, body: JSON.stringify({ sessionId: `cs_test_${order.id}` }),
    }));
    expect((await response.json()).order.status).toBe("PENDING");
    expect((await db.product.findUniqueOrThrow({ where: { id: productId } })).stock).toBe(10);
  });
  it("returns a useful fallback when Stripe test credentials are missing", async () => {
    const key = process.env.STRIPE_SECRET_KEY;
    process.env.STRIPE_SECRET_KEY = "";
    try {
      const response = await checkoutRoute(new Request("http://localhost:3100/api/checkout", {
        method: "POST", headers: { origin: "http://localhost:3100" }, body: JSON.stringify(input()),
      }));
      expect(response.status).toBe(503);
      expect(await response.json()).toMatchObject({ error: expect.stringContaining("Your cart is saved") });
      expect(await db.order.count()).toBe(0);
    } finally { process.env.STRIPE_SECRET_KEY = key; }
  });
  it("returns a safe order summary only when number and email both match", async () => {
    const order = await makeOrder(); await deliver(paidEvent(order));
    expect(await lookupOrder({ orderNumber: order.number, email: "wrong@example.com" })).toBeNull();
    expect(await lookupOrder({ orderNumber: "EO-0000000000000000", email: "buyer@example.com" })).toBeNull();
    const found = await lookupOrder({ orderNumber: order.number, email: "BUYER@example.com" });
    expect(found?.status).toBe("PAID");
    expect(found).not.toHaveProperty("email"); expect(found).not.toHaveProperty("shippingAddress"); expect(found).not.toHaveProperty("stripeSessionId");
  });
  it("limits concurrent requests in Postgres", async () => {
    const allowed = await Promise.all(Array.from({ length: 8 }, () => consumeLimit("integration-test", 2)));
    expect(allowed.filter(Boolean)).toHaveLength(2);
    await db.rateLimit.update({ where: { key: "integration-test" }, data: { expiresAt: new Date(0) } });
    expect(await consumeLimit("integration-test", 2)).toBe(true);
  });
  it("never exposes tracking credentials in a URL and rejects cross-origin lookup", async () => {
    const response = await tracking(new Request("http://localhost:3100/api/orders/track", {
      method: "POST", headers: { origin: "https://another-site.example" }, body: "{}",
    }));
    expect(response.status).toBe(403);
    expect(response.headers.get("cache-control")).toBe("no-store");
  });
});
