import { cn } from "@/lib/utils";

/**
 * The Ember & Oak mark: a coffee bean whose center crease is drawn as a
 * flickering ember. Decorative, so it is hidden from screen readers — the
 * wordmark next to it carries the accessible name.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true" className={cn("size-9 shrink-0", className)}>
      <circle cx="32" cy="32" r="31" fill="var(--espresso)" stroke="#c98b4f" strokeOpacity="0.5" strokeWidth="1.5" />
      <circle cx="32" cy="32" r="27.5" fill="none" stroke="#c98b4f" strokeWidth="1" opacity="0.7" />
      <g transform="rotate(24 32 33)">
        <ellipse cx="32" cy="33" rx="13" ry="18" fill="var(--cream)" />
        <path
          d="M33.5 16.5 C 26 23, 38 29, 31 35.5 C 27 39.5, 30.5 44, 29.5 49"
          fill="none"
          stroke="var(--ember)"
          strokeWidth="3.2"
          strokeLinecap="round"
        />
      </g>
      <path d="M44.5 13.5 c -2.2 2.2 -1.6 4.6 0.2 5.6 c 1.9 -1.1 2.3 -3.5 -0.2 -5.6 z" fill="#e0763f" />
    </svg>
  );
}

export function Logo({ className, tone = "dark" }: { className?: string; tone?: "dark" | "light" }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark />
      <span className="flex flex-col leading-none">
        <span
          className={cn(
            "font-heading text-lg font-semibold tracking-tight",
            tone === "light" ? "text-cream" : "text-espresso",
          )}
        >
          Ember &amp; Oak
        </span>
        <span
          className={cn(
            "mt-0.5 text-[0.65rem] font-medium tracking-[0.18em] uppercase",
            tone === "light" ? "text-latte/80" : "text-oak",
          )}
        >
          Coffee Roasters
        </span>
      </span>
    </span>
  );
}
