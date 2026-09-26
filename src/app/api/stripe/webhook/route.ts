import type Stripe from "stripe";
import { getStripe } from "@/lib/checkout/stripe";
import { processStripeEvent } from "@/lib/orders/fulfill";
import { sendOrderEmail } from "@/lib/orders/email";
import { privateJson, readBody } from "@/lib/http";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret?.startsWith("whsec_")) return privateJson({ error: "Webhook is not configured." }, 503);
  const signature = request.headers.get("stripe-signature");
  if (!signature) return privateJson({ error: "Missing signature." }, 400);
  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(await readBody(request, 256_000), signature, secret);
  } catch {
    return privateJson({ error: "Invalid webhook signature or payload." }, 400);
  }
  if (event.livemode) return privateJson({ error: "Only test events are accepted." }, 400);
  try {
    const orderId = await processStripeEvent(event);
    if (orderId) await sendOrderEmail(orderId);
    return privateJson({ received: true });
  } catch {
    // Do not log payment payloads or personal data. Stripe retries non-2xx responses.
    console.error("Stripe webhook processing failed; delivery can be retried.", { eventId: event.id });
    return privateJson({ error: "Unable to process event. Please retry." }, 500);
  }
}
