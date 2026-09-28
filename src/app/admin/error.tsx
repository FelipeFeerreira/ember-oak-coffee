"use client";
export default function AdminError({ reset }: { reset: () => void }) {
  return <div className="mx-auto max-w-md px-6 py-24 text-center"><h1 className="text-3xl font-semibold">Owner tools are unavailable</h1><p className="mt-4 text-muted-foreground">We could not load the dashboard. Please try again.</p><button onClick={reset} className="mt-6 rounded-lg bg-espresso px-5 py-3 text-cream">Try again</button></div>;
}
