import { lookupSession } from "@/lib/orders/lookup";
import { CheckoutError } from "@/lib/checkout/schema";
import { privateJson, readBody, requireSameOrigin } from "@/lib/http";

export async function POST(request: Request) {
  try {
    requireSameOrigin(request);
    const body = JSON.parse(await readBody(request, 1024));
    if (typeof body?.sessionId !== "string") return privateJson({ error: "Invalid session." }, 400);
    return privateJson({ order: await lookupSession(body.sessionId) });
  } catch (error) {
    if (error instanceof CheckoutError) return privateJson({ error: error.message }, error.status);
    return privateJson({ error: "Could not check confirmation." }, 503);
  }
}
