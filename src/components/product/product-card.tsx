import Image from "next/image";
import Link from "next/link";
import { AddToCartButton } from "@/components/product/add-to-cart-button";
import { RoastMeter } from "@/components/product/roast-meter";
import { LOW_STOCK_THRESHOLD } from "@/components/product/stock-status";
import { formatPrice } from "@/lib/money";
import { typeLabels } from "@/lib/product-labels";
import type { ProductSummary } from "@/lib/products";

export function ProductCard({ product, priority = false }: { product: ProductSummary; priority?: boolean }) {
  const href = `/shop/${product.slug}`;
  const lowStock = product.stock > 0 && product.stock <= LOW_STOCK_THRESHOLD;

  return (
    <article className="group flex w-full flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-[0_1px_2px_rgb(42_27_18/0.04)] transition-shadow hover:shadow-[0_12px_32px_-12px_rgb(42_27_18/0.25)]">
      <Link href={href} tabIndex={-1} aria-hidden="true" className="relative block aspect-square overflow-hidden bg-latte">
        <Image
          src={product.imageUrl}
          alt=""
          fill
          priority={priority}
          sizes="(min-width: 1024px) 280px, (min-width: 640px) 45vw, 90vw"
          className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
        />
        {product.stock <= 0 ? (
          <span className="absolute top-3 left-3 rounded-full bg-espresso px-2.5 py-1 text-xs font-semibold text-cream">
            Sold out
          </span>
        ) : lowStock ? (
          <span className="absolute top-3 left-3 rounded-full bg-ember px-2.5 py-1 text-xs font-semibold text-ember-foreground">
            Only {product.stock} left
          </span>
        ) : null}
      </Link>

      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex items-center justify-between gap-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
          <span>{product.type === "COFFEE" ? (product.origin ?? "Coffee") : typeLabels[product.type]}</span>
        </div>
        <h3 className="font-heading text-xl leading-snug text-espresso">
          <Link href={href} className="hover:text-ember">
            {product.name}
          </Link>
        </h3>
        {product.roastLevel && <RoastMeter level={product.roastLevel} className="text-sm text-muted-foreground" />}
        {product.tastingNotes.length > 0 && (
          <p className="text-sm text-muted-foreground">{product.tastingNotes.join(" · ")}</p>
        )}
        <div className="mt-auto flex items-center justify-between gap-3 pt-2">
          <p className="text-lg font-semibold text-espresso">
            <span className="sr-only">Price: </span>
            {formatPrice(product.priceCents)}
          </p>
          <AddToCartButton
            size="sm"
            product={{
              id: product.id,
              slug: product.slug,
              name: product.name,
              imageUrl: product.imageUrl,
              stock: product.stock,
            }}
            grind={product.type === "ACCESSORY" ? undefined : "WHOLE_BEAN"}
          />
        </div>
      </div>
    </article>
  );
}
