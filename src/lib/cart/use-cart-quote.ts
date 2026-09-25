"use client";

import { useEffect, useState } from "react";
import { lineKey, type StoredCartItem } from "@/lib/cart/schema";
import { cart } from "@/lib/cart/store";
import type { CartQuote } from "@/lib/pricing";

type QuoteState = { quote: CartQuote | null; loading: boolean; error: boolean };

/** The last server answer, tagged with the cart payload it was computed for. */
type Settled = { payload: string; quote: CartQuote | null; error: boolean };

/**
 * Asks the server to price the cart whenever it changes.
 * Also reconciles the local cart with the server's answer: products that no
 * longer exist are removed, and quantities above stock are lowered.
 */
export function useCartQuote(items: StoredCartItem[], ready: boolean): QuoteState {
  const [settled, setSettled] = useState<Settled>({ payload: "", quote: null, error: false });
  const payload = JSON.stringify(items.map(({ productId, quantity, grind }) => ({ productId, quantity, grind })));

  useEffect(() => {
    if (!ready) return;
    const controller = new AbortController();

    fetch("/api/cart/quote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: JSON.parse(payload) }),
      signal: controller.signal,
    })
      .then((res) => {
        if (!res.ok) throw new Error(`Quote failed: ${res.status}`);
        return res.json() as Promise<CartQuote>;
      })
      .then((quote) => {
        setSettled({ payload, quote, error: false });
        for (const id of quote.removedProductIds) {
          for (const item of items) if (item.productId === id) cart.remove(lineKey(item));
        }
        for (const line of quote.lines) {
          const local = items.find((item) => lineKey(item) === line.key);
          if (local && line.maxQuantity > 0 && local.quantity > line.maxQuantity) {
            cart.setQuantity(line.key, line.maxQuantity);
          }
        }
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setSettled((prev) => ({ payload, quote: prev.quote, error: true }));
      });

    return () => controller.abort();
    // `payload` captures everything relevant about `items`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [payload, ready]);

  // Still loading while the latest answer belongs to an older version of the cart.
  return { quote: settled.quote, loading: !ready || settled.payload !== payload, error: settled.error };
}
