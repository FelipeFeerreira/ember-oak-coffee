import { describe, expect, it } from "vitest";
import { MAX_QUANTITY_PER_LINE } from "@/lib/cart/schema";
import {
  FLAT_SHIPPING_CENTS,
  FREE_SHIPPING_THRESHOLD_CENTS,
  priceCart,
  shippingFor,
  type PricingProduct,
} from "@/lib/pricing";

const coffee: PricingProduct = {
  id: "coffee-1",
  slug: "huila-hearth",
  name: "Huila Hearth",
  type: "COFFEE",
  priceCents: 1900,
  stock: 50,
  imageUrl: "/x.webp",
};

const grinder: PricingProduct = {
  id: "gear-1",
  slug: "grinder",
  name: "Hand Grinder",
  type: "ACCESSORY",
  priceCents: 6400,
  stock: 3,
  imageUrl: "/y.webp",
};

describe("shippingFor", () => {
  it("charges flat-rate shipping below the free-shipping threshold", () => {
    expect(shippingFor(FREE_SHIPPING_THRESHOLD_CENTS - 1)).toBe(FLAT_SHIPPING_CENTS);
  });

  it("ships free at exactly the threshold and above", () => {
    expect(shippingFor(FREE_SHIPPING_THRESHOLD_CENTS)).toBe(0);
    expect(shippingFor(FREE_SHIPPING_THRESHOLD_CENTS + 1)).toBe(0);
  });

  it("charges nothing for an empty cart", () => {
    expect(shippingFor(0)).toBe(0);
  });
});

describe("priceCart", () => {
  it("uses database prices and adds shipping", () => {
    const quote = priceCart([{ productId: "coffee-1", quantity: 2, grind: "FILTER" }], [coffee]);

    expect(quote.lines).toHaveLength(1);
    expect(quote.lines[0]).toMatchObject({ unitPriceCents: 1900, quantity: 2, lineTotalCents: 3800, grind: "FILTER" });
    expect(quote.subtotalCents).toBe(3800);
    expect(quote.shippingCents).toBe(FLAT_SHIPPING_CENTS);
    expect(quote.totalCents).toBe(3800 + FLAT_SHIPPING_CENTS);
    expect(quote.freeShippingRemainingCents).toBe(FREE_SHIPPING_THRESHOLD_CENTS - 3800);
  });

  it("ignores any price-like field sent by the client", () => {
    const tampered = { productId: "coffee-1", quantity: 1, priceCents: 1 } as never;
    const quote = priceCart([tampered], [coffee]);
    expect(quote.totalCents).toBe(1900 + FLAT_SHIPPING_CENTS);
  });

  it("ships free once the subtotal reaches the threshold", () => {
    const quote = priceCart([{ productId: "gear-1", quantity: 1 }], [grinder]);
    expect(quote.shippingCents).toBe(0);
    expect(quote.totalCents).toBe(6400);
  });

  it("merges duplicate lines for the same product and grind", () => {
    const quote = priceCart(
      [
        { productId: "coffee-1", quantity: 1, grind: "ESPRESSO" },
        { productId: "coffee-1", quantity: 2, grind: "ESPRESSO" },
        { productId: "coffee-1", quantity: 1, grind: "WHOLE_BEAN" },
      ],
      [coffee],
    );
    expect(quote.lines).toHaveLength(2);
    expect(quote.lines.find((l) => l.grind === "ESPRESSO")?.quantity).toBe(3);
    expect(quote.itemCount).toBe(4);
  });

  it("drops the grind option for accessories", () => {
    const quote = priceCart([{ productId: "gear-1", quantity: 1, grind: "ESPRESSO" }], [grinder]);
    expect(quote.lines[0].grind).toBeUndefined();
  });

  it("clamps quantity to available stock and flags it", () => {
    const quote = priceCart([{ productId: "gear-1", quantity: 5 }], [grinder]);
    expect(quote.lines[0]).toMatchObject({ quantity: 3, maxQuantity: 3, issue: "QUANTITY_REDUCED" });
    expect(quote.subtotalCents).toBe(3 * 6400);
  });

  it("clamps quantity to the per-line maximum", () => {
    const quote = priceCart([{ productId: "coffee-1", quantity: 40 }], [coffee]);
    expect(quote.lines[0].quantity).toBe(MAX_QUANTITY_PER_LINE);
  });

  it("prices out-of-stock items at zero and flags them", () => {
    const quote = priceCart([{ productId: "gear-1", quantity: 1 }], [{ ...grinder, stock: 0 }]);
    expect(quote.lines[0]).toMatchObject({ quantity: 0, lineTotalCents: 0, issue: "OUT_OF_STOCK" });
    expect(quote.totalCents).toBe(0);
  });

  it("reports products that no longer exist instead of pricing them", () => {
    const quote = priceCart([{ productId: "deleted", quantity: 1 }], [coffee]);
    expect(quote.lines).toHaveLength(0);
    expect(quote.removedProductIds).toEqual(["deleted"]);
    expect(quote.totalCents).toBe(0);
  });
});
