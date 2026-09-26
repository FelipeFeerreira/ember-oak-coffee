import { db } from "@/lib/db";
import { conversionSchema } from "@/lib/chat/schema";
import { currentConversation } from "@/lib/chat/session";
import { privateJson, readBody, requireSameOrigin } from "@/lib/http";
import { CheckoutError } from "@/lib/checkout/schema";

export async function POST(request: Request) {
  try {
    requireSameOrigin(request);
    const parsed = conversionSchema.safeParse(JSON.parse(await readBody(request, 1024)));
    if (!parsed.success) return privateJson({ error: "Invalid recommendation." }, 400);
    const conversation = await currentConversation(request);
    if (!conversation) return privateJson({ error: "Chat session expired." }, 401);
    const result = await db.chatRecommendation.updateMany({ where: {
      messageId: parsed.data.messageId, productId: parsed.data.productId,
      message: { conversationId: conversation.id }, addedToCartAt: null,
    }, data: { addedToCartAt: new Date() } });
    return privateJson({ recorded: result.count === 1 });
  } catch (error) {
    if (error instanceof CheckoutError) return privateJson({ error: error.message }, error.status);
    return privateJson({ error: "Unable to record recommendation." }, 400);
  }
}
