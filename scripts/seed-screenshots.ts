import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { seedCatalog } from "../src/data/catalog";
import { randomUUID } from "node:crypto";

// Never install illustrative metrics or pretend payments in a deployed database.
const url = new URL(process.env.DATABASE_URL!);
if (!["localhost", "127.0.0.1"].includes(url.hostname) || url.pathname !== "/ember_oak_capture_test") {
  throw new Error("Screenshot fixtures require the dedicated local capture database.");
}
const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: url.toString() }) });
async function main() {
  await db.order.deleteMany(); await db.lead.deleteMany(); await db.conversation.deleteMany();
  await db.adminSession.deleteMany(); await db.rateLimit.deleteMany();
  for (const [sortOrder, product] of seedCatalog.entries()) {
    await db.product.upsert({ where: { slug: product.slug }, create: { ...product, sortOrder }, update: { ...product, sortOrder } });
  }
  const products = await db.product.findMany({ where: { type: "COFFEE" }, orderBy: { sortOrder: "asc" } });
  const counts = [4, 6, 5, 8, 9, 7, 11];
  for (let day = 0; day < counts.length; day++) {
    const createdAt = new Date(); createdAt.setUTCDate(createdAt.getUTCDate() - (6 - day));
    for (let i = 0; i < counts[day]; i++) {
      const product = products[(i + day) % products.length];
      const topic = i % 3 ? "products" : "policy-shipping";
      await db.conversation.create({ data: {
        tokenHash: randomUUID(), messageCount: 1, costMicrousd: 0, createdAt, expiresAt: new Date(Date.now() + 86_400_000),
        messages: { create: [
          { role: "USER", requestId: randomUUID(), content: topic === "products" ? "I enjoy chocolatey coffee. What should I try?" : "How does shipping work?", createdAt },
          { role: "ASSISTANT", requestId: randomUUID(), content: JSON.stringify({ text: "Here is a coffee from our catalog.", topic }), topic, createdAt,
            ...(topic === "products" ? { recommendations: { create: { productId: product.id, createdAt, addedToCartAt: i % 2 ? createdAt : null } } } : {}) },
        ] },
      } });
    }
  }
  for (const [index, name] of ["Morgan", "Alex", "Jamie", "Taylor"].entries()) {
    await db.lead.create({ data: { requestId: randomUUID(), name: `${name} Sample`, email: `${name.toLowerCase()}@example.com`, question: "Could you help me choose a gift for a coffee lover?", status: index === 3 ? "CONTACTED" : "OPEN" } });
  }
  // These are explicitly staged records in a throwaway database, not payment evidence.
  for (let i = 0; i < 9; i++) {
    const product = products[i % products.length];
    await db.order.create({ data: {
      number: `EO-${(i + 1).toString(16).padStart(16, "0").toUpperCase()}`, checkoutKey: randomUUID(), requestHash: "illustrative-screenshot-fixture",
      status: "PAID", email: "demo@example.com", customerName: "Sample Customer", paidAt: new Date(),
      checkoutOrigin: "http://localhost:3110", subtotalCents: product.priceCents * 2, shippingCents: 600, totalCents: product.priceCents * 2 + 600,
      items: { create: { productId: product.id, name: product.name, quantity: 2, unitPriceCents: product.priceCents, grind: "WHOLE_BEAN" } },
    } });
  }
  console.log("Loaded fictional screenshot data into the isolated local capture database.");
}
main().finally(() => db.$disconnect());
