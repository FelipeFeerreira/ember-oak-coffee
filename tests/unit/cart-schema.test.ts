import { describe, expect, it } from "vitest";
import { cartSchema, lineKey, MAX_CART_LINES, storedCartSchema } from "@/lib/cart/schema";

describe("cartSchema", () => {
  it("accepts a valid cart", () => {
    const result = cartSchema.safeParse({ items: [{ productId: "abc", quantity: 2, grind: "FILTER" }] });
    expect(result.success).toBe(true);
  });

  it.each([
    ["zero quantity", { productId: "abc", quantity: 0 }],
    ["fractional quantity", { productId: "abc", quantity: 1.5 }],
    ["huge quantity", { productId: "abc", quantity: 1000 }],
    ["unknown grind", { productId: "abc", quantity: 1, grind: "POWDER" }],
    ["empty product id", { productId: "", quantity: 1 }],
  ])("rejects %s", (_label, item) => {
    expect(cartSchema.safeParse({ items: [item] }).success).toBe(false);
  });

  it("rejects carts with too many lines", () => {
    const items = Array.from({ length: MAX_CART_LINES + 1 }, (_, i) => ({ productId: `p${i}`, quantity: 1 }));
    expect(cartSchema.safeParse({ items }).success).toBe(false);
  });

  it("strips unexpected fields such as a client-supplied price", () => {
    const result = cartSchema.parse({ items: [{ productId: "abc", quantity: 1, priceCents: 1 }] });
    expect(result.items[0]).not.toHaveProperty("priceCents");
  });
});

describe("storedCartSchema", () => {
  it("rejects malformed localStorage data", () => {
    expect(storedCartSchema.safeParse([{ productId: "abc" }]).success).toBe(false);
    expect(storedCartSchema.safeParse("not an array").success).toBe(false);
  });
});

describe("lineKey", () => {
  it("distinguishes the same product in different grinds", () => {
    expect(lineKey({ productId: "a", grind: "ESPRESSO" })).not.toBe(lineKey({ productId: "a", grind: "FILTER" }));
    expect(lineKey({ productId: "a" })).toBe("a:NONE");
  });
});
