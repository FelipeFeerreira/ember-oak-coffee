import "server-only";
import { z } from "zod";
import type { Tool } from "@anthropic-ai/sdk/resources/messages";
import { db } from "@/lib/db";
import { lookupOrder } from "@/lib/orders/lookup";
import { productSearchSchema, productIdSchema, orderToolSchema, type ChatReply } from "./schema";
import { knowledge, safeReplies } from "./knowledge";

export const chatProductSelect = {
  id: true, name: true, slug: true, type: true, priceCents: true, stock: true,
  imageUrl: true, imageAlt: true, tastingNotes: true, tagline: true,
} as const;
const knowledgeSchema = z.object({ id: z.enum(knowledge.map((entry) => entry.id) as [string, ...string[]]) }).strict();
const replySchema = z.object({ kind: z.enum(["greeting", "clarify", "off_topic", "handoff", "order_details"]) }).strict();
function tool(name: string, description: string, schema: z.ZodObject): Tool {
  return { name, description, input_schema: { ...z.toJSONSchema(schema), type: "object" } };
}
export const chatTools: Tool[] = [
  tool("search_products", "Find up to three in-stock products by preferences. Prices and stock come from the database. Use query only for a specific product name; omit it for broad preferences.", productSearchSchema),
  tool("get_product", "Show a known product ID from previous tool results. Never invent an ID.", productIdSchema),
  tool("get_order_status", "Read a private order status. Both order_number and email MUST appear together in the customer's current message; never guess or reuse credentials from history.", orderToolSchema),
  tool("answer_store_question", "Answer using one verified policy or FAQ entry ID from the system knowledge. Do not invent policy terms.", knowledgeSchema),
  tool("respond", "Choose a greeting, preference clarification, polite off-topic refusal, human handoff, or request for order credentials. Use handoff for unsupported store questions or explicit human requests.", replySchema),
];

export async function executeChatTool(name: string, input: unknown, currentMessage: string): Promise<ChatReply> {
  switch (name) {
    case "search_products": {
      const filter = productSearchSchema.parse(input);
      const products = await db.product.findMany({
        where: {
          stock: { gt: 0 }, ...(filter.type && { type: filter.type }),
          ...(filter.roast && { roastLevel: filter.roast }), ...(filter.brew && { brewMethods: { has: filter.brew } }),
          ...(filter.acidity && { acidity: filter.acidity }),
          ...(filter.maxPriceCents !== undefined && { priceCents: { lte: filter.maxPriceCents } }),
          ...(filter.query && { name: { contains: filter.query, mode: "insensitive" } }),
        }, select: chatProductSelect, take: 3, orderBy: [{ featured: "desc" }, { sortOrder: "asc" }, { id: "asc" }],
      });
      return { topic: "products", products, text: products.length
        ? "Here are some matches from our shop. The cards show the latest prices and availability. Coffee added here is whole bean; open a product to choose another grind."
        : "I couldn't find an available product matching those preferences. Try a different roast, brew method or budget, or ask the team for help.", handoff: !products.length };
    }
    case "get_product": {
      const { id } = productIdSchema.parse(input);
      const product = await db.product.findUnique({ where: { id }, select: chatProductSelect });
      return { topic: "product-detail", products: product ? [product] : [], text: product
        ? "Here are the current details from our catalog. Open the product for its full description and grind options."
        : "That product isn't in our catalog. Let's search for another coffee.", handoff: !product };
    }
    case "get_order_status": {
      const { order_number, email } = orderToolSchema.parse(input);
      const suppliedOrders: string[] = currentMessage.toUpperCase().match(/\bEO-[A-F0-9]{16}\b/g) ?? [];
      const suppliedEmails: string[] = currentMessage.toLowerCase().match(/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/g) ?? [];
      if (!suppliedOrders.includes(order_number) || !suppliedEmails.includes(email)) {
        return { topic: "order-credentials", text: safeReplies.order_details };
      }
      const order = await lookupOrder({ orderNumber: order_number, email });
      return order ? { topic: "order-status", text: "Here's the status recorded for your order. This is a demo; no real order will be shipped.",
        order: { number: order.number, status: order.status, totalCents: order.totalCents, trackingNumber: order.trackingNumber } }
        : { topic: "order-not-found", text: "I couldn't find an order matching both details. Please check the number and checkout email, or choose Talk to a human.", handoff: true };
    }
    case "answer_store_question": {
      const { id } = knowledgeSchema.parse(input);
      const entry = knowledge.find((item) => item.id === id)!;
      return { topic: id, text: entry.answer };
    }
    case "respond": {
      const { kind } = replySchema.parse(input);
      return { topic: kind, text: safeReplies[kind], handoff: kind === "handoff" };
    }
    default: throw new Error("Unknown chat tool.");
  }
}
