import { db } from "@/lib/db";
import { leadSchema } from "@/lib/chat/schema";
import { currentConversation } from "@/lib/chat/session";
import { consumeLimit, requestLimitKey } from "@/lib/rate-limit";
import { privateJson, readBody, requireSameOrigin } from "@/lib/http";
import { CheckoutError } from "@/lib/checkout/schema";

export async function POST(request: Request) {
  try {
    requireSameOrigin(request);
    const parsed = leadSchema.safeParse(JSON.parse(await readBody(request, 12_000)));
    if (!parsed.success) return privateJson({ error: "Please complete all fields and agree to save your request." }, 400);
    const conversation = await currentConversation(request);
    if (!conversation) return privateJson({ error: "Please close and reopen the chat, then try again." }, 401);
    if (!await consumeLimit(requestLimitKey(request, "chat-lead"), 5, 3600)) return privateJson({ error: "Too many requests. Please try again in an hour." }, 429);
    const { requestId, name, email, question } = parsed.data;
    const data = { requestId, name, email, question };
    const existing = await db.lead.findUnique({ where: { requestId: data.requestId } });
    if (existing && existing.conversationId !== conversation.id) return privateJson({ error: "Please try again with a new request." }, 409);
    const saved = await db.lead.upsert({ where: { requestId: data.requestId }, update: {}, create: { ...data, conversationId: conversation.id } });
    if (saved.conversationId !== conversation.id) return privateJson({ error: "Please try again with a new request." }, 409);
    return privateJson({ saved: true });
  } catch (error) {
    if (error instanceof CheckoutError) return privateJson({ error: error.message }, error.status);
    if (error instanceof SyntaxError) return privateJson({ error: "Invalid request." }, 400);
    return privateJson({ error: "We couldn't save your request. Please try again." }, 503);
  }
}
