import { describe, expect, it } from "vitest";
import { checkoutSchema, trackingSchema } from "@/lib/checkout/schema";

describe("checkout input", () => {
  const valid = { items: [{ productId: "coffee", quantity: 1 }], checkoutKey: "a7651e1c-2bd4-4a41-965c-21f80d730c94", expectedTotalCents: 2500 };
  it("rejects empty carts, fractional quantities and invalid retry keys", () => {
    expect(checkoutSchema.safeParse({ ...valid, items: [] }).success).toBe(false);
    expect(checkoutSchema.safeParse({ ...valid, items: [{ productId: "coffee", quantity: 1.5 }] }).success).toBe(false);
    expect(checkoutSchema.safeParse({ ...valid, checkoutKey: "untrusted" }).success).toBe(false);
  });
  it("discards client price fields", () => {
    expect(checkoutSchema.parse({ ...valid, items: [{ productId: "coffee", quantity: 1, priceCents: 1 }] }).items[0]).not.toHaveProperty("priceCents");
  });
  it("normalizes order credentials and requires both fields", () => {
    expect(trackingSchema.parse({ orderNumber: " eo-0123456789abcdef ", email: "TEST@example.com" })).toEqual({ orderNumber: "EO-0123456789ABCDEF", email: "test@example.com" });
    expect(trackingSchema.safeParse({ orderNumber: "EO-0123456789ABCDEF" }).success).toBe(false);
  });
});
