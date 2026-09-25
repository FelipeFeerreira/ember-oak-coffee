import { z } from "zod";

/** Grind options offered for coffee and coffee bundles. */
export const GRIND_OPTIONS = ["WHOLE_BEAN", "ESPRESSO", "FILTER", "FRENCH_PRESS", "COLD_BREW"] as const;
export type Grind = (typeof GRIND_OPTIONS)[number];

export const grindLabels: Record<Grind, string> = {
  WHOLE_BEAN: "Whole bean",
  ESPRESSO: "Fine (espresso)",
  FILTER: "Medium (drip & pour-over)",
  FRENCH_PRESS: "Coarse (French press)",
  COLD_BREW: "Extra coarse (cold brew)",
};

/** Maximum units of a single product per order line. */
export const MAX_QUANTITY_PER_LINE = 10;
/** Maximum distinct lines in a cart — a cheap guard against abuse. */
export const MAX_CART_LINES = 30;

export const cartItemSchema = z.object({
  productId: z.string().min(1).max(64),
  quantity: z.number().int().min(1).max(99),
  grind: z.enum(GRIND_OPTIONS).optional(),
});

export type CartItemInput = z.infer<typeof cartItemSchema>;

export const cartSchema = z.object({
  items: z.array(cartItemSchema).max(MAX_CART_LINES),
});

/**
 * What the browser keeps in localStorage. Name, slug and image are a display
 * snapshot only — prices are never stored or trusted from the browser.
 */
export const storedCartItemSchema = cartItemSchema.extend({
  name: z.string().max(200),
  slug: z.string().max(200),
  imageUrl: z.string().max(500),
});

export type StoredCartItem = z.infer<typeof storedCartItemSchema>;

export const storedCartSchema = z.array(storedCartItemSchema).max(MAX_CART_LINES);

/** A cart line is identified by product + grind: the same coffee in two grinds is two lines. */
export function lineKey(item: { productId: string; grind?: Grind }): string {
  return `${item.productId}:${item.grind ?? "NONE"}`;
}
