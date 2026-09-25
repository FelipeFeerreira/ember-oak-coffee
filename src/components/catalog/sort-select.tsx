"use client";

import { useId } from "react";
import { useCatalogUrl } from "@/components/catalog/use-catalog-url";
import { SORT_OPTIONS, sortLabels, type CatalogFilters } from "@/lib/catalog-filters";

export function SortSelect({ filters: serverFilters }: { filters: CatalogFilters }) {
  const { filters, setValue } = useCatalogUrl(serverFilters);
  const id = useId();

  return (
    <div className="flex items-center gap-2">
      <label htmlFor={id} className="text-sm text-muted-foreground">
        Sort by
      </label>
      <select
        id={id}
        value={filters.sort}
        onChange={(event) => setValue("sort", event.target.value === "featured" ? undefined : event.target.value)}
        className="h-10 rounded-lg border border-input bg-card px-3 text-sm text-espresso focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
      >
        {SORT_OPTIONS.map((option) => (
          <option key={option} value={option}>
            {sortLabels[option]}
          </option>
        ))}
      </select>
    </div>
  );
}
