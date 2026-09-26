import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { getProductsForPricing } from "@/lib/products";
import { priceCart } from "@/lib/pricing";
import { grindLabels, type Grind } from "@/lib/cart/schema";
import { CheckoutError, type CheckoutInput } from "./schema";
import { getStripe, siteOrigin } from "./stripe";

export async function createCheckout(input: CheckoutInput) {
  const stripe = getStripe();
  const requestHash = createHash("sha256").update(JSON.stringify({
    items: input.items, total: input.expectedTotalCents,
  })).digest("hex");
  let order = await db.order.findUnique({ where: { checkoutKey: input.checkoutKey }, include: { items: true } });

  if (!order) {
    const products = await getProductsForPricing(input.items.map((item) => item.productId));
    const quote = priceCart(input.items, products);
    const quantities = new Map<string, number>();
    for (const line of quote.lines) quantities.set(line.productId, (quantities.get(line.productId) ?? 0) + line.quantity);
    if (quote.removedProductIds.length || quote.lines.some((line) => line.issue) ||
      products.some((product) => (quantities.get(product.id) ?? 0) > product.stock)) {
      throw new CheckoutError("Some items are unavailable in that quantity. Please update your cart.");
    }
    if (!quote.itemCount || quote.totalCents !== input.expectedTotalCents) {
      throw new CheckoutError("Prices have changed. Please refresh your cart and review the total.");
    }
    try {
      order = await db.order.create({
        data: {
          number: `EO-${randomBytes(8).toString("hex").toUpperCase()}`,
          checkoutKey: input.checkoutKey, requestHash, checkoutOrigin: siteOrigin(),
          subtotalCents: quote.subtotalCents, shippingCents: quote.shippingCents, totalCents: quote.totalCents,
          items: { create: quote.lines.map((line) => ({
            productId: line.productId, name: line.name, grind: line.grind,
            quantity: line.quantity, unitPriceCents: line.unitPriceCents,
          })) },
        }, include: { items: true },
      });
    } catch (error) {
      if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== "P2002") throw error;
      order = await db.order.findUniqueOrThrow({ where: { checkoutKey: input.checkoutKey }, include: { items: true } });
    }
  }
  if (order.requestHash !== requestHash) throw new CheckoutError("Your cart changed. Please try checkout again.");
  const maxAgeMinutes = order.stripeSessionId ? 55 : 25;
  if (order.status !== "PENDING" || Date.now() - order.createdAt.getTime() > maxAgeMinutes * 60_000) {
    throw new CheckoutError("This checkout has ended. Please start a new checkout.");
  }
  order.items.sort((a, b) => `${a.productId}:${a.grind ?? ""}`.localeCompare(`${b.productId}:${b.grind ?? ""}`));

  // Persisted snapshots make retries use exactly the same Stripe parameters.
  const session = order.stripeSessionId
    ? await stripe.checkout.sessions.retrieve(order.stripeSessionId)
    : await stripe.checkout.sessions.create({
        mode: "payment", payment_method_types: ["card"], locale: "en",
        client_reference_id: order.id, metadata: { orderId: order.id },
        success_url: `${order.checkoutOrigin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${order.checkoutOrigin}/checkout/cancel`,
        expires_at: Math.floor(order.createdAt.getTime() / 1000) + 3600,
        shipping_address_collection: { allowed_countries: ["US"] },
        line_items: order.items.map((item) => ({
          quantity: item.quantity,
          price_data: {
            currency: "usd", unit_amount: item.unitPriceCents,
            product_data: {
              name: item.name,
              ...(item.grind ? { description: grindLabels[item.grind as Grind] } : {}),
            },
          },
        })),
        shipping_options: [{ shipping_rate_data: {
          display_name: order.shippingCents ? "Standard US shipping" : "Free US shipping",
          type: "fixed_amount", fixed_amount: { amount: order.shippingCents, currency: "usd" },
        } }],
      }, { idempotencyKey: `checkout-${order.id}` });
  if (session.livemode || session.status !== "open" || !session.url) {
    throw new CheckoutError("This checkout is no longer available. Please start again.");
  }
  await db.order.update({ where: { id: order.id }, data: { stripeSessionId: session.id } });
  return { url: session.url, sessionId: session.id };
}
