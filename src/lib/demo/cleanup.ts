import "server-only";
import { db } from "@/lib/db";
import { seedCatalog } from "@/data/catalog";

export const DEMO_RETENTION_MS = 7 * 24 * 60 * 60 * 1000;

export async function cleanDemo(now = new Date()) {
  if (process.env.DEMO_MODE !== "true") return { skipped: "disabled" } as const;
  // Never reset a database while a live Stripe key is configured.
  if (process.env.STRIPE_SECRET_KEY && !process.env.STRIPE_SECRET_KEY.startsWith("sk_test_")) {
    throw new Error("Demo cleanup requires test-mode payments.");
  }
  const day = now.toISOString().slice(0, 10);
  const cutoff = new Date(now.getTime() - DEMO_RETENTION_MS);
  return db.$transaction(async (tx) => {
    // PostgreSQL waits on a concurrent insert of this day. Only its winner resets
    // stock; a failed transaction rolls back the marker so a retry can succeed.
    const claim = await tx.demoCleanupRun.createMany({ data: [{ day, cutoff }], skipDuplicates: true });
    if (!claim.count) return { skipped: "already-completed", day } as const;

    // Use the same order-before-product lock order as payment fulfillment.
    await tx.$queryRaw`SELECT id FROM "Order" WHERE "createdAt" < ${cutoff} ORDER BY id FOR UPDATE`;
    const deletedOrders = (await tx.order.deleteMany({ where: { createdAt: { lt: cutoff } } })).count;
    const deletedLeads = (await tx.lead.deleteMany({ where: { createdAt: { lt: cutoff } } })).count;
    const deletedConversations = (await tx.conversation.deleteMany({ where: { createdAt: { lt: cutoff } } })).count;
    const products = await tx.product.findMany({
      where: { slug: { in: seedCatalog.map((product) => product.slug) } },
      select: { id: true, slug: true }, orderBy: { id: "asc" },
    });
    for (const product of products) {
      await tx.product.update({ where: { id: product.id }, data: {
        stock: seedCatalog.find((seed) => seed.slug === product.slug)!.stock,
      } });
    }
    await tx.adminSession.deleteMany({ where: { expiresAt: { lt: now } } });
    await tx.rateLimit.deleteMany({ where: { expiresAt: { lt: now } } });
    return tx.demoCleanupRun.update({ where: { day }, data: {
      completedAt: now, deletedOrders, deletedLeads, deletedConversations, restoredProducts: products.length,
    } });
  }, { timeout: 30_000 });
}
