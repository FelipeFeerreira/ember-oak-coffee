import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Checkout paused", robots: { index: false } };

export default function CheckoutCancelPage() {
  return <div className="mx-auto max-w-xl px-4 py-20 text-center">
    <p className="text-sm font-semibold tracking-widest text-ember uppercase">Take your time</p>
    <h1 className="mt-4 text-4xl font-semibold">Your cart is saved</h1>
    <p className="mt-5 text-muted-foreground">You left checkout before returning to the store. Review your cart whenever you&apos;re ready. If you already submitted a payment, check your order status before trying again.</p>
    <div className="mt-8 flex flex-wrap justify-center gap-3">
      <Button asChild size="lg"><Link href="/cart">Return to cart</Link></Button>
      <Button asChild variant="outline" size="lg"><Link href="/track-order">Track your order</Link></Button>
    </div>
  </div>;
}
