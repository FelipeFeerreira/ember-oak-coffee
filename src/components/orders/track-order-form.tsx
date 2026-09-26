"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { OrderDetails, type OrderDisplay } from "./order-details";

export function TrackOrderForm() {
  const [order, setOrder] = useState<OrderDisplay | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true); setError(""); setOrder(null);
    const fields = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/orders/track", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderNumber: fields.get("orderNumber"), email: fields.get("email") }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      setOrder(result.order);
    } catch (error) {
      setError(error instanceof Error ? error.message : "We could not look up your order. Please try again.");
    } finally { setBusy(false); }
  }
  return <div className="space-y-8">
    <form onSubmit={submit} className="space-y-5 rounded-3xl border border-border bg-card p-6 sm:p-8">
      <div className="space-y-2"><Label htmlFor="orderNumber">Order number</Label>
        <Input id="orderNumber" name="orderNumber" placeholder="EO-0123456789ABCDEF" required maxLength={19} autoCapitalize="characters" spellCheck={false} />
        <p className="text-xs text-muted-foreground">Find this on your confirmation page or email.</p>
      </div>
      <div className="space-y-2"><Label htmlFor="email">Email used at checkout</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required maxLength={254} />
      </div>
      <Button type="submit" size="lg" className="w-full" disabled={busy}>{busy ? "Finding your order…" : "Find my order"}</Button>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    </form>
    <div aria-live="polite">{order && <OrderDetails order={order} />}</div>
  </div>;
}
