import { NextResponse } from "next/server";
import { cartSchema } from "@/lib/cart/schema";
import { priceCart } from "@/lib/pricing";
import { getProductsForPricing } from "@/lib/products";

/**
 * POST /api/cart/quote
 *
 * The browser sends only product IDs, quantities and grind. The server loads
 * current prices and stock from the database and returns the priced cart.
 * Nothing price-related from the client is ever trusted.
 */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = cartSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid cart" }, { status: 400 });
  }

  const products = await getProductsForPricing(parsed.data.items.map((item) => item.productId));
  return NextResponse.json(priceCart(parsed.data.items, products));
}
