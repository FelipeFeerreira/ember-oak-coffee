import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function ProductNotFound() {
  return (
    <div className="mx-auto max-w-xl px-4 py-24 text-center">
      <h1 className="text-4xl font-semibold">We couldn&apos;t find that coffee</h1>
      <p className="mt-4 text-muted-foreground">
        It may have sold out for the season or the link may be mistyped. Our current lineup is just a click away.
      </p>
      <Button asChild size="lg" className="mt-8">
        <Link href="/shop">Browse the shop</Link>
      </Button>
    </div>
  );
}
