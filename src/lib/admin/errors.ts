import "server-only";
import { ZodError } from "zod";
import { CheckoutError } from "@/lib/checkout/schema";
import { privateJson } from "@/lib/http";

export function adminError(error: unknown) {
  if (error instanceof CheckoutError) return privateJson({ error: error.message }, error.status);
  if (error instanceof ZodError || error instanceof SyntaxError) return privateJson({ error: "Please check the submitted fields." }, 400);
  return privateJson({ error: "Owner tools are temporarily unavailable. Please try again." }, 503);
}
