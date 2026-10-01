import "server-only";
import { CheckoutError } from "@/lib/checkout/schema";

export async function readBody(request: Request, maxBytes = 16_384) {
  const text = await request.text();
  if (Buffer.byteLength(text, "utf8") > maxBytes) {
    throw new CheckoutError("Request is too large.", 413);
  }
  return text;
}

export function privateJson(data: unknown, status = 200) {
  return Response.json(data, { status, headers: { "Cache-Control": "no-store" } });
}

export function requireSameOrigin(request: Request) {
  if (request.headers.get("origin") !== new URL(request.url).origin) {
    throw new CheckoutError("Please submit this request from the store.", 403);
  }
}
