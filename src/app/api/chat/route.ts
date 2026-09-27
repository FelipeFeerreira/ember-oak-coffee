import { answerChat } from "@/lib/chat/agent";
import { chatInputSchema, type ChatEvent } from "@/lib/chat/schema";
import { beginChatTurn, currentConversation, finishChatTurn, releaseChatTurn } from "@/lib/chat/session";
import { CHAT_UNAVAILABLE } from "@/lib/chat/constants";
import { CheckoutError } from "@/lib/checkout/schema";
import { consumeLimit, requestLimitKey } from "@/lib/rate-limit";
import { privateJson, readBody, requireSameOrigin } from "@/lib/http";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(request: Request) {
  try {
    requireSameOrigin(request);
    const parsed = chatInputSchema.safeParse(JSON.parse(await readBody(request, 8192)));
    if (!parsed.success) return privateJson({ error: "Please send a message of 1–1000 characters." }, 400);
    const conversation = await currentConversation(request);
    if (!conversation) return privateJson({ error: "Your chat session expired. Please close and reopen the chat." }, 401);
    if (!await consumeLimit(requestLimitKey(request, "chat-message"), 30)) return privateJson({ error: "Please take a short break and try again in 15 minutes." }, 429);
    // One model call per admitted turn, plus a shared daily cap across all visitors.
    if (process.env.ANTHROPIC_API_KEY && !await consumeLimit(`chat-global:${new Date().toISOString().slice(0, 10)}`, 250, 86_400)) {
      return privateJson({ error: "Our coffee guide has reached today's demo limit. You can still use the FAQ or Talk to a human." }, 429);
    }
    const { message, requestId } = parsed.data;
    const history = await beginChatTurn(conversation.id, requestId, message);
    const abort = new AbortController();
    const deadline = setTimeout(() => abort.abort(), 24_000);
    const signal = AbortSignal.any([abort.signal, request.signal]);
    const encoder = new TextEncoder();
    const body = new ReadableStream({
      async start(controller) {
        const emit = (event: ChatEvent) => { if (!signal.aborted) controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`)); };
        try {
          emit({ type: "status", text: "Preparing your reply…" });
          let result;
          try { result = await answerChat(message, history, signal); }
          catch { result = { reply: { text: CHAT_UNAVAILABLE, topic: "provider-error", handoff: true }, costMicrousd: 0 }; }
          const saved = await finishChatTurn(conversation.id, requestId, result.reply, result.costMicrousd);
          // Stream only verified content, never partial/unvalidated model instructions or prose.
          for (const text of result.reply.text.match(/[\s\S]{1,100}/g) ?? [result.reply.text]) emit({ type: "text", text });
          emit({ type: "result", ...saved });
        } catch {
          emit({ type: "error", text: CHAT_UNAVAILABLE });
        } finally {
          clearTimeout(deadline);
          await releaseChatTurn(conversation.id, requestId).catch(() => {});
          try { controller.close(); } catch { /* The reader may have cancelled. */ }
        }
      },
      cancel() { abort.abort(); clearTimeout(deadline); },
    });
    return new Response(body, { headers: { "Content-Type": "application/x-ndjson; charset=utf-8", "Cache-Control": "no-store, no-transform", "X-Accel-Buffering": "no" } });
  } catch (error) {
    if (error instanceof CheckoutError) return privateJson({ error: error.message }, error.status);
    if (error instanceof SyntaxError) return privateJson({ error: "Invalid request." }, 400);
    return privateJson({ error: CHAT_UNAVAILABLE }, 503);
  }
}
