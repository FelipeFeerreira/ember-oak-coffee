"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { OrderDetails, type OrderDisplay } from "@/components/orders/order-details";
import { cart } from "@/lib/cart/store";
import { cartSchema } from "@/lib/cart/schema";

export function Confirmation({ sessionId }: { sessionId: string }) {
  const [order, setOrder] = useState<OrderDisplay | null>(null);
  const [waiting, setWaiting] = useState(true);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout>;
    let attempts = 0;
    async function poll() {
      try {
        const response = await fetch("/api/orders/confirmation", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId }), signal: controller.signal,
        });
        if (!response.ok) throw new Error("Confirmation unavailable.");
        const data = await response.json();
        if (controller.signal.aborted) return;
        if (data.order) setOrder(data.order);
        if (data.order && data.order.status !== "PENDING") {
          setWaiting(false);
          try {
            const attempt = JSON.parse(sessionStorage.getItem("ember-oak-checkout") ?? "null");
            if (attempt?.sessionId === sessionId && data.order.status !== "EXPIRED") {
              const purchased = cartSchema.safeParse({ items: JSON.parse(attempt.fingerprint).cartItems });
              if (purchased.success) cart.clearIfMatches(purchased.data.items);
              sessionStorage.removeItem("ember-oak-checkout");
            }
          } catch { /* An unavailable or edited browser store must not break confirmation. */ }
          return;
        }
      } catch { if (controller.signal.aborted) return; }
      attempts++;
      if (attempts < 15) timer = setTimeout(poll, 2000);
      else setWaiting(false);
    }
    void poll();
    return () => { controller.abort(); clearTimeout(timer); };
  }, [sessionId, retry]);

  return <div className="space-y-6">
    <div aria-live="polite">
      {order ? <OrderDetails order={order} /> : <div className="rounded-3xl border border-border bg-card p-8">
        <h2 className="text-2xl font-semibold">{waiting ? "Checking your payment…" : "Confirmation is not available yet"}</h2>
        <p className="mt-3 text-muted-foreground">We&apos;re waiting for a secure confirmation from our payment partner. Returning to this page does not confirm payment. If you already paid, please don&apos;t pay again.</p>
      </div>}
    </div>
    {(!order || order.status === "PENDING") && <Button variant="outline" disabled={waiting} onClick={() => { setWaiting(true); setRetry(retry + 1); }}>
      {waiting ? "Waiting for confirmation…" : "Check again"}
    </Button>}
    <div className="flex flex-wrap gap-3">
      <Button asChild><Link href="/track-order">Track your order</Link></Button>
      <Button asChild variant="outline"><Link href="/shop">Continue shopping</Link></Button>
    </div>
  </div>;
}
