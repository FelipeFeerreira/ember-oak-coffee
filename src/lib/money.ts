const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

/** Formats integer cents as US dollars, e.g. 1950 -> "$19.50". */
export function formatPrice(cents: number): string {
  return usd.format(cents / 100);
}
