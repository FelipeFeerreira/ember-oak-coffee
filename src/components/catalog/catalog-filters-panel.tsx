"use client";

import { useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useCatalogUrl } from "@/components/catalog/use-catalog-url";
import type { CatalogFilters } from "@/lib/catalog-filters";
import {
  brewLabels,
  BREW_METHODS,
  PRODUCT_TYPES,
  roastLabels,
  ROAST_LEVELS,
  typeLabels,
} from "@/lib/product-labels";
import { cn } from "@/lib/utils";

export type PriceBounds = { min: number; max: number };

type Props = { filters: CatalogFilters; priceBounds: PriceBounds; activeCount: number };

export function CatalogFiltersPanel({ filters, priceBounds, activeCount }: Props) {
  const { pending, update, toggleValue, setValue } = useCatalogUrl();
  const id = useId();

  return (
    <div className="space-y-8" aria-busy={pending}>
      <fieldset>
        <legend className="mb-3 text-sm font-semibold text-espresso">Category</legend>
        <div className="flex flex-wrap gap-2">
          {[undefined, ...PRODUCT_TYPES].map((type) => {
            const selected = filters.type === type;
            return (
              <button
                key={type ?? "ALL"}
                type="button"
                aria-pressed={selected}
                onClick={() => setValue("type", type)}
                className={cn(
                  "rounded-full border px-3.5 py-1.5 text-sm transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none",
                  selected
                    ? "border-espresso bg-espresso text-cream"
                    : "border-border bg-card text-espresso hover:border-oak",
                )}
              >
                {type ? typeLabels[type] : "All"}
              </button>
            );
          })}
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-3 text-sm font-semibold text-espresso">Roast level</legend>
        <div className="space-y-1">
          {ROAST_LEVELS.map((level) => (
            <CheckboxRow
              key={level}
              id={`${id}-roast-${level}`}
              label={roastLabels[level]}
              checked={filters.roast.includes(level)}
              onChange={(checked) => toggleValue("roast", level, checked)}
            />
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-3 text-sm font-semibold text-espresso">Brew method</legend>
        <div className="space-y-1">
          {BREW_METHODS.map((method) => (
            <CheckboxRow
              key={method}
              id={`${id}-brew-${method}`}
              label={brewLabels[method]}
              checked={filters.brew.includes(method)}
              onChange={(checked) => toggleValue("brew", method, checked)}
            />
          ))}
        </div>
      </fieldset>

      <PriceRange
        // Re-mount when the URL changes so the slider reflects shared or back-button URLs.
        key={`${filters.minPrice}-${filters.maxPrice}`}
        bounds={priceBounds}
        initial={[filters.minPrice ?? priceBounds.min, filters.maxPrice ?? priceBounds.max]}
        onCommit={([min, max]) =>
          update((params) => {
            if (min > priceBounds.min) params.set("minPrice", String(min));
            else params.delete("minPrice");
            if (max < priceBounds.max) params.set("maxPrice", String(max));
            else params.delete("maxPrice");
          })
        }
      />

      {activeCount > 0 && (
        <Button
          variant="outline"
          className="w-full"
          onClick={() =>
            update((params) => {
              ["type", "roast", "brew", "minPrice", "maxPrice"].forEach((key) => params.delete(key));
            })
          }
        >
          Clear all filters
        </Button>
      )}

      <p className="sr-only" aria-live="polite">
        {pending ? "Updating results…" : ""}
      </p>
    </div>
  );
}

function CheckboxRow({
  id,
  label,
  checked,
  onChange,
}: {
  id: string;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg px-1 py-1.5">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="size-5 rounded border-input accent-ember focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
      />
      <label htmlFor={id} className="flex-1 cursor-pointer text-sm text-espresso">
        {label}
      </label>
    </div>
  );
}

function PriceRange({
  bounds,
  initial,
  onCommit,
}: {
  bounds: PriceBounds;
  initial: [number, number];
  onCommit: (value: [number, number]) => void;
}) {
  const [value, setValue] = useState<[number, number]>(initial);
  const labelId = useId();

  return (
    <fieldset>
      <legend id={labelId} className="mb-1 text-sm font-semibold text-espresso">
        Price range
      </legend>
      <p className="mb-4 text-sm text-muted-foreground" aria-live="polite">
        ${value[0]} – ${value[1]}
      </p>
      <Slider
        min={bounds.min}
        max={bounds.max}
        step={5}
        minStepsBetweenThumbs={1}
        value={value}
        onValueChange={(next) => setValue([next[0], next[1]])}
        onValueCommit={(next) => onCommit([next[0], next[1]])}
        thumbLabels={["Minimum price in dollars", "Maximum price in dollars"]}
        aria-labelledby={labelId}
      />
    </fieldset>
  );
}
