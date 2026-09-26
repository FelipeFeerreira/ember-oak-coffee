import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Our story",
  description: "How a garage roaster in Portland became Ember & Oak Coffee Roasters.",
};

const values = [
  {
    title: "Know the farm",
    text: "We work with a small circle of producers and importers who share cupping notes, prices paid and harvest updates with us — and we share them with you.",
  },
  {
    title: "Roast for sweetness",
    text: "Every coffee gets its own roast profile. We chase caramelized sugars and clarity, never the smoky, one-note taste of an over-roasted bean.",
  },
  {
    title: "Fresh or nothing",
    text: "No warehouse shelves. We roast to order twice a week and print the roast date on every bag.",
  },
];

export default function AboutPage() {
  return (
    <>
      <section className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-2">
        <div>
          <p className="text-sm font-medium tracking-[0.18em] text-ember uppercase">Our story</p>
          <h1 className="mt-2 text-4xl font-semibold sm:text-5xl">Two friends, one tiny roaster and a lot of burnt beans</h1>
          <div className="mt-6 space-y-4 text-lg leading-relaxed text-espresso/90">
            <p>
              Ember &amp; Oak started in 2019 in a drafty garage in Portland&apos;s Sellwood neighborhood, with a secondhand
              1-kilo roaster and a stack of notebooks. The first few batches were, honestly, charcoal.
            </p>
            <p>
              A few hundred roasts later, friends started asking for bags. Then friends of friends. Today we roast on a
              restored 12-kilo drum roaster in the Central Eastside, but the notebooks are still there — every batch is
              logged and cupped before it ships.
            </p>
            <p>
              The name comes from the two things we think about most: the <em>ember</em> — heat, the craft of roasting
              — and the <em>oak</em>, the slow-growing patience that good coffee (and good relationships with farmers)
              takes.
            </p>
          </div>
        </div>
        <div className="relative aspect-[4/5] overflow-hidden rounded-3xl lg:aspect-square">
          <Image
            src="/images/site/about.webp"
            alt="A roaster stirring freshly roasted coffee beans with a metal scoop"
            fill
            priority
            sizes="(min-width: 1024px) 50vw, 100vw"
            className="object-cover"
          />
        </div>
      </section>

      <section aria-labelledby="values-heading" className="bg-latte/60">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <h2 id="values-heading" className="mb-10 text-center text-3xl font-semibold sm:text-4xl">
            What we care about
          </h2>
          <ul className="grid gap-6 md:grid-cols-3">
            {values.map((value) => (
              <li key={value.title} className="rounded-2xl bg-card p-7 shadow-sm">
                <h3 className="text-xl font-semibold">{value.title}</h3>
                <p className="mt-3 leading-relaxed text-muted-foreground">{value.text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6">
        <h2 className="text-3xl font-semibold">Taste what we&apos;re roasting this week</h2>
        <p className="mt-3 text-muted-foreground">
          Not sure where to start? The Roaster&apos;s Tasting Flight has a light, a medium and a dark roast.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button asChild size="lg">
            <Link href="/shop?type=COFFEE">Shop coffee</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/shop/tasting-flight">Try the Tasting Flight</Link>
          </Button>
        </div>
        <p className="mt-10 text-xs text-muted-foreground">
          Ember &amp; Oak is a fictional brand created for a portfolio project. The story above is invented.
        </p>
      </section>
    </>
  );
}
