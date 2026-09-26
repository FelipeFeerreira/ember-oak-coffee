/**
 * Human-readable labels for catalog enums. Kept free of Prisma imports so it
 * can be used in client components and tests.
 */

export const ROAST_LEVELS = ["LIGHT", "MEDIUM", "MEDIUM_DARK", "DARK"] as const;
export type RoastLevel = (typeof ROAST_LEVELS)[number];

export const BREW_METHODS = ["ESPRESSO", "FILTER", "FRENCH_PRESS", "COLD_BREW"] as const;
export type BrewMethod = (typeof BREW_METHODS)[number];

export const PRODUCT_TYPES = ["COFFEE", "BUNDLE", "ACCESSORY"] as const;
export type ProductType = (typeof PRODUCT_TYPES)[number];

export const ACIDITY_LEVELS = ["LOW", "MEDIUM", "HIGH"] as const;
export type Acidity = (typeof ACIDITY_LEVELS)[number];

export const roastLabels: Record<RoastLevel, string> = {
  LIGHT: "Light",
  MEDIUM: "Medium",
  MEDIUM_DARK: "Medium-dark",
  DARK: "Dark",
};

export const brewLabels: Record<BrewMethod, string> = {
  ESPRESSO: "Espresso",
  FILTER: "Filter / pour-over",
  FRENCH_PRESS: "French press",
  COLD_BREW: "Cold brew",
};

export const typeLabels: Record<ProductType, string> = {
  COFFEE: "Coffee",
  BUNDLE: "Gift bundles",
  ACCESSORY: "Brewing gear",
};

export const acidityLabels: Record<Acidity, string> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "Bright",
};

/** Position on a 1–4 scale, used by the roast meter on product pages. */
export const roastScale: Record<RoastLevel, number> = {
  LIGHT: 1,
  MEDIUM: 2,
  MEDIUM_DARK: 3,
  DARK: 4,
};
