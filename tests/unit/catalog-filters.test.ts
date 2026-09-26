import { describe, expect, it } from "vitest";
import { buildCatalogWhere, countActiveFilters, parseCatalogFilters } from "@/lib/catalog-filters";

describe("parseCatalogFilters", () => {
  it("returns defaults for an empty query", () => {
    expect(parseCatalogFilters({})).toEqual({
      type: undefined,
      roast: [],
      brew: [],
      minPrice: undefined,
      maxPrice: undefined,
      sort: "featured",
    });
  });

  it("accepts single and repeated values", () => {
    const filters = parseCatalogFilters({ roast: ["LIGHT", "DARK"], brew: "ESPRESSO", type: "COFFEE" });
    expect(filters.roast).toEqual(["LIGHT", "DARK"]);
    expect(filters.brew).toEqual(["ESPRESSO"]);
    expect(filters.type).toBe("COFFEE");
  });

  it("silently drops unknown values instead of throwing", () => {
    const filters = parseCatalogFilters({ roast: ["LIGHT", "BURNT"], type: "SHOES", sort: "random" });
    expect(filters.roast).toEqual(["LIGHT"]);
    expect(filters.type).toBeUndefined();
    expect(filters.sort).toBe("featured");
  });

  it("parses price bounds and ignores junk", () => {
    expect(parseCatalogFilters({ minPrice: "15", maxPrice: "40.9" })).toMatchObject({ minPrice: 15, maxPrice: 40 });
    expect(parseCatalogFilters({ minPrice: "abc", maxPrice: "-5" })).toMatchObject({
      minPrice: undefined,
      maxPrice: undefined,
    });
  });

  it("swaps a reversed price range", () => {
    expect(parseCatalogFilters({ minPrice: "50", maxPrice: "20" })).toMatchObject({ minPrice: 20, maxPrice: 50 });
  });

  it("counts active filters", () => {
    expect(countActiveFilters(parseCatalogFilters({ roast: ["LIGHT", "DARK"], minPrice: "10", sort: "name" }))).toBe(3);
  });
});

describe("buildCatalogWhere", () => {
  it("builds an empty clause when no filters are set", () => {
    expect(buildCatalogWhere(parseCatalogFilters({}))).toEqual({});
  });

  it("maps filters to Prisma conditions and converts dollars to cents", () => {
    const where = buildCatalogWhere(
      parseCatalogFilters({ type: "COFFEE", roast: "MEDIUM", brew: ["FILTER", "COLD_BREW"], minPrice: "15", maxPrice: "25" }),
    );
    expect(where).toEqual({
      type: "COFFEE",
      roastLevel: { in: ["MEDIUM"] },
      brewMethods: { hasSome: ["FILTER", "COLD_BREW"] },
      priceCents: { gte: 1500, lte: 2500 },
    });
  });

  it("supports an open-ended price range", () => {
    expect(buildCatalogWhere(parseCatalogFilters({ maxPrice: "20" }))).toEqual({ priceCents: { lte: 2000 } });
  });
});
