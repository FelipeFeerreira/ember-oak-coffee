"use client";

import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { useCartCount } from "@/lib/cart/store";
import { cn } from "@/lib/utils";

export function CartLink() {
  const count = useCartCount();
  const label = count === 0 ? "Cart, empty" : `Cart, ${count} ${count === 1 ? "item" : "items"}`;

  return (
    <Link
      href="/cart"
      aria-label={label}
      className="relative inline-flex size-11 items-center justify-center rounded-full text-espresso transition-colors hover:bg-latte"
    >
      <ShoppingBag className="size-5" aria-hidden="true" />
      <span
        aria-hidden="true"
        className={cn(
          "absolute top-1 right-0.5 flex min-w-5 items-center justify-center rounded-full bg-ember px-1 text-[0.7rem] leading-5 font-semibold text-ember-foreground transition-transform",
          count === 0 && "scale-0",
        )}
        data-testid="cart-count"
      >
        {count}
      </span>
    </Link>
  );
}
