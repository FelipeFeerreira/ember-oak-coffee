"use client";

import { SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { CatalogFiltersPanel, type PriceBounds } from "@/components/catalog/catalog-filters-panel";
import type { CatalogFilters } from "@/lib/catalog-filters";

export function MobileFilters(props: { filters: CatalogFilters; priceBounds: PriceBounds; activeCount: number }) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" className="lg:hidden">
          <SlidersHorizontal aria-hidden="true" />
          Filters{props.activeCount > 0 ? ` (${props.activeCount})` : ""}
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-80 overflow-y-auto bg-cream">
        <SheetHeader>
          <SheetTitle className="font-heading text-xl">Filter products</SheetTitle>
        </SheetHeader>
        <div className="px-4 pb-8">
          <CatalogFiltersPanel {...props} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
