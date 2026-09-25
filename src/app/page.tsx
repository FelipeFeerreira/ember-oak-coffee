import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Flame, Package, Sprout, Star } from "lucide-react";
import { ProductCard } from "@/components/product/product-card";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/money";
import { FREE_SHIPPING_THRESHOLD_CENTS } from "@/lib/pricing";
import { brewLabels, BREW_METHODS } from "@/lib/product-labels";
import { getFeaturedProducts } from "@/lib/products";

// Stock and prices come from the database, so render on each request.
export const dynamic = "force-dynamic";

const roastSteps = [
  {
    icon: Sprout,
    title: "Source",
    image: "/images/site/source.webp",
    alt: "Ripe red coffee cherries growing on a branch",
    text: "We buy directly from a small circle of farms and co-ops, paying well above commodity prices for coffees that taste of where they're grown.",
  },
  {
    icon: Flame,
    title: "Roast",
    image: "/images/site/roast.webp",
    alt: "Freshly roasted beans turning in a roaster's cooling tray",
    text: "Small 12 kg batches on a vintage drum roaster, profiled for each coffee. Light enough to taste the origin, developed enough to taste sweet.",
  },
  {
    icon: Package,
    title: "Ship fresh",
    image: "/images/site/pack.webp",
    alt: "Hands holding an open bag of roasted coffee beans",
    text: "We roast to order every Monday and Thursday and ship within a day, so your coffee arrives at its peak — never from a warehouse shelf.",
  },
];

const brewTiles: Record<(typeof BREW_METHODS)[number], string> = {
  ESPRESSO: "Syrupy, chocolatey and made for milk.",
  FILTER: "Clear, bright and full of nuance.",
  FRENCH_PRESS: "Rich body and a round, cozy cup.",
  COLD_BREW: "Smooth, sweet and low in acidity.",
};

const testimonials = [
  {
    quote:
      "Yirga Dawn tastes like peaches and jasmine tea. I didn't know coffee could do that. My morning pour-over is now the best part of my day.",
    name: "Maya R.",
    place: "Seattle, WA",
  },
  {
    quote:
      "Ironwood makes the creamiest flat white I've pulled at home. It arrived two days after the roast date — you can smell the difference.",
    name: "Daniel K.",
    place: "Austin, TX",
  },
  {
    quote:
      "Sent the Morning Ritual box to my sister for her birthday. The mug is gorgeous and the handwritten note was a lovely touch.",
    name: "Priya S.",
    place: "Denver, CO",
  },
];

export default async function HomePage() {
  const featured = await getFeaturedProducts(4);

  return (
    <>
      {/* Hero */}
      <section className="relative isolate overflow-hidden bg-espresso">
        <Image
          src="/images/site/hero.webp"
          alt=""
          fill
          priority
          sizes="100vw"
          className="-z-10 object-cover opacity-60"
        />
        <div className="absolute inset-0 -z-10 bg-linear-to-r from-espresso via-espresso/80 to-espresso/10" />
        <div className="mx-auto max-w-6xl px-4 py-24 sm:px-6 sm:py-32 lg:py-40">
          <p className="mb-4 text-sm font-medium tracking-[0.2em] text-latte/80 uppercase">
            Small-batch roastery · Portland, Oregon
          </p>
          <h1 className="max-w-2xl text-4xl leading-[1.05] font-semibold text-cream sm:text-6xl">
            Roasted twice a week. <span className="text-[#f0a57a] italic">Brewed</span> however you like.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-latte/90">
            Single-origin coffees and house blends, roasted to order and shipped the next day. Tell us how you brew and
            we&apos;ll help you find your cup.
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <Button asChild size="lg" className="bg-ember text-ember-foreground hover:bg-ember/90">
              <Link href="/shop?type=COFFEE">
                Shop coffee <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-cream/40 bg-transparent text-cream hover:bg-cream/10 hover:text-cream"
            >
              <Link href="/shop?type=BUNDLE">Browse gift bundles</Link>
            </Button>
          </div>
          <dl className="mt-14 grid max-w-xl grid-cols-3 gap-6 border-t border-cream/15 pt-6 text-cream">
            <div>
              <dt className="text-xs text-latte/70">Roast days</dt>
              <dd className="font-heading text-lg">Mon &amp; Thu</dd>
            </div>
            <div>
              <dt className="text-xs text-latte/70">Free shipping</dt>
              <dd className="font-heading text-lg">Over {formatPrice(FREE_SHIPPING_THRESHOLD_CENTS).replace(".00", "")}</dd>
            </div>
            <div>
              <dt className="text-xs text-latte/70">Freshness</dt>
              <dd className="font-heading text-lg">Guaranteed</dd>
            </div>
          </dl>
        </div>
      </section>

      {/* Featured */}
      <section aria-labelledby="featured-heading" className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-medium tracking-[0.18em] text-ember uppercase">This week at the roastery</p>
            <h2 id="featured-heading" className="mt-2 text-3xl font-semibold sm:text-4xl">
              Fresh off the roaster
            </h2>
          </div>
          <Link href="/shop" className="inline-flex items-center gap-1 text-sm font-medium text-espresso hover:text-ember">
            View all coffee <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {featured.map((product, index) => (
            <ProductCard key={product.id} product={product} priority={index < 2} />
          ))}
        </div>
      </section>

      {/* How we roast */}
      <section aria-labelledby="roast-heading" className="bg-latte/60">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <div className="mx-auto mb-14 max-w-2xl text-center">
            <p className="text-sm font-medium tracking-[0.18em] text-ember uppercase">How we roast</p>
            <h2 id="roast-heading" className="mt-2 text-3xl font-semibold sm:text-4xl">
              From cherry to cup in three honest steps
            </h2>
          </div>
          <ol className="grid gap-8 md:grid-cols-3">
            {roastSteps.map((step, index) => (
              <li key={step.title} className="overflow-hidden rounded-2xl bg-card shadow-sm">
                <div className="relative aspect-[4/3]">
                  <Image src={step.image} alt={step.alt} fill sizes="(min-width: 768px) 33vw, 100vw" className="object-cover" />
                </div>
                <div className="space-y-3 p-6">
                  <div className="flex items-center gap-3">
                    <span className="flex size-9 items-center justify-center rounded-full bg-espresso text-cream">
                      <step.icon className="size-4" aria-hidden="true" />
                    </span>
                    <h3 className="text-xl font-semibold">
                      <span className="sr-only">Step {index + 1}: </span>
                      {step.title}
                    </h3>
                  </div>
                  <p className="leading-relaxed text-muted-foreground">{step.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Shop by brew method */}
      <section aria-labelledby="brew-heading" className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="grid items-center gap-10 lg:grid-cols-[1fr_1.2fr]">
          <div className="relative aspect-[4/3] overflow-hidden rounded-3xl">
            <Image
              src="/images/site/brew-bar.webp"
              alt="Espresso tools, ground coffee and a latte laid out on a wooden board"
              fill
              sizes="(min-width: 1024px) 45vw, 100vw"
              className="object-cover"
            />
          </div>
          <div>
            <p className="text-sm font-medium tracking-[0.18em] text-ember uppercase">Shop by brew method</p>
            <h2 id="brew-heading" className="mt-2 text-3xl font-semibold sm:text-4xl">
              How do you make your coffee?
            </h2>
            <ul className="mt-8 grid gap-3 sm:grid-cols-2">
              {BREW_METHODS.map((method) => (
                <li key={method}>
                  <Link
                    href={`/shop?brew=${method}`}
                    className="group flex h-full flex-col rounded-2xl border border-border bg-card p-5 transition-colors hover:border-ember"
                  >
                    <span className="flex items-center justify-between font-heading text-lg text-espresso">
                      {brewLabels[method]}
                      <ArrowRight className="size-4 text-ember transition-transform group-hover:translate-x-1" aria-hidden="true" />
                    </span>
                    <span className="mt-1 text-sm text-muted-foreground">{brewTiles[method]}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section aria-labelledby="reviews-heading" className="bg-primary text-cream">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <div className="mb-12 text-center">
            <h2 id="reviews-heading" className="text-3xl font-semibold sm:text-4xl">
              Kind words from our regulars
            </h2>
            <p className="mt-3 text-sm text-latte/80">
              Sample reviews — these customers are fictional, written for this portfolio demo.
            </p>
          </div>
          <ul className="grid gap-6 md:grid-cols-3">
            {testimonials.map((t) => (
              <li key={t.name}>
                <figure className="flex h-full flex-col rounded-2xl border border-cream/10 bg-cream/5 p-7">
                  <div className="mb-4 flex gap-0.5 text-[#f0a57a]" role="img" aria-label="5 out of 5 stars">
                    {Array.from({ length: 5 }, (_, i) => (
                      <Star key={i} className="size-4 fill-current" aria-hidden="true" />
                    ))}
                  </div>
                  <blockquote className="flex-1 leading-relaxed text-latte">&ldquo;{t.quote}&rdquo;</blockquote>
                  <figcaption className="mt-6 text-sm">
                    <span className="font-semibold text-cream">{t.name}</span>{" "}
                    <span className="text-latte/70">· {t.place} · fictional</span>
                  </figcaption>
                </figure>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
