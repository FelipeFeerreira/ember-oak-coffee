/**
 * The seed catalog: the single source of truth for the initial products.
 *
 * Used by `prisma/seed.ts` to fill the database, and later by the demo-mode
 * cleanup job to restore stock to these values. The app itself never reads
 * prices from this file — at runtime, prices always come from the database.
 */

export type SeedProduct = {
  slug: string;
  name: string;
  type: "COFFEE" | "BUNDLE" | "ACCESSORY";
  tagline: string;
  description: string;
  priceCents: number;
  stock: number;
  weightGrams?: number;
  origin?: string;
  region?: string;
  process?: string;
  tastingNotes: string[];
  roastLevel?: "LIGHT" | "MEDIUM" | "MEDIUM_DARK" | "DARK";
  acidity?: "LOW" | "MEDIUM" | "HIGH";
  brewMethods: ("ESPRESSO" | "FILTER" | "FRENCH_PRESS" | "COLD_BREW")[];
  imageUrl: string;
  imageAlt: string;
  featured?: boolean;
};

export const seedCatalog: SeedProduct[] = [
  {
    slug: "yirga-dawn",
    name: "Yirga Dawn",
    type: "COFFEE",
    tagline: "Floral, tea-like and bright — a sunrise in a cup.",
    description:
      "Grown by smallholder farmers around Yirgacheffe and washed at a community station, this lot is everything we love about Ethiopian coffee. We roast it light to keep the jasmine aroma and the juicy stone-fruit finish front and center. Brew it as a pour-over and let it cool a little — the peach really opens up.",
    priceCents: 2100,
    stock: 42,
    weightGrams: 340,
    origin: "Ethiopia",
    region: "Yirgacheffe, Gedeo Zone",
    process: "Washed",
    tastingNotes: ["Jasmine", "Bergamot", "White peach"],
    roastLevel: "LIGHT",
    acidity: "HIGH",
    brewMethods: ["FILTER", "COLD_BREW"],
    imageUrl: "/images/products/yirga-dawn.webp",
    imageAlt: "Light-roasted coffee beans scattered across a white surface",
    featured: true,
  },
  {
    slug: "nyeri-ridge",
    name: "Nyeri Ridge",
    type: "COFFEE",
    tagline: "Blackcurrant, grapefruit and a syrupy cane-sugar sweetness.",
    description:
      "SL28 and SL34 varieties from the red volcanic soils of Nyeri, Kenya, processed with the classic double fermentation. It's bold, juicy and unmistakably Kenyan. A small seasonal lot — when it's gone, it's gone until next harvest.",
    priceCents: 2350,
    stock: 6,
    weightGrams: 340,
    origin: "Kenya",
    region: "Nyeri County",
    process: "Washed (double fermentation)",
    tastingNotes: ["Blackcurrant", "Pink grapefruit", "Cane sugar"],
    roastLevel: "LIGHT",
    acidity: "HIGH",
    brewMethods: ["FILTER"],
    imageUrl: "/images/products/nyeri-ridge.webp",
    imageAlt: "Close-up of roasted coffee beans in a white ceramic bowl",
  },
  {
    slug: "huila-hearth",
    name: "Huila Hearth",
    type: "COFFEE",
    tagline: "Our everyday favorite: red apple, caramel and milk chocolate.",
    description:
      "A crowd-pleasing washed Colombian from family farms in the Huila highlands. Balanced and sweet, it works with almost any brewer — drip machine, French press or a mellow espresso. If you're not sure where to start, start here.",
    priceCents: 1900,
    stock: 58,
    weightGrams: 340,
    origin: "Colombia",
    region: "Huila",
    process: "Washed",
    tastingNotes: ["Red apple", "Caramel", "Milk chocolate"],
    roastLevel: "MEDIUM",
    acidity: "MEDIUM",
    brewMethods: ["FILTER", "FRENCH_PRESS", "ESPRESSO"],
    imageUrl: "/images/products/huila-hearth.webp",
    imageAlt: "Roasted coffee beans falling from a spoon against a dark background",
    featured: true,
  },
  {
    slug: "antigua-ember",
    name: "Antigua Ember",
    type: "COFFEE",
    tagline: "Cocoa, toasted almond and a twist of orange zest.",
    description:
      "Grown in the shadow of three volcanoes in Antigua, Guatemala. This washed coffee has a round, nutty body and a gentle citrus lift. It shines in a French press on slow weekend mornings.",
    priceCents: 1950,
    stock: 35,
    weightGrams: 340,
    origin: "Guatemala",
    region: "Antigua",
    process: "Washed",
    tastingNotes: ["Cocoa", "Toasted almond", "Orange zest"],
    roastLevel: "MEDIUM",
    acidity: "MEDIUM",
    brewMethods: ["FILTER", "FRENCH_PRESS"],
    imageUrl: "/images/products/antigua-ember.webp",
    imageAlt: "A white ceramic cup resting in a pile of roasted coffee beans",
  },
  {
    slug: "ironwood-espresso",
    name: "Ironwood Espresso",
    type: "COFFEE",
    tagline: "Dark chocolate, hazelnut and brown sugar. Built for espresso.",
    description:
      "Our house espresso blend of a natural Brazilian and a washed Colombian. It pulls a thick, syrupy shot with low acidity and cuts through milk beautifully — perfect for lattes and flat whites. Rest it 7–10 days after the roast date for the best crema.",
    priceCents: 2000,
    stock: 64,
    weightGrams: 340,
    origin: "Brazil & Colombia",
    region: "Cerrado Mineiro / Huila",
    process: "Natural & washed",
    tastingNotes: ["Dark chocolate", "Hazelnut", "Brown sugar"],
    roastLevel: "MEDIUM_DARK",
    acidity: "LOW",
    brewMethods: ["ESPRESSO"],
    imageUrl: "/images/products/ironwood-espresso.webp",
    imageAlt: "Two espresso portafilters, one filled with beans and one with ground coffee",
    featured: true,
  },
  {
    slug: "old-growth-sumatra",
    name: "Old Growth Sumatra",
    type: "COFFEE",
    tagline: "Earthy and full-bodied: cedar, molasses and baker's chocolate.",
    description:
      "Wet-hulled coffee from the Gayo highlands of Aceh, Sumatra. We take it to a true dark roast for a heavy, velvety body and a deep, smoky sweetness. Low in acidity and great for French press or a strong cold brew.",
    priceCents: 1850,
    stock: 27,
    weightGrams: 340,
    origin: "Indonesia",
    region: "Gayo Highlands, Aceh",
    process: "Wet-hulled",
    tastingNotes: ["Cedar", "Molasses", "Baker's chocolate"],
    roastLevel: "DARK",
    acidity: "LOW",
    brewMethods: ["FRENCH_PRESS", "COLD_BREW"],
    imageUrl: "/images/products/old-growth-sumatra.webp",
    imageAlt: "Dark roasted coffee beans spilling out of a burlap sack",
  },
  {
    slug: "night-shift-cold-brew",
    name: "Night Shift Cold Brew Blend",
    type: "COFFEE",
    tagline: "Cocoa nib, cherry cola and toffee — smooth over ice.",
    description:
      "A blend we designed specifically for cold brew: a natural Brazilian for chocolatey body and a Peruvian for a hint of dark fruit. Steep it coarse-ground for 16–18 hours and you get a smooth, naturally sweet concentrate with almost no bitterness.",
    priceCents: 1800,
    stock: 40,
    weightGrams: 340,
    origin: "Brazil & Peru",
    region: "Sul de Minas / Cajamarca",
    process: "Natural & washed",
    tastingNotes: ["Cocoa nib", "Cherry cola", "Toffee"],
    roastLevel: "MEDIUM_DARK",
    acidity: "LOW",
    brewMethods: ["COLD_BREW", "FRENCH_PRESS"],
    imageUrl: "/images/products/night-shift-cold-brew.webp",
    imageAlt: "Close-up of dark roasted coffee beans on a black surface",
  },
  {
    slug: "tasting-flight",
    name: "Roaster's Tasting Flight",
    type: "BUNDLE",
    tagline: "Three 4 oz bags: light, medium and dark. Find your favorite.",
    description:
      "Can't decide? This flight includes 4 oz (113 g) each of Yirga Dawn (light), Huila Hearth (medium) and Old Growth Sumatra (dark), plus a tasting card to compare notes. A great way to discover what you like — or a thoughtful gift.",
    priceCents: 2900,
    stock: 24,
    weightGrams: 340,
    tastingNotes: ["Floral", "Caramel", "Chocolate"],
    brewMethods: ["FILTER", "FRENCH_PRESS"],
    imageUrl: "/images/products/tasting-flight.webp",
    imageAlt: "Coffee beans on a table next to a small handwritten tasting card",
    featured: true,
  },
  {
    slug: "morning-ritual-gift-box",
    name: "Morning Ritual Gift Box",
    type: "BUNDLE",
    tagline: "A 12 oz bag of Huila Hearth, a stoneware mug and a handwritten note.",
    description:
      "Everything for a slow, cozy morning: a 12 oz bag of our Huila Hearth, a hand-glazed stoneware mug from a Portland ceramicist, and a note with your own message. Packed in a recyclable kraft gift box.",
    priceCents: 4800,
    stock: 18,
    weightGrams: 340,
    tastingNotes: ["Red apple", "Caramel", "Milk chocolate"],
    brewMethods: ["FILTER", "FRENCH_PRESS"],
    imageUrl: "/images/products/morning-ritual-gift-box.webp",
    imageAlt: "Gift box wrapped in kraft paper beside a cup of black coffee",
  },
  {
    slug: "espresso-lovers-duo",
    name: "Espresso Lover's Duo",
    type: "BUNDLE",
    tagline: "Two 12 oz bags of Ironwood Espresso, gift-wrapped.",
    description:
      "Double up on our house espresso — two 12 oz bags of Ironwood Espresso in a pair of gift boxes. Ideal for the home barista who goes through a lot of lattes.",
    priceCents: 3800,
    stock: 20,
    weightGrams: 680,
    tastingNotes: ["Dark chocolate", "Hazelnut", "Brown sugar"],
    brewMethods: ["ESPRESSO"],
    imageUrl: "/images/products/espresso-lovers-duo.webp",
    imageAlt: "Two red gift boxes and two patterned coffee cups on a wooden table",
  },
  {
    slug: "hearthstone-hand-grinder",
    name: "Hearthstone Hand Grinder",
    type: "ACCESSORY",
    tagline: "A wood-and-steel burr grinder for fresh grounds anywhere.",
    description:
      "Grinding right before you brew is the single biggest upgrade for home coffee. This hand grinder has adjustable steel conical burrs (espresso to French press), a walnut body and a small drawer that holds enough for two cups.",
    priceCents: 6400,
    stock: 15,
    tastingNotes: [],
    brewMethods: ["ESPRESSO", "FILTER", "FRENCH_PRESS", "COLD_BREW"],
    imageUrl: "/images/products/hearthstone-hand-grinder.webp",
    imageAlt: "Vintage-style wooden hand coffee grinder against a teal wall",
  },
  {
    slug: "glass-pour-over-brewer",
    name: "Glass Pour-Over Brewer",
    type: "ACCESSORY",
    tagline: "A 6-cup borosilicate brewer with a wooden collar.",
    description:
      "A clean, elegant way to brew filter coffee for two to four people. Heat-resistant borosilicate glass, a removable oiled-wood collar and a leather tie. Use with standard cone paper filters.",
    priceCents: 4200,
    stock: 22,
    tastingNotes: [],
    brewMethods: ["FILTER"],
    imageUrl: "/images/products/glass-pour-over-brewer.webp",
    imageAlt: "Glass pour-over coffee brewer with a wooden collar filled with coffee",
  },
];
