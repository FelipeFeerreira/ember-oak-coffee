import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { CartLink } from "@/components/layout/cart-link";
import { DemoBanner } from "@/components/layout/demo-banner";
import { MobileNav } from "@/components/layout/mobile-nav";
import { navLinks } from "@/components/layout/nav-links";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40">
      <DemoBanner />
      <div className="border-b border-border/80 bg-cream/90 backdrop-blur supports-backdrop-filter:bg-cream/80">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex items-center gap-1">
            <MobileNav />
            <Link href="/" aria-label="Ember & Oak Coffee Roasters, home">
              <Logo />
            </Link>
          </div>
          <nav aria-label="Main" className="hidden md:block">
            <ul className="flex items-center gap-8">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm font-medium text-espresso/80 transition-colors hover:text-ember"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <CartLink />
        </div>
      </div>
    </header>
  );
}
