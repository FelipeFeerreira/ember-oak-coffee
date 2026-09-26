import type { Metadata } from "next";
import Link from "next/link";
import { Confirmation } from "@/components/checkout/confirmation";

export const metadata: Metadata = { title: "Order confirmation", robots: { index: false, follow: false }, referrer: "no-referrer" };

export default async function SuccessPage({ searchParams }: { searchParams: Promise<{ session_id?: string | string[] }> }) {
  const { session_id: sessionId } = await searchParams;
  return <div className="mx-auto max-w-2xl px-4 py-14 sm:px-6">
    <p className="text-xs font-semibold tracking-widest text-ember uppercase">Thank you for stopping by</p>
    <h1 className="mt-3 mb-8 text-4xl font-semibold">Your order</h1>
    {typeof sessionId === "string" && /^cs_test_[a-zA-Z0-9_]{10,240}$/.test(sessionId)
      ? <Confirmation sessionId={sessionId} />
      : <p>No checkout session was provided. <Link className="underline" href="/track-order">Track your order using your order number and email.</Link></p>}
  </div>;
}
