import { randomUUID } from "node:crypto";
import { afterAll, beforeEach, expect, it, vi } from "vitest";
import { db } from "@/lib/db";
import { seedCatalog } from "@/data/catalog";
import { cleanDemo, DEMO_RETENTION_MS } from "@/lib/demo/cleanup";
import { GET } from "@/app/api/cron/demo-cleanup/route";

const target = new URL(process.env.DATABASE_URL!);
if (!["localhost", "127.0.0.1", "[::1]"].includes(target.hostname) || !target.pathname.endsWith("_test")) {
  throw new Error("Demo cleanup tests require a local disposable test database.");
}
const now = new Date("2035-01-15T05:00:00Z");
const cutoff = new Date(now.getTime() - DEMO_RETENTION_MS);
const old = new Date(cutoff.getTime() - 1);
const secret = "local-cleanup-test-secret-not-for-production";
const seed = seedCatalog[0];

async function clear() {
  await db.order.deleteMany();
  await db.lead.deleteMany();
  await db.conversation.deleteMany();
  await db.demoCleanupRun.deleteMany();
  await db.product.deleteMany({ where: { id: { startsWith: "cleanup-" } } });
}
async function order(createdAt: Date) {
  return db.order.create({ data: {
    number: randomUUID(), checkoutKey: randomUUID(), requestHash: "fixture", checkoutOrigin: "http://localhost:3100",
    subtotalCents: 2300, shippingCents: 600, totalCents: 2900, createdAt,
    items: { create: { productId: "cleanup-seed", name: seed.name, quantity: 1, unitPriceCents: 2300 } },
    events: { create: { id: randomUUID() } },
  } });
}
beforeEach(async () => {
  vi.stubEnv("DEMO_MODE", "true"); vi.stubEnv("CRON_SECRET", secret);
  await clear();
  await db.product.create({ data: { ...seed, id: "cleanup-seed", stock: 1, priceCents: 2300 } });
});
afterAll(async () => { await clear(); vi.unstubAllEnvs(); await db.$disconnect(); });

it("requires authentication and explicit demo mode before changing data", async () => {
  await order(old);
  const response = await GET(new Request("http://localhost/api/cron/demo-cleanup"));
  expect(response.status).toBe(401);
  vi.stubEnv("DEMO_MODE", "false");
  const disabled = await GET(new Request("http://localhost/api/cron/demo-cleanup", { headers: { authorization: `Bearer ${secret}` } }));
  expect(await disabled.json()).toEqual({ skipped: "disabled" });
  expect(await db.order.count()).toBe(1);
  expect(await db.demoCleanupRun.count()).toBe(0);
});

it("fails closed for missing or short cron secrets and live payment keys", async () => {
  vi.stubEnv("CRON_SECRET", "");
  expect((await GET(new Request("http://localhost/api/cron/demo-cleanup", { headers: { authorization: "Bearer " } }))).status).toBe(401);
  vi.stubEnv("CRON_SECRET", "short");
  expect((await GET(new Request("http://localhost/api/cron/demo-cleanup", { headers: { authorization: "Bearer short" } }))).status).toBe(401);
  vi.stubEnv("STRIPE_SECRET_KEY", "sk_live_rejected_fixture");
  await expect(cleanDemo(now)).rejects.toThrow("test-mode");
  vi.unstubAllEnvs();
  expect(await db.demoCleanupRun.count()).toBe(0);
});

it("deletes only records older than seven days, cascades children and preserves prices", async () => {
  const expiredOrder = await order(old); const freshOrder = await order(cutoff);
  const conversation = await db.conversation.create({ data: {
    tokenHash: randomUUID(), createdAt: old, expiresAt: cutoff,
    messages: { create: { requestId: randomUUID(), role: "ASSISTANT", content: "Fictional recommendation",
      recommendations: { create: { productId: "cleanup-seed" } } } },
  } });
  const freshConversation = await db.conversation.create({ data: { tokenHash: randomUUID(), createdAt: cutoff, expiresAt: now } });
  for (const createdAt of [old, cutoff]) await db.lead.create({ data: {
    requestId: randomUUID(), conversationId: conversation.id, name: "Demo Customer", email: "demo@example.com", question: "Coffee?", createdAt,
  } });
  await db.product.create({ data: { ...seed, id: "cleanup-custom", slug: "cleanup-custom", stock: 3 } });
  const result = await cleanDemo(now);
  expect(result).toMatchObject({ deletedOrders: 1, deletedLeads: 1, deletedConversations: 1, restoredProducts: 1 });
  expect(await db.order.findUnique({ where: { id: expiredOrder.id } })).toBeNull();
  expect(await db.order.findUnique({ where: { id: freshOrder.id } })).not.toBeNull();
  expect(await db.stripeEvent.count()).toBe(1); expect(await db.orderItem.count()).toBe(1);
  expect(await db.chatRecommendation.count()).toBe(0); expect(await db.chatMessage.count()).toBe(0);
  expect(await db.conversation.findUnique({ where: { id: freshConversation.id } })).not.toBeNull();
  expect(await db.lead.findFirst()).toMatchObject({ conversationId: null });
  expect(await db.product.findUnique({ where: { id: "cleanup-seed" } })).toMatchObject({ stock: seed.stock, priceCents: 2300 });
  expect(await db.product.findUnique({ where: { id: "cleanup-custom" } })).toMatchObject({ stock: 3 });
});

it("does not replenish purchases again on retry, but permits the next UTC day", async () => {
  await cleanDemo(now);
  await db.product.update({ where: { id: "cleanup-seed" }, data: { stock: 2 } });
  expect(await cleanDemo(now)).toMatchObject({ skipped: "already-completed" });
  expect((await db.product.findUniqueOrThrow({ where: { id: "cleanup-seed" } })).stock).toBe(2);
  await cleanDemo(new Date(now.getTime() + 86_400_000));
  expect((await db.product.findUniqueOrThrow({ where: { id: "cleanup-seed" } })).stock).toBe(seed.stock);
});

it("commits only one concurrent daily cleanup", async () => {
  const results = await Promise.all([cleanDemo(now), cleanDemo(now)]);
  expect(results.filter((result) => "skipped" in result)).toHaveLength(1);
  expect(await db.demoCleanupRun.count()).toBe(1);
});

it("rolls deletion and the daily marker back if stock restoration fails", async () => {
  await order(old);
  const originalStock = seed.stock;
  try {
    seed.stock = Number.NaN;
    await expect(cleanDemo(now)).rejects.toThrow();
  } finally { seed.stock = originalStock; }
  expect(await db.order.count()).toBe(1);
  expect(await db.demoCleanupRun.count()).toBe(0);
  expect(await cleanDemo(now)).toMatchObject({ deletedOrders: 1 });
});
