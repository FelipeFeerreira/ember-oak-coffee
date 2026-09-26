"use client";

import { useRef, useState } from "react";
import { LockKeyhole } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCartItems } from "@/lib/cart/store";

export function CheckoutButton({ total, disabled }: { total?: number; disabled: boolean }) {
  const items = useCartItems();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const inFlight = useRef(false);
  const attempt = useRef<{ fingerprint: string; key: string; sessionId?: string } | null>(null);

  async function checkout() {
    if (inFlight.current || disabled || !total) return;
    inFlight.current = true;
    setBusy(true);
    setError("");
    const cartItems = items.map(({ productId, quantity, grind }) => ({ productId, quantity, grind }));
    const fingerprint = JSON.stringify({ cartItems, total });
    try {
      if (!attempt.current) {
        try { attempt.current = JSON.parse(sessionStorage.getItem("ember-oak-checkout") ?? "null"); } catch { /* Storage is optional. */ }
      }
      if (attempt.current?.fingerprint !== fingerprint) attempt.current = { fingerprint, key: crypto.randomUUID() };
      try { sessionStorage.setItem("ember-oak-checkout", JSON.stringify(attempt.current)); } catch { /* Retry key remains in memory. */ }
      const response = await fetch("/api/checkout", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: cartItems, expectedTotalCents: total, checkoutKey: attempt.current!.key }),
      });
      const result = await response.json();
      if (!response.ok) {
        if (response.status === 409) {
          attempt.current = null;
          try { sessionStorage.removeItem("ember-oak-checkout"); } catch { /* Storage is optional. */ }
        }
        throw new Error(result.error ?? "We could not open checkout. Please try again.");
      }
      const url = new URL(result.url);
      if (url.protocol !== "https:" || url.hostname !== "checkout.stripe.com") throw new Error("Checkout returned an invalid address.");
      attempt.current!.sessionId = result.sessionId;
      try { sessionStorage.setItem("ember-oak-checkout", JSON.stringify(attempt.current)); } catch { /* Storage is optional. */ }
      window.location.assign(url.href);
    } catch (error) {
      setError(error instanceof Error ? error.message : "We could not open checkout. Please try again.");
      setBusy(false);
      inFlight.current = false;
    }
  }

  return <>
    <Button size="lg" className="mt-6 w-full" disabled={disabled || busy} onClick={checkout}>
      <LockKeyhole aria-hidden="true" className="size-4" />
      {busy ? "Opening secure checkout…" : "Checkout securely"}
    </Button>
    {error && <p role="alert" className="mt-3 text-sm text-destructive">{error}</p>}
    <p className="mt-3 text-center text-xs text-muted-foreground">Stripe test mode · No real charges</p>
  </>;
}
