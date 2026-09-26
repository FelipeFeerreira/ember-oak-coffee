import { z } from "zod";

export const chatInputSchema = z.object({ message: z.string().trim().min(1).max(1000), requestId: z.uuid() }).strict();
export const leadSchema = z.object({
  requestId: z.uuid(), name: z.string().trim().min(1).max(100),
  email: z.string().trim().toLowerCase().pipe(z.email().max(254)),
  question: z.string().trim().min(5).max(1500), consent: z.literal(true),
}).strict();
export const conversionSchema = z.object({ messageId: z.string().min(1).max(64), productId: z.string().min(1).max(64) }).strict();
export const productSearchSchema = z.object({
  query: z.string().trim().max(80).optional(),
  type: z.enum(["COFFEE", "BUNDLE", "ACCESSORY"]).optional(),
  roast: z.enum(["LIGHT", "MEDIUM", "MEDIUM_DARK", "DARK"]).optional(),
  brew: z.enum(["ESPRESSO", "FILTER", "FRENCH_PRESS", "COLD_BREW"]).optional(),
  acidity: z.enum(["LOW", "MEDIUM", "HIGH"]).optional(),
  maxPriceCents: z.number().int().min(0).max(100_000).optional(),
}).strict();
export const productIdSchema = z.object({ id: z.string().min(1).max(64) }).strict();
export const orderToolSchema = z.object({
  order_number: z.string().trim().toUpperCase().regex(/^EO-[A-F0-9]{16}$/),
  email: z.string().trim().toLowerCase().pipe(z.email().max(254)),
}).strict();

export type ChatProduct = {
  id: string; slug: string; name: string; type: "COFFEE" | "BUNDLE" | "ACCESSORY";
  priceCents: number; stock: number; imageUrl: string; imageAlt: string; tastingNotes: string[]; tagline: string;
};
export type ChatOrder = { number: string; status: string; totalCents: number; trackingNumber: string | null };
export type ChatReply = { text: string; topic: string; products?: ChatProduct[]; order?: ChatOrder; handoff?: boolean };
export type ChatViewMessage = { id: string; role: "USER" | "ASSISTANT"; text: string; products?: ChatProduct[]; order?: ChatOrder; handoff?: boolean };
export type ChatEvent =
  | { type: "status"; text: string }
  | { type: "text"; text: string }
  | { type: "result"; message: ChatViewMessage; remaining: number }
  | { type: "error"; text: string };
