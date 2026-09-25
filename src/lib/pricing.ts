import { lineKey, MAX_QUANTITY_PER_LINE, type CartItemInput, type Grind } from "@/lib/cart/schema";

/** Orders at or above this subtotal ship free. */
export const FREE_SHIPPING_THRESHOLD_CENTS = 5000;
/** Flat-rate US shipping below the free-shipping threshold. */
export const FLAT_SHIPPING_CENTS = 600;

/** The product fields pricing needs, as loaded from the database. */
export type PricingProduct = {
  id: string;
  slug: string;
  name: string;
  type: "COFFEE" | "BUNDLE" | "ACCESSORY";
  priceCents: number;
  stock: number;
  imageUrl: string;
};

export type QuoteIssue = "UNAVAILABLE" | "OUT_OF_STOCK" | "QUANTITY_REDUCED";

export type QuoteLine = {
  key: string;
  productId: string;
  slug: string;
  name: string;
  imageUrl: string;
  grind?: Grind;
  unitPriceCents: number;
  quantity: number;
  lineTotalCents: number;
  maxQuantity: number;
  issue?: QuoteIssue;
};

export type CartQuote = {
  lines: QuoteLine[];
  /** Items that could not be priced at all (deleted products). */
  removedProductIds: string[];
  itemCount: number;
  subtotalCents: number;
  shippingCents: number;
  totalCents: number;
  freeShippingRemainingCents: number;
};

export function shippingFor(subtotalCents: number): number {
  if (subtotalCents === 0 || subtotalCents >= FREE_SHIPPING_THRESHOLD_CENTS) return 0;
  return FLAT_SHIPPING_CENTS;
}

/**
 * Prices a cart using product data from the database.
 *
 * This is the only place totals are calculated. The browser sends product
 * IDs and quantities; everything with a dollar sign comes from `products`.
 * Quantities are clamped to available stock, duplicate lines are merged,
 * and grind is dropped for products that cannot be ground.
 */
export function priceCart(items: CartItemInput[], products: PricingProduct[]): CartQuote {
  const byId = new Map(products.map((p) => [p.id, p]));
  const merged = new Map<string, QuoteLine>();
  const removedProductIds: string[] = [];

  for (const item of items) {
    const product = byId.get(item.productId);
    if (!product) {
      removedProductIds.push(item.productId);
      continue;
    }

    const grind = product.type === "ACCESSORY" ? undefined : item.grind;
    const key = lineKey({ productId: product.id, grind });
    const requested = (merged.get(key)?.quantity ?? 0) + item.quantity;
    const maxQuantity = Math.max(0, Math.min(product.stock, MAX_QUANTITY_PER_LINE));
    const quantity = Math.min(requested, maxQuantity);

    let issue: QuoteIssue | undefined;
    if (maxQuantity === 0) issue = "OUT_OF_STOCK";
    else if (quantity < requested) issue = "QUANTITY_REDUCED";

    merged.set(key, {
      key,
      productId: product.id,
      slug: product.slug,
      name: product.name,
      imageUrl: product.imageUrl,
      grind,
      unitPriceCents: product.priceCents,
      quantity,
      lineTotalCents: product.priceCents * quantity,
      maxQuantity,
      issue,
    });
  }

  const lines = [...merged.values()];
  const subtotalCents = lines.reduce((sum, line) => sum + line.lineTotalCents, 0);
  const shippingCents = shippingFor(subtotalCents);

  return {
    lines,
    removedProductIds,
    itemCount: lines.reduce((sum, line) => sum + line.quantity, 0),
    subtotalCents,
    shippingCents,
    totalCents: subtotalCents + shippingCents,
    freeShippingRemainingCents:
      subtotalCents === 0 ? FREE_SHIPPING_THRESHOLD_CENTS : Math.max(0, FREE_SHIPPING_THRESHOLD_CENTS - subtotalCents),
  };
}
