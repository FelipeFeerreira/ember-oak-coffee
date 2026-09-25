import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, Truck } from "lucide-react";
import { ProductCard } from "@/components/product/product-card";
import { ProductPurchase } from "@/components/product/product-purchase";
import { RoastMeter } from "@/components/product/roast-meter";
import { StockStatus } from "@/components/product/stock-status";
import { formatPrice } from "@/lib/money";
import { FREE_SHIPPING_THRESHOLD_CENTS } from "@/lib/pricing";
import { acidityLabels, brewLabels, typeLabels } from "@/lib/product-labels";
import { getProductBySlug, getRelatedProducts } from "@/lib/products";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps<"/shop/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Product not found" };
  return {
    title: product.name,
    description: product.tagline,
    openGraph: { images: [{ url: product.imageUrl, alt: product.imageAlt }] },
  };
}

export default async function ProductPage({ params }: PageProps<"/shop/[slug]">) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const related = await getRelatedProducts(product);
  const details: [string, string][] = [
    ...(product.origin ? ([["Origin", product.origin]] as [string, string][]) : []),
    ...(product.region ? ([["Region", product.region]] as [string, string][]) : []),
    ...(product.process ? ([["Process", product.process]] as [string, string][]) : []),
    ...(product.acidity ? ([["Acidity", acidityLabels[product.acidity]]] as [string, string][]) : []),
    ...(product.weightGrams
      ? ([["Weight", `${Math.round(product.weightGrams / 28.35)} oz (${product.weightGrams} g)`]] as [string, string][])
      : []),
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <nav aria-label="Breadcrumb" className="mb-8 text-sm text-muted-foreground">
        <ol className="flex flex-wrap items-center gap-1.5">
          <li className="flex items-center gap-1.5">
            <Link href="/shop" className="hover:text-ember">
              Shop
            </Link>
            <ChevronRight className="size-3.5" aria-hidden="true" />
          </li>
          <li className="flex items-center gap-1.5">
            <Link href={`/shop?type=${product.type}`} className="hover:text-ember">
              {typeLabels[product.type]}
            </Link>
            <ChevronRight className="size-3.5" aria-hidden="true" />
          </li>
          <li aria-current="page" className="text-espresso">
            {product.name}
          </li>
        </ol>
      </nav>

      <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
        <div className="relative aspect-square self-start overflow-hidden rounded-3xl bg-latte lg:sticky lg:top-32">
          <Image
            src={product.imageUrl}
            alt={product.imageAlt}
            fill
            priority
            sizes="(min-width: 1024px) 560px, 100vw"
            className="object-cover"
          />
        </div>

        <div className="flex flex-col">
          <p className="text-sm font-medium tracking-[0.18em] text-ember uppercase">
            {product.type === "COFFEE" ? product.origin : typeLabels[product.type]}
          </p>
          <h1 className="mt-2 text-4xl font-semibold sm:text-5xl">{product.name}</h1>
          <p className="mt-3 text-lg text-muted-foreground">{product.tagline}</p>

          <p className="mt-6 text-3xl font-semibold text-espresso" data-testid="product-price">
            <span className="sr-only">Price: </span>
            {formatPrice(product.priceCents)}
          </p>
          <StockStatus stock={product.stock} className="mt-2" />

          {(product.roastLevel || product.tastingNotes.length > 0) && (
            <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-espresso">
              {product.roastLevel && <RoastMeter level={product.roastLevel} />}
              {product.tastingNotes.length > 0 && (
                <p>
                  <span className="text-muted-foreground">Tastes like </span>
                  {product.tastingNotes.join(", ")}
                </p>
              )}
            </div>
          )}

          <div className="mt-8 rounded-2xl border border-border bg-card p-6">
            <ProductPurchase
              product={{
                id: product.id,
                slug: product.slug,
                name: product.name,
                imageUrl: product.imageUrl,
                stock: product.stock,
              }}
              grindable={product.type !== "ACCESSORY"}
            />
            <p className="mt-5 flex items-center gap-2 text-sm text-muted-foreground">
              <Truck className="size-4 text-oak" aria-hidden="true" />
              Free US shipping on orders over {formatPrice(FREE_SHIPPING_THRESHOLD_CENTS)}
            </p>
          </div>

          <div className="mt-10 space-y-4">
            <h2 className="text-2xl font-semibold">About this {product.type === "ACCESSORY" ? "item" : "coffee"}</h2>
            <p className="leading-relaxed text-espresso/90">{product.description}</p>
          </div>

          {product.brewMethods.length > 0 && (
            <div className="mt-8">
              <h2 className="mb-3 font-sans text-sm font-semibold text-espresso">
                {product.type === "ACCESSORY" ? "Works for" : "Recommended for"}
              </h2>
              <ul className="flex flex-wrap gap-2">
                {product.brewMethods.map((method) => (
                  <li key={method}>
                    <Link
                      href={`/shop?brew=${method}`}
                      className="inline-block rounded-full bg-latte px-3.5 py-1.5 text-sm text-espresso hover:bg-accent"
                    >
                      {brewLabels[method]}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {details.length > 0 && (
            <dl className="mt-8 grid grid-cols-2 gap-x-6 gap-y-4 border-t border-border pt-8 text-sm">
              {details.map(([term, value]) => (
                <div key={term}>
                  <dt className="text-muted-foreground">{term}</dt>
                  <dd className="font-medium text-espresso">{value}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>
      </div>

      {related.length > 0 && (
        <section aria-labelledby="related-heading" className="mt-24">
          <h2 id="related-heading" className="mb-8 text-3xl font-semibold">
            You might also like
          </h2>
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((item) => (
              <li key={item.id} className="flex">
                <ProductCard product={item} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
