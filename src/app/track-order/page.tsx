import type { Metadata } from "next";
import { TrackOrderForm } from "@/components/orders/track-order-form";

export const metadata: Metadata = { title: "Track your order", robots: { index: false, follow: false } };

export default function TrackOrderPage() {
  return <div className="mx-auto max-w-2xl px-4 py-14 sm:px-6">
    <p className="text-xs font-semibold tracking-[0.2em] text-ember uppercase">From our roastery to your door</p>
    <h1 className="mt-3 text-4xl font-semibold sm:text-5xl">Track your order</h1>
    <p className="mt-4 mb-8 leading-relaxed text-muted-foreground">A little peace of mind, with every cup. Enter your order number and checkout email to see the latest status.</p>
    <TrackOrderForm />
  </div>;
}
