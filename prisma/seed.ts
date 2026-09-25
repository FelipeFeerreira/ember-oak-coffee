import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { seedCatalog } from "../src/data/catalog";

/**
 * Seeds the product catalog. Safe to run repeatedly: products are upserted by
 * slug, so re-running resets prices and stock to the seed values without
 * creating duplicates.
 */
async function main() {
  const db = new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
  });

  try {
    for (const [index, product] of seedCatalog.entries()) {
      const data = { ...product, featured: product.featured ?? false, sortOrder: index };
      await db.product.upsert({
        where: { slug: product.slug },
        create: data,
        update: data,
      });
    }
    console.log(`Seeded ${seedCatalog.length} products.`);
  } finally {
    await db.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
