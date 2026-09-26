import "server-only";
import { createHash, randomBytes } from "node:crypto";
import type { MessageParam } from "@anthropic-ai/sdk/resources/messages";
import { db } from "@/lib/db";
import { CheckoutError } from "@/lib/checkout/schema";
import { CHAT_COOKIE, CHAT_HISTORY_MESSAGES, MAX_CHAT_MESSAGES } from "./constants";
import { redactChatText } from "./knowledge";
import { chatProductSelect } from "./tools";
import type { ChatReply, ChatViewMessage } from "./schema";

export function hashChatToken(token: string) { return createHash("sha256").update(token).digest("hex"); }

export async function currentConversation(request: Request) {
  const token = request.headers.get("cookie")?.split(";").map((part) => part.trim()).find((part) => part.startsWith(`${CHAT_COOKIE}=`))?.slice(CHAT_COOKIE.length + 1);
  if (!token || !/^[a-f0-9]{64}$/.test(token)) return null;
  return db.conversation.findFirst({ where: { tokenHash: hashChatToken(token), expiresAt: { gt: new Date() } } });
}

export async function createConversation() {
  const token = randomBytes(32).toString("hex");
  const conversation = await db.conversation.create({ data: {
    tokenHash: hashChatToken(token), expiresAt: new Date(Date.now() + 86_400_000), leaseUntil: new Date(0),
  } });
  const cookie = `${CHAT_COOKIE}=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=86400${process.env.NODE_ENV === "production" ? "; Secure" : ""}`;
  return { conversation, cookie };
}

export async function conversationMessages(conversationId: string): Promise<ChatViewMessage[]> {
  const messages = await db.chatMessage.findMany({
    where: { conversationId }, orderBy: [{ createdAt: "desc" }, { id: "desc" }], take: MAX_CHAT_MESSAGES * 2,
    include: { recommendations: { include: { product: { select: chatProductSelect } } } },
  });
  return messages.reverse().map((message) => ({
    id: message.id, role: message.role, text: message.content,
    products: message.recommendations.map((entry) => entry.product),
    handoff: ["handoff", "offline", "tool-error", "provider-error", "invalid-model-output"].includes(message.topic ?? ""),
  }));
}

export async function beginChatTurn(conversationId: string, requestId: string, message: string) {
  return db.$transaction(async (tx) => {
    const duplicate = await tx.chatMessage.findUnique({ where: { conversationId_requestId_role: { conversationId, requestId, role: "USER" } } });
    if (duplicate) throw new CheckoutError("This message was already received. Reopen the chat to see its reply.");
    const claimed = await tx.conversation.updateMany({ where: {
      id: conversationId, expiresAt: { gt: new Date() }, messageCount: { lt: MAX_CHAT_MESSAGES },
      OR: [{ activeRequestId: null }, { leaseUntil: { lt: new Date() } }],
    }, data: { messageCount: { increment: 1 }, activeRequestId: requestId, leaseUntil: new Date(Date.now() + 60_000) } });
    if (claimed.count !== 1) throw new CheckoutError("Please wait for the current reply. If you've reached 20 messages, use the FAQ or Talk to a human.", 429);
    const history = await tx.chatMessage.findMany({ where: { conversationId }, orderBy: [{ createdAt: "desc" }, { id: "desc" }], take: CHAT_HISTORY_MESSAGES,
      include: { recommendations: { include: { product: { select: { id: true, name: true } } } } },
    });
    await tx.chatMessage.create({ data: { conversationId, requestId, role: "USER", content: redactChatText(message) } });
    return history.reverse().map((item): MessageParam => ({ role: item.role === "USER" ? "user" : "assistant",
      content: `${item.content.slice(0, 2000)}${item.recommendations.length ? `\nProducts shown: ${item.recommendations.map((entry) => `${entry.product.name} (id: ${entry.productId})`).join(", ")}` : ""}`,
    }));
  });
}

export async function finishChatTurn(conversationId: string, requestId: string, reply: ChatReply, costMicrousd: number) {
  return db.$transaction(async (tx) => {
    const updated = await tx.conversation.updateMany({ where: { id: conversationId, activeRequestId: requestId },
      data: { activeRequestId: null, leaseUntil: new Date(0), costMicrousd: { increment: costMicrousd } },
    });
    if (updated.count !== 1) throw new Error("Chat turn lease expired.");
    const message = await tx.chatMessage.create({ data: {
      conversationId, requestId, role: "ASSISTANT", content: reply.text, topic: reply.topic,
      recommendations: { create: (reply.products ?? []).map((product) => ({ productId: product.id })) },
    } });
    const conversation = await tx.conversation.findUniqueOrThrow({ where: { id: conversationId } });
    return { message: { id: message.id, role: "ASSISTANT" as const, text: reply.text, products: reply.products, order: reply.order, handoff: reply.handoff },
      remaining: MAX_CHAT_MESSAGES - conversation.messageCount };
  });
}

export async function releaseChatTurn(conversationId: string, requestId: string) {
  await db.conversation.updateMany({ where: { id: conversationId, activeRequestId: requestId }, data: { activeRequestId: null, leaseUntil: new Date(0) } });
}
