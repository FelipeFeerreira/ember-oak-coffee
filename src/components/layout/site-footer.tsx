import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { STORE } from "@/content/store-info";
import { photoCredits } from "@/data/photo-credits";

export function SiteFooter() {
  return (
    <footer className="mt-auto bg-espresso text-latte">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr]">
        <div className="space-y-4">
          <Logo tone="light" />
          <p className="max-w-sm text-sm leading-relaxed text-latte/80">
            Small-batch specialty coffee, roasted twice a week in {STORE.city}. We buy from farms we know by name and
            roast for sweetness, not smoke.
          </p>
        </div>

        <nav aria-label="Footer">
          <h2 className="mb-3 font-sans text-xs font-semibold tracking-[0.18em] text-latte/70 uppercase">Shop</h2>
          <ul className="space-y-2 text-sm">
            <li><Link className="hover:text-cream hover:underline" href="/shop?type=COFFEE">Coffee</Link></li>
            <li><Link className="hover:text-cream hover:underline" href="/shop?type=BUNDLE">Gift bundles</Link></li>
            <li><Link className="hover:text-cream hover:underline" href="/shop?type=ACCESSORY">Brewing gear</Link></li>
          </ul>
        </nav>

        <div>
          <h2 className="mb-3 font-sans text-xs font-semibold tracking-[0.18em] text-latte/70 uppercase">Help</h2>
          <ul className="space-y-2 text-sm">
            <li><Link className="hover:text-cream hover:underline" href="/faq">FAQ &amp; policies</Link></li>
            <li><Link className="hover:text-cream hover:underline" href="/about">Our story</Link></li>
            <li><span className="text-latte/80">{STORE.email}</span></li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto max-w-6xl space-y-3 px-4 py-6 text-xs text-latte/70 sm:px-6">
          <p>
            <strong className="text-latte">Portfolio concept:</strong> brand, products and reviews are fictional. No
            real orders are fulfilled.
          </p>
          <details className="group">
            <summary className="cursor-pointer text-latte/80 hover:text-cream">Photo credits (Unsplash)</summary>
            <ul className="mt-3 grid gap-x-6 gap-y-1 sm:grid-cols-2 lg:grid-cols-3">
              {photoCredits.map((credit) => (
                <li key={credit.photoUrl}>
                  {credit.image}:{" "}
                  <a
                    className="underline decoration-latte/40 underline-offset-2 hover:text-cream"
                    href={credit.photoUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {credit.photographer}
                  </a>
                </li>
              ))}
            </ul>
          </details>
        </div>
      </div>
    </footer>
  );
}
