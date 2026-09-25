import type { Metadata } from "next";
import Link from "next/link";
import { CatalogFiltersPanel } from "@/components/catalog/catalog-filters-panel";
import { MobileFilters } from "@/components/catalog/mobile-filters";
import { SortSelect } from "@/components/catalog/sort-select";
import { ProductCard } from "@/components/product/product-card";
import { countActiveFilters, parseCatalogFilters } from "@/lib/catalog-filters";
import { typeLabels } from "@/lib/product-labels";
import { getCatalog, getPriceBounds } from "@/lib/products";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Shop coffee, gifts & brewing gear",
  description: "Single-origin coffees, espresso and cold brew blends, gift bundles and brewing gear.",
};

export default async function ShopPage({ searchParams }: PageProps<"/shop">) {
  const filters = parseCatalogFilters(await searchParams);
  const [products, priceBounds] = await Promise.all([getCatalog(filters), getPriceBounds()]);
  const activeCount = countActiveFilters(filters);
  const heading = filters.type ? typeLabels[filters.type] : "Shop all";

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <header className="mb-10">
        <p className="text-sm font-medium tracking-[0.18em] text-ember uppercase">The roastery shop</p>
        <h1 className="mt-2 text-4xl font-semibold sm:text-5xl">{heading}</h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Every coffee is roasted to order on Monday or Thursday. Filter by how you brew, how dark you like it, or your
          budget.
        </p>
      </header>

      <div className="grid gap-10 lg:grid-cols-[240px_1fr]">
        <aside aria-label="Product filters" className="hidden lg:block">
          <div className="sticky top-32">
            <CatalogFiltersPanel filters={filters} priceBounds={priceBounds} activeCount={activeCount} />
          </div>
        </aside>

        <section aria-labelledby="results-heading">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <MobileFilters filters={filters} priceBounds={priceBounds} activeCount={activeCount} />
              <h2 id="results-heading" className="font-sans text-sm text-muted-foreground" aria-live="polite">
                {products.length} {products.length === 1 ? "product" : "products"}
              </h2>
            </div>
            <SortSelect value={filters.sort} />
          </div>

          {products.length > 0 ? (
            <ul className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {products.map((product, index) => (
                <li key={product.id} className="flex">
                  <ProductCard product={product} priority={index < 3} />
                </li>
              ))}
            </ul>
          ) : (
            <div className="rounded-2xl border border-dashed border-border bg-card px-6 py-16 text-center">
              <h3 className="text-2xl font-semibold">Nothing matches those filters</h3>
              <p className="mt-2 text-muted-foreground">
                Try removing a filter or widening the price range — or ask our assistant for a recommendation.
              </p>
              <Link href="/shop" className="mt-6 inline-block font-medium text-ember underline underline-offset-4">
                Clear all filters
              </Link>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
