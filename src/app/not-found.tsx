import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl px-4 py-24 text-center">
      <p className="text-sm font-medium tracking-[0.18em] text-ember uppercase">404</p>
      <h1 className="mt-2 text-4xl font-semibold">This page has gone cold</h1>
      <p className="mt-4 text-muted-foreground">We couldn&apos;t find what you were looking for. Let&apos;s get you a fresh cup.</p>
      <Button asChild size="lg" className="mt-8">
        <Link href="/">Back to the homepage</Link>
      </Button>
    </div>
  );
}
