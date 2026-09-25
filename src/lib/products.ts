import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import type { CatalogFilters } from "@/lib/catalog-filters";

/**
 * The product shape sent to the browser. Plain data only (no Date objects),
 * so it can be passed from Server Components to Client Components.
 */
export type ProductSummary = {
  id: string;
  slug: string;
  name: string;
  type: "COFFEE" | "BUNDLE" | "ACCESSORY";
  tagline: string;
  priceCents: number;
  stock: number;
  roastLevel: "LIGHT" | "MEDIUM" | "MEDIUM_DARK" | "DARK" | null;
  acidity: "LOW" | "MEDIUM" | "HIGH" | null;
  brewMethods: ("ESPRESSO" | "FILTER" | "FRENCH_PRESS" | "COLD_BREW")[];
  tastingNotes: string[];
  origin: string | null;
  imageUrl: string;
  imageAlt: string;
};

export type ProductDetail = ProductSummary & {
  description: string;
  region: string | null;
  process: string | null;
  weightGrams: number | null;
};

const summarySelect = {
  id: true,
  slug: true,
  name: true,
  type: true,
  tagline: true,
  priceCents: true,
  stock: true,
  roastLevel: true,
  acidity: true,
  brewMethods: true,
  tastingNotes: true,
  origin: true,
  imageUrl: true,
  imageAlt: true,
} satisfies Prisma.ProductSelect;

const detailSelect = {
  ...summarySelect,
  description: true,
  region: true,
  process: true,
  weightGrams: true,
} satisfies Prisma.ProductSelect;

/** Builds the Prisma `where` clause for catalog filters. Exported for tests. */
export function buildCatalogWhere(filters: CatalogFilters): Prisma.ProductWhereInput {
  const where: Prisma.ProductWhereInput = {};
  if (filters.type) where.type = filters.type;
  if (filters.roast.length) where.roastLevel = { in: filters.roast };
  if (filters.brew.length) where.brewMethods = { hasSome: filters.brew };
  if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
    where.priceCents = {
      ...(filters.minPrice !== undefined && { gte: filters.minPrice * 100 }),
      ...(filters.maxPrice !== undefined && { lte: filters.maxPrice * 100 }),
    };
  }
  return where;
}

function orderByFor(sort: CatalogFilters["sort"]): Prisma.ProductOrderByWithRelationInput[] {
  switch (sort) {
    case "price-asc":
      return [{ priceCents: "asc" }, { name: "asc" }];
    case "price-desc":
      return [{ priceCents: "desc" }, { name: "asc" }];
    case "name":
      return [{ name: "asc" }];
    default:
      return [{ featured: "desc" }, { sortOrder: "asc" }];
  }
}

export async function getCatalog(filters: CatalogFilters): Promise<ProductSummary[]> {
  return db.product.findMany({
    where: buildCatalogWhere(filters),
    orderBy: orderByFor(filters.sort),
    select: summarySelect,
  });
}

export async function getFeaturedProducts(limit = 4): Promise<ProductSummary[]> {
  return db.product.findMany({
    where: { featured: true },
    orderBy: { sortOrder: "asc" },
    take: limit,
    select: summarySelect,
  });
}

export async function getProductBySlug(slug: string): Promise<ProductDetail | null> {
  return db.product.findUnique({ where: { slug }, select: detailSelect });
}

/** Products that share a roast level or brew method, for "You might also like". */
export async function getRelatedProducts(product: ProductDetail, limit = 3): Promise<ProductSummary[]> {
  return db.product.findMany({
    where: {
      id: { not: product.id },
      OR: [
        ...(product.roastLevel ? [{ roastLevel: product.roastLevel }] : []),
        ...(product.brewMethods.length ? [{ brewMethods: { hasSome: product.brewMethods } }] : []),
      ],
    },
    orderBy: [{ featured: "desc" }, { sortOrder: "asc" }],
    take: limit,
    select: summarySelect,
  });
}

/** Whole-dollar price range of the catalog, rounded out to $5 steps for the price slider. */
export async function getPriceBounds(): Promise<{ min: number; max: number }> {
  const { _min, _max } = await db.product.aggregate({ _min: { priceCents: true }, _max: { priceCents: true } });
  const min = Math.floor((_min.priceCents ?? 0) / 100 / 5) * 5;
  const max = Math.ceil((_max.priceCents ?? 10000) / 100 / 5) * 5;
  return { min, max: Math.max(max, min + 5) };
}

/** Loads just what pricing needs for a set of product IDs. */
export async function getProductsForPricing(ids: string[]) {
  return db.product.findMany({
    where: { id: { in: [...new Set(ids)] } },
    select: { id: true, slug: true, name: true, type: true, priceCents: true, stock: true, imageUrl: true },
  });
}
