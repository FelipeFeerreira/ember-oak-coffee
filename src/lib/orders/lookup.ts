import "server-only";
import { db } from "@/lib/db";
import { trackingSchema } from "@/lib/checkout/schema";

// Deliberately excludes addresses, email, payment identifiers and internal metadata.
const publicSelect = {
  number: true, status: true, createdAt: true, totalCents: true,
  subtotalCents: true, shippingCents: true, trackingNumber: true,
  items: { select: { name: true, grind: true, quantity: true, unitPriceCents: true } },
} as const;

export async function lookupOrder(input: unknown) {
  const parsed = trackingSchema.safeParse(input);
  if (!parsed.success) return null;
  return db.order.findFirst({
    where: { number: parsed.data.orderNumber, email: parsed.data.email }, select: publicSelect,
  });
}

export async function lookupSession(sessionId: string) {
  if (!/^cs_test_[a-zA-Z0-9_]{10,240}$/.test(sessionId)) return null;
  return db.order.findUnique({ where: { stripeSessionId: sessionId }, select: publicSelect });
}

export type PublicOrder = NonNullable<Awaited<ReturnType<typeof lookupOrder>>>;
