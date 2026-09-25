import { cn } from "@/lib/utils";

export const LOW_STOCK_THRESHOLD = 8;

export function StockStatus({ stock, className }: { stock: number; className?: string }) {
  if (stock <= 0) {
    return <p className={cn("text-sm font-medium text-destructive", className)}>Sold out</p>;
  }
  if (stock <= LOW_STOCK_THRESHOLD) {
    return <p className={cn("text-sm font-medium text-ember", className)}>Only {stock} left — small lot</p>;
  }
  return <p className={cn("text-sm text-muted-foreground", className)}>In stock, roasted to order</p>;
}
