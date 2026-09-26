import { roastLabels, roastScale, type RoastLevel } from "@/lib/product-labels";
import { cn } from "@/lib/utils";

/** A four-step roast indicator. The text label carries the meaning; the dots are decorative. */
export function RoastMeter({ level, className }: { level: RoastLevel; className?: string }) {
  const value = roastScale[level];
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <span className="flex gap-1" aria-hidden="true">
        {[1, 2, 3, 4].map((step) => (
          <span
            key={step}
            className={cn(
              "size-2.5 rounded-full border border-oak/50",
              step <= value ? (step >= 3 ? "bg-espresso" : "bg-oak") : "bg-transparent",
            )}
          />
        ))}
      </span>
      <span>{roastLabels[level]} roast</span>
    </span>
  );
}
