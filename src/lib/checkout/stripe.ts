import "server-only";
import Stripe from "stripe";

export function checkoutConfigured() {
  return /^sk_test_/.test(process.env.STRIPE_SECRET_KEY ?? "") &&
    /^whsec_/.test(process.env.STRIPE_WEBHOOK_SECRET ?? "");
}

export function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key?.startsWith("sk_test_")) throw new Error("A Stripe test secret key is required.");
  return new Stripe(key, { maxNetworkRetries: 2, timeout: 10_000 });
}

export function siteOrigin() {
  const url = new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3100");
  if (url.username || url.password ||
    (url.protocol !== "https:" && !(url.protocol === "http:" && ["localhost", "127.0.0.1"].includes(url.hostname)))) {
    throw new Error("The site URL must use HTTPS, except on localhost.");
  }
  return url.origin;
}
