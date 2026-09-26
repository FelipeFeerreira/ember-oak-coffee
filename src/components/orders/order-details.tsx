import { CheckCircle2, Clock3, Package, Truck } from "lucide-react";
import { formatPrice } from "@/lib/money";
import { grindLabels, type Grind } from "@/lib/cart/schema";
import type { PublicOrder } from "@/lib/orders/lookup";

export type OrderDisplay = Omit<PublicOrder, "createdAt"> & { createdAt: string | Date };

const statusCopy = {
  PENDING: ["Awaiting payment confirmation", "Your payment has not been confirmed yet. This page never marks an order as paid."],
  PAID: ["Payment confirmed", "Your test order is confirmed. In our real-store workflow, roasting and packing come next."],
  PAYMENT_REVIEW: ["Payment received · review needed", "Stock changed during checkout. Please contact support with your order number. Do not pay again."],
  EXPIRED: ["Checkout expired", "This checkout has expired without a confirmed payment. Your cart is still available."],
  SHIPPED: ["On its way", "Your order has been marked as shipped."],
  DELIVERED: ["Delivered", "Your order has been marked as delivered."],
} as const;

export function OrderDetails({ order }: { order: OrderDisplay }) {
  const [title, description] = statusCopy[order.status];
  const paid = ["PAID", "SHIPPED", "DELIVERED"].includes(order.status);
  const Icon = paid ? CheckCircle2 : Clock3;
  return <section className="rounded-3xl border border-border bg-card p-6 sm:p-8" aria-label="Order details">
    <div className="flex items-start gap-4">
      <Icon className="mt-1 size-8 shrink-0 text-ember" aria-hidden="true" />
      <div><p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">{order.number}</p>
        <h2 className="mt-2 text-3xl font-semibold">{title}</h2>
        <p className="mt-3 max-w-lg text-sm leading-relaxed text-muted-foreground">{description}</p>
      </div>
    </div>
    <p className="mt-6 rounded-xl bg-latte p-4 text-sm">This is a fictional demo store. No real order will be shipped.</p>
    {paid && <ol className="my-7 grid grid-cols-3 gap-3 text-center text-xs" aria-label="Order progress">
      {[{ icon: CheckCircle2, label: "Confirmed", done: true },
        { icon: Package, label: "Shipped", done: ["SHIPPED", "DELIVERED"].includes(order.status) },
        { icon: Truck, label: "Delivered", done: order.status === "DELIVERED" }].map((step) =>
        <li key={step.label} className={step.done ? "font-semibold text-ember" : "text-muted-foreground"}>
          <step.icon className="mx-auto mb-2 size-6" aria-hidden="true" />{step.label}{step.done ? " ✓" : ""}
        </li>)}
    </ol>}
    <ul className="mt-6 divide-y divide-border">
      {order.items.map((item, index) => <li key={index} className="flex justify-between gap-4 py-4 text-sm">
        <div><p className="font-semibold">{item.quantity} × {item.name}</p>
          {item.grind && <p className="mt-1 text-muted-foreground">{grindLabels[item.grind as Grind] ?? item.grind}</p>}</div>
        <span className="shrink-0">{formatPrice(item.quantity * item.unitPriceCents)}</span>
      </li>)}
    </ul>
    <dl className="space-y-3 border-t border-border pt-5 text-sm">
      <div className="flex justify-between"><dt>Subtotal</dt><dd>{formatPrice(order.subtotalCents)}</dd></div>
      <div className="flex justify-between"><dt>Shipping</dt><dd>{order.shippingCents ? formatPrice(order.shippingCents) : "Free"}</dd></div>
      <div className="flex justify-between text-lg font-semibold"><dt>Total</dt><dd>{formatPrice(order.totalCents)}</dd></div>
      {order.trackingNumber && <div className="flex flex-wrap justify-between gap-3"><dt>Tracking number</dt><dd>{order.trackingNumber}</dd></div>}
    </dl>
  </section>;
}
