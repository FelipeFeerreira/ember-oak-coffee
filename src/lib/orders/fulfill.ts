import "server-only";
import type Stripe from "stripe";
import { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";

const supportedEvents = new Set(["checkout.session.completed", "checkout.session.expired"]);

/** Called only after verification of the raw request body by the webhook route. */
export async function processStripeEvent(event: Stripe.Event): Promise<string | null> {
  if (event.livemode) throw new Error("Live events are not accepted by this demo.");
  if (!supportedEvents.has(event.type)) return null;
  const session = event.data.object as Stripe.Checkout.Session;
  const orderId = session.metadata?.orderId;
  if (!orderId) return null; // Another application may share this Stripe test account.
  if (session.livemode || session.mode !== "payment" || session.client_reference_id !== orderId) {
    throw new Error("The Checkout Session does not match the order.");
  }

  return db.$transaction(async (tx) => {
    // Lock the order before inspecting its status: duplicate and concurrent events serialize here.
    await tx.$queryRaw`SELECT "id" FROM "Order" WHERE "id" = ${orderId} FOR UPDATE`;
    const order = await tx.order.findUniqueOrThrow({ where: { id: orderId }, include: { items: true } });
    if (order.stripeSessionId && order.stripeSessionId !== session.id) throw new Error("Session mismatch.");
    if (await tx.stripeEvent.findUnique({ where: { id: event.id } })) return order.id;

    if (event.type === "checkout.session.expired") {
      if (order.status === "PENDING") {
        await tx.order.update({ where: { id: order.id }, data: { status: "EXPIRED", stripeSessionId: session.id } });
      }
    } else if (session.payment_status === "paid") {
      if (session.amount_total !== order.totalCents || session.currency !== order.currency) {
        throw new Error("Payment amount or currency mismatch.");
      }
      if (order.status === "PENDING" || order.status === "EXPIRED") {
        const email = session.customer_details?.email?.trim().toLowerCase();
        if (!email || email.length > 254) throw new Error("The paid session has no valid customer email.");
        const quantities = new Map<string, number>();
        for (const item of order.items) quantities.set(item.productId, (quantities.get(item.productId) ?? 0) + item.quantity);
        // A single sorted lock query avoids deadlocks when two baskets contain the same products.
        const products = await tx.$queryRaw<{ id: string; stock: number }[]>(Prisma.sql`
          SELECT "id", "stock" FROM "Product"
          WHERE "id" IN (${Prisma.join([...quantities.keys()])}) ORDER BY "id" FOR UPDATE`);
        const available = products.length === quantities.size &&
          products.every((product) => product.stock >= quantities.get(product.id)!);
        if (available) {
          for (const product of products) {
            await tx.product.update({ where: { id: product.id }, data: { stock: { decrement: quantities.get(product.id)! } } });
          }
        }
        // A payment may finish after another buyer takes the last unit. Never create negative stock
        // or claim fulfillment succeeded. Keep the payment visible for manual resolution.
        await tx.order.update({ where: { id: order.id }, data: {
          status: available ? "PAID" : "PAYMENT_REVIEW", paidAt: new Date(event.created * 1000),
          stripeSessionId: session.id,
          paymentIntentId: typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id,
          email, customerName: session.customer_details?.name,
          shippingAddress: session.collected_information?.shipping_details
            ? JSON.parse(JSON.stringify(session.collected_information.shipping_details)) as Prisma.InputJsonValue
            : Prisma.DbNull,
        } });
      }
    }
    await tx.stripeEvent.create({ data: { id: event.id, orderId: order.id } });
    return order.id;
  }, { timeout: 10_000 });
}
