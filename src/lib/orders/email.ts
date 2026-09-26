import "server-only";
import { Resend } from "resend";
import { db } from "@/lib/db";
import { formatPrice } from "@/lib/money";
import { grindLabels, type Grind } from "@/lib/cart/schema";

export async function sendOrderEmail(orderId: string) {
  // Serialize email delivery separately from payment/stock. A delivery failure never undoes payment.
  // Resend's idempotency key also covers a process crash between send and emailSentAt.
  await db.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT "id" FROM "Order" WHERE "id" = ${orderId} FOR UPDATE`;
    const order = await tx.order.findUniqueOrThrow({ where: { id: orderId }, include: { items: true } });
    if (!order.paidAt || !order.email || order.emailSentAt) return;
    const review = order.status === "PAYMENT_REVIEW";
    const subject = `${review ? "Payment received — order under review" : "Order confirmed"}: ${order.number}`;
    const text = [
      "Ember & Oak Coffee Roasters", "",
      "Demo store: this is a test purchase. No real order will be shipped.", "",
      review ? "Your test payment was received, but stock changed during checkout. Your order needs manual review. Please contact support; do not pay again."
        : "Thank you! Your test payment is confirmed.",
      `Order: ${order.number}`, "",
      ...order.items.map((item) => `${item.quantity} x ${item.name}${item.grind ? ` (${grindLabels[item.grind as Grind]})` : ""} — ${formatPrice(item.unitPriceCents * item.quantity)}`),
      "", `Subtotal: ${formatPrice(order.subtotalCents)}`, `Shipping: ${formatPrice(order.shippingCents)}`,
      `Total: ${formatPrice(order.totalCents)}`, "",
      `Track your order: ${order.checkoutOrigin}/track-order`,
      "Enter your order number and the email used at checkout.",
      "Questions? hello@emberandoak.example",
    ].join("\n");
    if (!process.env.RESEND_API_KEY) {
      console.info("[email:local-preview]", { to: order.email, subject, text });
    } else {
      const resend = new Resend(process.env.RESEND_API_KEY);
      const { error } = await resend.emails.send({
        from: process.env.RESEND_FROM ?? "Ember & Oak <onboarding@resend.dev>",
        to: order.email, subject, text,
      }, { idempotencyKey: `order-confirmation-${order.id}` });
      if (error) throw new Error("Confirmation email delivery failed.");
    }
    await tx.order.update({ where: { id: order.id }, data: { emailSentAt: new Date() } });
  }, { timeout: 15_000 });
}
