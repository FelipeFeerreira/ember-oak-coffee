"use client";

import Image from "next/image";
import Link from "next/link";
import { AddToCartButton } from "@/components/product/add-to-cart-button";
import { formatPrice } from "@/lib/money";
import type { ChatProduct } from "@/lib/chat/schema";

export function ChatProductCard({ product, messageId, onNavigate }: { product: ChatProduct; messageId: string; onNavigate?: () => void }) {
  function recordAdd() {
    void fetch("/api/chat/conversion", { method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messageId, productId: product.id }), keepalive: true,
    }).catch(() => {}); // Analytics must never prevent adding a product to the cart.
  }
  return <article className="overflow-hidden rounded-2xl border border-border bg-card" data-testid="chat-product-card">
    <div className="flex gap-3 p-3">
      <Link href={`/shop/${product.slug}`} onClick={onNavigate} className="relative size-20 shrink-0 overflow-hidden rounded-xl bg-latte" aria-label={`View ${product.name}`}>
        <Image src={product.imageUrl} alt={product.imageAlt} fill sizes="80px" className="object-cover" />
      </Link>
      <div className="min-w-0 flex-1">
        <Link href={`/shop/${product.slug}`} onClick={onNavigate} className="font-heading text-lg font-semibold hover:text-ember">{product.name}</Link>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{product.tastingNotes.length ? product.tastingNotes.join(" · ") : product.tagline}</p>
        <p className="mt-2 font-semibold" data-testid="chat-product-price">{formatPrice(product.priceCents)}</p>
      </div>
    </div>
    <div className="flex items-center justify-between gap-2 border-t border-border px-3 py-2">
      <span className="text-xs text-muted-foreground">{product.stock > 0 ? "In stock" : "Sold out"}</span>
      <AddToCartButton product={product} grind={product.type === "ACCESSORY" ? undefined : "WHOLE_BEAN"} size="sm" onAdded={recordAdd} />
    </div>
  </article>;
}
