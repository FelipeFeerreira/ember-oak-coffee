import { lookupOrder } from "@/lib/orders/lookup";
import { consumeLimit, requestLimitKey } from "@/lib/rate-limit";
import { CheckoutError } from "@/lib/checkout/schema";
import { privateJson, readBody, requireSameOrigin } from "@/lib/http";

export async function POST(request: Request) {
  try {
    requireSameOrigin(request);
    if (!await consumeLimit(requestLimitKey(request, "order-lookup"), 10)) {
      return privateJson({ error: "Too many attempts. Please try again in 15 minutes." }, 429);
    }
    const order = await lookupOrder(JSON.parse(await readBody(request)));
    if (!order) return privateJson({ error: "We could not find an order matching those details." }, 404);
    return privateJson({ order });
  } catch (error) {
    if (error instanceof CheckoutError) return privateJson({ error: error.message }, error.status);
    if (error instanceof SyntaxError) return privateJson({ error: "Invalid request." }, 400);
    return privateJson({ error: "Order lookup is temporarily unavailable. Please try again." }, 503);
  }
}
