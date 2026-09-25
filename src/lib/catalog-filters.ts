import { z } from "zod";
import type { Prisma } from "@/generated/prisma/client";
import { BREW_METHODS, PRODUCT_TYPES, ROAST_LEVELS } from "@/lib/product-labels";

export const SORT_OPTIONS = ["featured", "price-asc", "price-desc", "name"] as const;
export type SortOption = (typeof SORT_OPTIONS)[number];

export const sortLabels: Record<SortOption, string> = {
  featured: "Featured",
  "price-asc": "Price: low to high",
  "price-desc": "Price: high to low",
  name: "Name",
};

/** Accepts `?roast=LIGHT` and `?roast=LIGHT&roast=DARK`; drops unknown values instead of failing. */
function multiEnum<const T extends readonly [string, ...string[]]>(values: T) {
  return z
    .union([z.string(), z.array(z.string())])
    .optional()
    .transform((raw) => {
      const list = raw === undefined ? [] : Array.isArray(raw) ? raw : [raw];
      return list.filter((v): v is T[number] => (values as readonly string[]).includes(v));
    });
}

/** Whole-dollar price bound; invalid or negative input is ignored. */
const priceBound = z
  .union([z.string(), z.array(z.string())])
  .optional()
  .transform((raw) => {
    const value = Array.isArray(raw) ? raw[0] : raw;
    if (value === undefined || value.trim() === "") return undefined;
    const n = Number(value);
    return Number.isFinite(n) && n >= 0 ? Math.floor(n) : undefined;
  });

const single = <const T extends readonly [string, ...string[]]>(values: T) =>
  z
    .union([z.string(), z.array(z.string())])
    .optional()
    .transform((raw) => {
      const value = Array.isArray(raw) ? raw[0] : raw;
      return (values as readonly string[]).includes(value ?? "") ? (value as T[number]) : undefined;
    });

/**
 * Parses catalog URL search params. The catalog is shareable and bookmarkable,
 * so filters live in the URL — which means anyone can type anything into it.
 * This schema never throws: bad values are simply ignored.
 */
export const catalogFiltersSchema = z.object({
  type: single(PRODUCT_TYPES),
  roast: multiEnum(ROAST_LEVELS),
  brew: multiEnum(BREW_METHODS),
  minPrice: priceBound,
  maxPrice: priceBound,
  sort: single(SORT_OPTIONS).transform((v) => v ?? "featured"),
});

export type CatalogFilters = z.infer<typeof catalogFiltersSchema>;

export function parseCatalogFilters(searchParams: Record<string, string | string[] | undefined>): CatalogFilters {
  const filters = catalogFiltersSchema.parse(searchParams);
  // A reversed range is almost certainly a typo: swap instead of returning nothing.
  if (filters.minPrice !== undefined && filters.maxPrice !== undefined && filters.minPrice > filters.maxPrice) {
    [filters.minPrice, filters.maxPrice] = [filters.maxPrice, filters.minPrice];
  }
  return filters;
}

export function countActiveFilters(filters: CatalogFilters): number {
  return (
    (filters.type ? 1 : 0) +
    filters.roast.length +
    filters.brew.length +
    (filters.minPrice !== undefined ? 1 : 0) +
    (filters.maxPrice !== undefined ? 1 : 0)
  );
}

/** Translates parsed filters into a Prisma `where` clause. */
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
