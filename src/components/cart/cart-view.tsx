"use client";

import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { grindLabels, lineKey } from "@/lib/cart/schema";
import { cart, useCartItems, useCartReady } from "@/lib/cart/store";
import { useCartQuote } from "@/lib/cart/use-cart-quote";
import { formatPrice } from "@/lib/money";
import { FREE_SHIPPING_THRESHOLD_CENTS, type CartQuote, type QuoteLine } from "@/lib/pricing";

export function CartView() {
  const items = useCartItems();
  const ready = useCartReady();
  const { quote, loading, error } = useCartQuote(items, ready);

  if (!ready) {
    return <CartSkeleton />;
  }

  if (items.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-border bg-card px-6 py-20 text-center">
        <h2 className="text-3xl font-semibold">Your cart is empty</h2>
        <p className="mx-auto mt-3 max-w-md text-muted-foreground">
          Not sure where to start? Huila Hearth is our crowd-pleaser, or try the Tasting Flight to explore three roasts.
        </p>
        <Button asChild size="lg" className="mt-8">
          <Link href="/shop">Browse coffee</Link>
        </Button>
      </div>
    );
  }

  const linesByKey = new Map(quote?.lines.map((line) => [line.key, line]));

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_360px]">
      <section aria-labelledby="cart-items-heading">
        <h2 id="cart-items-heading" className="sr-only">
          Items in your cart
        </h2>
        <ul className="divide-y divide-border rounded-2xl border border-border bg-card">
          {items.map((item) => {
            const key = lineKey(item);
            const line = linesByKey.get(key);
            return (
              <li key={key} className="flex gap-4 p-4 sm:gap-6 sm:p-6" data-testid="cart-line">
                <Link
                  href={`/shop/${item.slug}`}
                  className="relative size-24 shrink-0 overflow-hidden rounded-xl bg-latte sm:size-28"
                  tabIndex={-1}
                  aria-hidden="true"
                >
                  <Image src={item.imageUrl} alt="" fill sizes="112px" className="object-cover" />
                </Link>
                <div className="flex min-w-0 flex-1 flex-col gap-2">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-heading text-lg leading-snug">
                        <Link href={`/shop/${item.slug}`} className="hover:text-ember">
                          {item.name}
                        </Link>
                      </h3>
                      {item.grind && <p className="text-sm text-muted-foreground">{grindLabels[item.grind]}</p>}
                    </div>
                    <div className="text-right font-semibold text-espresso">
                      {line ? formatPrice(line.lineTotalCents) : <Skeleton className="h-5 w-16" />}
                    </div>
                  </div>
                  {line && <LineIssue line={line} />}
                  <div className="mt-auto flex items-center justify-between gap-3">
                    <QuantityControl
                      name={item.name}
                      quantity={item.quantity}
                      max={line?.maxQuantity}
                      onChange={(q) => cart.setQuantity(key, q)}
                    />
                    <div className="flex items-center gap-3">
                      {line && line.quantity > 1 && (
                        <span className="hidden text-sm text-muted-foreground sm:inline">
                          {formatPrice(line.unitPriceCents)} each
                        </span>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Remove ${item.name} from cart`}
                        onClick={() => cart.remove(key)}
                      >
                        <Trash2 aria-hidden="true" />
                      </Button>
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
        <Link href="/shop" className="mt-6 inline-block text-sm font-medium text-espresso hover:text-ember">
          ← Continue shopping
        </Link>
      </section>

      <OrderSummary quote={quote} loading={loading} error={error} />
    </div>
  );
}

function LineIssue({ line }: { line: QuoteLine }) {
  if (line.issue === "OUT_OF_STOCK") {
    return <p className="text-sm font-medium text-destructive">Sold out — please remove this item.</p>;
  }
  if (line.issue === "QUANTITY_REDUCED") {
    return (
      <p className="text-sm font-medium text-ember">
        Only {line.maxQuantity} available — we&apos;ve adjusted your quantity.
      </p>
    );
  }
  return null;
}

function QuantityControl({
  name,
  quantity,
  max,
  onChange,
}: {
  name: string;
  quantity: number;
  max?: number;
  onChange: (quantity: number) => void;
}) {
  return (
    <div className="flex h-10 items-center rounded-lg border border-input" role="group" aria-label={`Quantity of ${name}`}>
      <Button
        variant="ghost"
        size="icon"
        aria-label={`Decrease quantity of ${name}`}
        onClick={() => onChange(quantity - 1)}
      >
        <Minus aria-hidden="true" />
      </Button>
      <span className="w-8 text-center text-sm font-medium" aria-live="polite">
        {quantity}
      </span>
      <Button
        variant="ghost"
        size="icon"
        aria-label={`Increase quantity of ${name}`}
        onClick={() => onChange(quantity + 1)}
        disabled={max !== undefined && quantity >= max}
      >
        <Plus aria-hidden="true" />
      </Button>
    </div>
  );
}

function OrderSummary({ quote, loading, error }: { quote: CartQuote | null; loading: boolean; error: boolean }) {
  const progress = quote ? Math.min(100, (quote.subtotalCents / FREE_SHIPPING_THRESHOLD_CENTS) * 100) : 0;

  return (
    <aside aria-labelledby="summary-heading" className="h-fit rounded-2xl border border-border bg-card p-6 lg:sticky lg:top-32">
      <h2 id="summary-heading" className="text-2xl font-semibold">
        Order summary
      </h2>

      {quote && (
        <div className="mt-5 rounded-xl bg-latte/70 p-4">
          <p className="text-sm text-espresso">
            {quote.freeShippingRemainingCents > 0 ? (
              <>
                You&apos;re <strong>{formatPrice(quote.freeShippingRemainingCents)}</strong> away from free shipping.
              </>
            ) : (
              <strong>You&apos;ve unlocked free shipping.</strong>
            )}
          </p>
          <div
            className="mt-3 h-2 overflow-hidden rounded-full bg-cream"
            role="progressbar"
            aria-label="Progress toward free shipping"
            aria-valuenow={Math.round(progress)}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div className="h-full rounded-full bg-ember transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}

      <dl className="mt-6 space-y-3 text-sm" aria-busy={loading}>
        <SummaryRow label="Subtotal" value={quote?.subtotalCents} />
        <SummaryRow
          label="Shipping"
          value={quote?.shippingCents}
          format={(cents) => (cents === 0 ? "Free" : formatPrice(cents))}
        />
        <SummaryRow label="Sales tax" value={0} format={() => "$0.00"} />
        <div className="flex items-center justify-between border-t border-border pt-4 text-base">
          <dt className="font-semibold">Total</dt>
          <dd className="text-xl font-semibold" data-testid="cart-total">
            {quote ? formatPrice(quote.totalCents) : <Skeleton className="h-6 w-20" />}
          </dd>
        </div>
      </dl>

      {error && (
        <p role="alert" className="mt-4 text-sm text-destructive">
          We couldn&apos;t update prices. Please check your connection and try again.
        </p>
      )}

      <Button size="lg" className="mt-6 w-full" disabled>
        Checkout — coming soon
      </Button>
      <p className="mt-3 text-center text-xs text-muted-foreground">
        Prices are confirmed by our server. Oregon has no sales tax.
      </p>
    </aside>
  );
}

function SummaryRow({
  label,
  value,
  format = formatPrice,
}: {
  label: string;
  value: number | undefined;
  format?: (cents: number) => string;
}) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium text-espresso">{value === undefined ? <Skeleton className="h-4 w-14" /> : format(value)}</dd>
    </div>
  );
}

function CartSkeleton() {
  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_360px]" aria-busy="true" aria-label="Loading your cart">
      <Skeleton className="h-64 rounded-2xl" />
      <Skeleton className="h-80 rounded-2xl" />
    </div>
  );
}
