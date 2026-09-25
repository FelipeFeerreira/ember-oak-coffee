"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Grind } from "@/lib/cart/schema";
import { cart } from "@/lib/cart/store";

export type CartProductRef = {
  id: string;
  slug: string;
  name: string;
  imageUrl: string;
  stock: number;
};

type Props = {
  product: CartProductRef;
  grind?: Grind;
  quantity?: number;
  size?: "default" | "sm" | "lg";
  className?: string;
  /** Called after the item is added — used later to record chat conversions. */
  onAdded?: () => void;
};

export function AddToCartButton({ product, grind, quantity = 1, size = "default", className, onAdded }: Props) {
  const router = useRouter();
  const soldOut = product.stock <= 0;

  function handleClick() {
    cart.add({ productId: product.id, slug: product.slug, name: product.name, imageUrl: product.imageUrl, grind }, quantity);
    onAdded?.();
    toast.success(`${product.name} added to your cart`, {
      action: { label: "View cart", onClick: () => router.push("/cart") },
    });
  }

  return (
    <Button
      size={size}
      className={className}
      onClick={handleClick}
      disabled={soldOut}
      aria-label={soldOut ? `${product.name} is sold out` : `Add ${product.name} to cart`}
    >
      <ShoppingBag aria-hidden="true" />
      {soldOut ? "Sold out" : "Add to cart"}
    </Button>
  );
}
