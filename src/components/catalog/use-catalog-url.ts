"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useOptimistic, useTransition } from "react";
import { parseCatalogFilters, type CatalogFilters } from "@/lib/catalog-filters";

function paramsToRecord(params: URLSearchParams): Record<string, string[]> {
  const record: Record<string, string[]> = {};
  for (const key of new Set(params.keys())) record[key] = params.getAll(key);
  return record;
}

/**
 * Reads and updates catalog filters in the URL. Using the URL as state means
 * filtered views can be bookmarked and shared, and the back button works.
 *
 * The server re-renders the results on every change, which takes a moment.
 * `useOptimistic` makes the controls reflect the click immediately instead of
 * waiting for the round trip.
 */
export function useCatalogUrl(current: CatalogFilters) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [filters, setOptimisticFilters] = useOptimistic(current);

  function update(mutate: (params: URLSearchParams) => void) {
    const params = new URLSearchParams(searchParams.toString());
    mutate(params);
    const query = params.toString();
    startTransition(() => {
      setOptimisticFilters(parseCatalogFilters(paramsToRecord(params)));
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    });
  }

  function toggleValue(name: string, value: string, checked: boolean) {
    update((params) => {
      const values = params.getAll(name).filter((v) => v !== value);
      if (checked) values.push(value);
      params.delete(name);
      values.forEach((v) => params.append(name, v));
    });
  }

  function setValue(name: string, value: string | undefined) {
    update((params) => {
      if (value === undefined || value === "") params.delete(name);
      else params.set(name, value);
    });
  }

  return { filters, pending, update, toggleValue, setValue };
}
