"use client";

import { useId, useState } from "react";
import { Minus, Plus } from "lucide-react";
import { AddToCartButton, type CartProductRef } from "@/components/product/add-to-cart-button";
import { Button } from "@/components/ui/button";
import { GRIND_OPTIONS, grindLabels, MAX_QUANTITY_PER_LINE, type Grind } from "@/lib/cart/schema";

type Props = { product: CartProductRef; grindable: boolean };

export function ProductPurchase({ product, grindable }: Props) {
  const [grind, setGrind] = useState<Grind>("WHOLE_BEAN");
  const [quantity, setQuantity] = useState(1);
  const grindId = useId();
  const quantityId = useId();
  const max = Math.max(1, Math.min(product.stock, MAX_QUANTITY_PER_LINE));

  return (
    <div className="space-y-5">
      {grindable && (
        <div className="space-y-2">
          <label htmlFor={grindId} className="block text-sm font-semibold text-espresso">
            Grind
          </label>
          <select
            id={grindId}
            value={grind}
            onChange={(event) => setGrind(event.target.value as Grind)}
            className="h-11 w-full rounded-lg border border-input bg-card px-3 text-espresso focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          >
            {GRIND_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {grindLabels[option]}
              </option>
            ))}
          </select>
          <p className="text-xs text-muted-foreground">Whole bean stays fresh longest. We grind to order at no extra cost.</p>
        </div>
      )}

      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-2">
          <label htmlFor={quantityId} className="block text-sm font-semibold text-espresso">
            Quantity
          </label>
          <div className="flex h-12 items-center rounded-lg border border-input bg-card">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Decrease quantity"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              disabled={quantity <= 1}
            >
              <Minus aria-hidden="true" />
            </Button>
            <input
              id={quantityId}
              type="number"
              inputMode="numeric"
              min={1}
              max={max}
              value={quantity}
              onChange={(event) => {
                const next = Number(event.target.value);
                if (Number.isFinite(next)) setQuantity(Math.min(max, Math.max(1, Math.floor(next))));
              }}
              className="w-12 [appearance:textfield] bg-transparent text-center font-medium text-espresso focus-visible:outline-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Increase quantity"
              onClick={() => setQuantity((q) => Math.min(max, q + 1))}
              disabled={quantity >= max}
            >
              <Plus aria-hidden="true" />
            </Button>
          </div>
        </div>
        <AddToCartButton
          product={product}
          grind={grindable ? grind : undefined}
          quantity={quantity}
          size="lg"
          className="min-w-48 flex-1"
        />
      </div>
    </div>
  );
}
