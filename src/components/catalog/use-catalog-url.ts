"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";

/**
 * Reads and updates catalog filters in the URL. Using the URL as state means
 * filtered views can be bookmarked and shared, and the back button works.
 */
export function useCatalogUrl() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  function update(mutate: (params: URLSearchParams) => void) {
    const params = new URLSearchParams(searchParams.toString());
    mutate(params);
    const query = params.toString();
    startTransition(() => {
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

  return { pending, update, toggleValue, setValue };
}
