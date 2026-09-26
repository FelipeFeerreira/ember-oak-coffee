import type { Metadata } from "next";
import { CartView } from "@/components/cart/cart-view";

export const metadata: Metadata = {
  title: "Your cart",
  robots: { index: false },
};

export default function CartPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <h1 className="mb-10 text-4xl font-semibold sm:text-5xl">Your cart</h1>
      <CartView />
    </div>
  );
}
