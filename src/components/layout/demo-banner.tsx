export function DemoBanner() {
  return (
    <div className="bg-espresso px-4 py-1.5 text-center text-xs text-cream sm:text-sm" role="note">
      <span className="font-semibold">Demo store — fictional brand.</span>{" "}
      <span className="text-latte/90">
        Use Stripe test card <span className="font-mono tracking-wide whitespace-nowrap">4242 4242 4242 4242</span>.
      </span>
    </div>
  );
}
