import "server-only";
import { db } from "@/lib/db";
import { getAdminSession } from "./auth";
import { dashboardQuerySchema } from "./schema";
import { knowledge } from "@/lib/chat/knowledge";

export const PAGE_SIZE = 20;
const active = { messages: { some: { role: "USER" as const } } };
const topicLabels: Record<string, string> = {
  products: "Product recommendations", "product-detail": "Product details",
  "order-status": "Order tracking", "order-not-found": "Order not found",
  "order-credentials": "Order lookup help", order_details: "Order lookup help",
  greeting: "Getting started", clarify: "Coffee preferences", handoff: "Human support",
  off_topic: "Outside store scope", offline: "AI unavailable", "tool-error": "Tool unavailable",
  "invalid-model-output": "Assistant unavailable",
};
export function topicLabel(topic: string | null) {
  return knowledge.find(entry => entry.id === topic)?.question ?? topicLabels[topic ?? ""] ?? "Other store questions";
}

/** Authorization lives next to the private data, not just in the page layout. */
export async function readDashboard(token: string | undefined, input: unknown) {
  if (!await getAdminSession(token)) return null;
  const query = dashboardQuerySchema.parse(input);
  const since = new Date(); since.setUTCHours(0, 0, 0, 0); since.setUTCDate(since.getUTCDate() - 6);
  const [conversations, converted, openLeads, orderCount, leadCount, revenue, costs, recommendations, topics, daily] = await Promise.all([
    db.conversation.count({ where: active }),
    db.conversation.count({ where: { AND: [active, { messages: { some: { recommendations: { some: { addedToCartAt: { not: null } } } } } }] } }),
    db.lead.count({ where: { status: "OPEN" } }),
    db.order.count(), db.lead.count(),
    db.order.aggregate({ where: { status: { in: ["PAID", "SHIPPED", "DELIVERED"] } }, _sum: { totalCents: true }, _count: true }),
    db.conversation.aggregate({ where: active, _sum: { costMicrousd: true } }),
    db.chatRecommendation.groupBy({ by: ["productId"], _count: { _all: true }, orderBy: [{ _count: { productId: "desc" } }, { productId: "asc" }], take: 5 }),
    db.chatMessage.groupBy({ by: ["topic"], where: { role: "ASSISTANT", topic: { not: null } }, _count: { _all: true }, orderBy: [{ _count: { topic: "desc" } }, { topic: "asc" }], take: 5 }),
    db.$queryRaw<{ day: string; count: number }[]>`
      SELECT to_char(c."createdAt", 'YYYY-MM-DD') AS day, COUNT(*)::int AS count
      FROM "Conversation" c WHERE c."createdAt" >= ${since}
        AND EXISTS (SELECT 1 FROM "ChatMessage" m WHERE m."conversationId" = c.id AND m.role = 'USER')
      GROUP BY day ORDER BY day`,
  ]);
  const total = query.view === "orders" ? orderCount : query.view === "leads" ? leadCount : query.view === "conversations" ? conversations : 0;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.min(query.page, pages);
  const pagination = { take: PAGE_SIZE, skip: (page - 1) * PAGE_SIZE };
  const [products, orders, leads, threads, transcript] = await Promise.all([
    db.product.findMany({ where: { id: { in: recommendations.map(item => item.productId) } }, select: { id: true, name: true, slug: true, imageUrl: true, imageAlt: true } }),
    query.view === "orders" ? db.order.findMany({ ...pagination, orderBy: [{ createdAt: "desc" }, { id: "desc" }], select: {
      id: true, number: true, status: true, email: true, customerName: true, createdAt: true, totalCents: true,
      items: { select: { id: true, name: true, grind: true, quantity: true, unitPriceCents: true } },
    } }) : [],
    query.view === "leads" ? db.lead.findMany({ ...pagination, orderBy: [{ createdAt: "desc" }, { id: "desc" }], select: {
      id: true, name: true, email: true, question: true, status: true, createdAt: true,
    } }) : [],
    query.view === "conversations" ? db.conversation.findMany({ where: active, ...pagination, orderBy: [{ createdAt: "desc" }, { id: "desc" }], select: {
      id: true, createdAt: true, costMicrousd: true, _count: { select: { messages: true } },
      messages: { where: { role: "USER" }, orderBy: { createdAt: "asc" }, take: 1, select: { content: true } },
    } }) : [],
    query.view === "conversations" && query.conversation ? db.conversation.findUnique({ where: { id: query.conversation }, select: {
      id: true, createdAt: true, messages: { orderBy: [{ createdAt: "asc" }, { id: "asc" }], take: 100, select: {
        id: true, role: true, content: true, createdAt: true, recommendations: { select: { product: { select: { name: true } }, addedToCartAt: true } },
      } },
    } }) : null,
  ]);
  return {
    view: query.view, page, pages, total, orders, leads, threads, transcript,
    selectedConversation: query.conversation,
    metrics: { conversations, converted, conversionRate: conversations ? 100 * converted / conversations : 0,
      openLeads, orderCount, paidOrders: revenue._count, revenueCents: revenue._sum.totalCents ?? 0,
      costMicrousd: costs._sum.costMicrousd ?? 0 },
    recommendations: recommendations.map(item => ({ ...products.find(product => product.id === item.productId)!, count: item._count._all })),
    topics: topics.map(item => ({ topic: item.topic, label: topicLabel(item.topic), count: item._count._all })),
    daily: Array.from({ length: 7 }, (_, i) => {
      const date = new Date(since); date.setUTCDate(date.getUTCDate() + i);
      const day = date.toISOString().slice(0, 10);
      return { day, count: daily.find(item => item.day === day)?.count ?? 0 };
    }),
  };
}
export type DashboardData = NonNullable<Awaited<ReturnType<typeof readDashboard>>>;
