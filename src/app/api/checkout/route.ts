import { checkoutSchema, CheckoutError } from "@/lib/checkout/schema";
import { checkoutConfigured } from "@/lib/checkout/stripe";
import { createCheckout } from "@/lib/checkout/create-session";
import { consumeLimit, requestLimitKey } from "@/lib/rate-limit";
import { privateJson, readBody, requireSameOrigin } from "@/lib/http";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    requireSameOrigin(request);
    if (!checkoutConfigured()) return privateJson({ error: "Test checkout is not configured yet. Your cart is saved." }, 503);
    if (!await consumeLimit(requestLimitKey(request, "checkout"), 15)) {
      return privateJson({ error: "Too many checkout attempts. Please try again in 15 minutes." }, 429);
    }
    const parsed = checkoutSchema.safeParse(JSON.parse(await readBody(request)));
    if (!parsed.success) return privateJson({ error: "Please check your cart and try again." }, 400);
    return privateJson(await createCheckout(parsed.data));
  } catch (error) {
    if (error instanceof CheckoutError) return privateJson({ error: error.message }, error.status);
    if (error instanceof SyntaxError) return privateJson({ error: "Invalid request." }, 400);
    console.error("Checkout could not be created.");
    return privateJson({ error: "We could not open checkout. Your cart is saved; please try again." }, 503);
  }
}
