import { z } from "zod";
import { cartItemSchema, MAX_CART_LINES } from "@/lib/cart/schema";

export const checkoutSchema = z.object({
  items: z.array(cartItemSchema).min(1).max(MAX_CART_LINES),
  checkoutKey: z.uuid(),
  // Used only to detect a changed quote, never to set the amount charged.
  expectedTotalCents: z.number().int().positive().max(100_000_000),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;

export const trackingSchema = z.object({
  orderNumber: z.string().trim().toUpperCase().regex(/^EO-[A-F0-9]{16}$/),
  email: z.string().trim().toLowerCase().pipe(z.email().max(254)),
});

export class CheckoutError extends Error {
  constructor(message: string, public status = 409) {
    super(message);
  }
}
