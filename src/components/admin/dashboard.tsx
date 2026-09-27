import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Coffee, MessageCircle, ShoppingBag, Users, TrendingUp, Inbox } from "lucide-react";
import { formatPrice } from "@/lib/money";
import { grindLabels, type Grind } from "@/lib/cart/schema";
import type { DashboardData } from "@/lib/admin/dashboard";
import { ADMIN_VIEWS } from "@/lib/admin/schema";
import { AdminLogout } from "./access";
import { LeadStatusEditor } from "./lead-status";

const date = (value: Date) => new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" }).format(value);
const labels = { overview: "Overview", orders: "Orders", conversations: "Conversations", leads: "Support requests" };
const statusLabels: Record<string, string> = { PENDING: "Pending payment", PAID: "Paid", PAYMENT_REVIEW: "Needs review", EXPIRED: "Expired", SHIPPED: "Shipped", DELIVERED: "Delivered" };
const panel = "rounded-2xl border border-border bg-card p-5 sm:p-7";

function Empty({ title, children }: { title: string; children: React.ReactNode }) {
  return <div className="rounded-2xl border border-dashed border-border px-6 py-12 text-center"><Inbox className="mx-auto mb-4 size-8 text-oak" aria-hidden="true" /><h3 className="text-xl font-semibold">{title}</h3><p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">{children}</p></div>;
}

export function OwnerDashboard({ data }: { data: DashboardData }) {
  const m = data.metrics;
  const maxDaily = Math.max(1, ...data.daily.map(day => day.count));
  return <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
    <header className="mb-8 flex flex-wrap items-start justify-between gap-5">
      <div><p className="text-xs font-semibold tracking-[.2em] text-ember uppercase">Ember &amp; Oak · Owner workspace</p><h1 className="mt-2 text-3xl font-semibold sm:text-5xl">A little clarity for your day.</h1><p className="mt-3 text-sm text-muted-foreground">Your orders, your customers, and the conversations in between.</p></div><AdminLogout />
    </header>
    <nav aria-label="Owner dashboard" className="mb-8 flex flex-wrap gap-2 border-b border-border pb-4">
      {ADMIN_VIEWS.map(view => <Link key={view} href={`/admin?view=${view}`} prefetch={false} aria-current={view === data.view ? "page" : undefined} className={`rounded-full px-4 py-2 text-sm font-medium ${view === data.view ? "bg-espresso text-cream" : "bg-latte/60 hover:bg-latte"}`}>{labels[view]}</Link>)}
    </nav>

    {data.view === "overview" && <>
      <div className="mb-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Conversations", value: m.conversations.toLocaleString("en-US"), detail: "Sessions with a customer message", icon: MessageCircle },
          { label: "Chat → cart", value: `${m.conversionRate.toFixed(1)}%`, detail: `${m.converted} conversations with a cart addition`, icon: TrendingUp },
          { label: "Open requests", value: m.openLeads.toLocaleString("en-US"), detail: "Customers waiting for your attention", icon: Users },
          { label: "Paid test orders", value: m.paidOrders.toLocaleString("en-US"), detail: `${formatPrice(m.revenueCents)} in confirmed test payments`, icon: ShoppingBag },
        ].map(item => <section key={item.label} className={panel}><div className="flex items-center justify-between"><h2 className="font-sans text-sm font-medium text-muted-foreground">{item.label}</h2><item.icon className="size-5 text-ember" aria-hidden="true" /></div><p className="mt-5 font-heading text-4xl font-semibold tabular-nums">{item.value}</p><p className="mt-2 text-xs leading-relaxed text-muted-foreground">{item.detail}</p></section>)}
      </div>
      <div className="grid gap-6 lg:grid-cols-[1.25fr_1fr]">
        <section className={panel}><div className="flex flex-wrap items-baseline justify-between gap-2"><h2 className="text-2xl font-semibold">Coffee conversations</h2><span className="text-xs text-muted-foreground">Last 7 days · UTC</span></div><p className="mt-2 text-sm text-muted-foreground">New conversations that included a customer message.</p>
          <div className="mt-8 grid h-48 grid-cols-7 items-end gap-2 sm:gap-4" role="img" aria-label={data.daily.map(day => `${day.day}: ${day.count}`).join("; ")}>
            {data.daily.map(day => <div key={day.day} className="flex h-full flex-col justify-end text-center"><span className="mb-2 text-xs font-semibold tabular-nums">{day.count}</span><div className="mx-auto w-full max-w-12 rounded-t-lg bg-ember/80" style={{ height: `${Math.max(2, day.count / maxDaily * 75)}%` }} /><span className="mt-3 text-[10px] text-muted-foreground sm:text-xs">{day.day.slice(5)}</span></div>)}
          </div>
        </section>
        <section className="rounded-2xl bg-espresso p-6 text-cream sm:p-8"><Coffee className="size-8 text-[#e0b591]" aria-hidden="true" /><p className="mt-5 text-xs tracking-[.18em] text-cream/70 uppercase">From curiosity to a cart</p><h2 className="mt-3 text-3xl font-semibold">A guide that helps customers find their coffee.</h2><p className="mt-4 text-sm leading-relaxed text-cream/80">See what people ask, which products get recommended and where the team can help. Cart additions measure interest, not completed sales.</p><Link href="/admin?view=conversations" prefetch={false} className="mt-6 inline-flex items-center gap-3 text-sm font-semibold underline underline-offset-4">Explore conversations <ArrowUpRight className="size-4" /></Link></section>
        <section className={panel}><h2 className="text-2xl font-semibold">Most recommended</h2><p className="mt-2 mb-5 text-sm text-muted-foreground">Product cards shown by the assistant · all time</p>
          {data.recommendations.length ? <ol className="space-y-4">{data.recommendations.map((product, index) => <li key={product.id} className="flex items-center gap-3 border-b border-border pb-4 last:border-0 last:pb-0"><span className="text-xs text-muted-foreground">{String(index + 1).padStart(2, "0")}</span><Image src={product.imageUrl} alt={product.imageAlt} width={48} height={48} className="size-12 rounded-xl object-cover" /><Link href={`/shop/${product.slug}`} className="min-w-0 flex-1 text-sm font-semibold hover:text-ember">{product.name}</Link><span className="rounded-full bg-latte px-3 py-1 text-sm font-semibold">{product.count}</span></li>)}</ol> : <Empty title="Your next discovery starts here">Recommendations will appear after customers use the coffee guide.</Empty>}
        </section>
        <section className={panel}><h2 className="text-2xl font-semibold">Most frequent questions</h2><p className="mt-2 mb-5 text-sm text-muted-foreground">Grouped by assistant answer topic · all time</p>
          {data.topics.length ? <ol className="space-y-5">{data.topics.map(item => <li key={item.topic}><div className="mb-2 flex justify-between gap-4 text-sm"><span>{item.label}</span><strong>{item.count}</strong></div><div className="h-1.5 overflow-hidden rounded-full bg-latte"><div className="h-full rounded-full bg-oak/70" style={{ width: `${item.count / Math.max(1, data.topics[0].count) * 100}%` }} /></div></li>)}</ol> : <Empty title="Listening for the first question">Topics come from recorded assistant replies, never invented sample statistics.</Empty>}
        </section>
      </div>
      <p className="mt-6 text-xs leading-relaxed text-muted-foreground">Summary cards use all retained records. Chat → cart counts distinct conversations with a recommendation click. Estimated recorded AI cost: ${(m.costMicrousd / 1_000_000).toFixed(4)}. This estimate may omit interrupted calls and is not a provider bill. All payments in this store are test payments.</p>
    </>}

    {data.view === "orders" && <section aria-labelledby="orders-heading"><h2 id="orders-heading" className="mb-5 text-2xl font-semibold">Orders <span className="text-muted-foreground">({data.total})</span></h2>
      {data.orders.length ? <div className="space-y-4">{data.orders.map(order => <article key={order.id} className={panel}><header className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="break-all font-sans text-sm font-semibold">{order.number}</h3><p className="mt-1 text-xs text-muted-foreground">{date(order.createdAt)} UTC</p></div><span className={`rounded-full px-3 py-1 text-xs font-semibold ${order.status === "PAYMENT_REVIEW" ? "bg-red-100 text-red-900" : "bg-latte text-espresso"}`}>{statusLabels[order.status]}</span></header><p className="mt-4 break-words text-sm">{order.customerName ?? "Guest checkout"} · {order.email ?? "Email not provided yet"}</p><ul className="mt-4 space-y-2 border-t border-border pt-4">{order.items.map(item => <li key={item.id} className="flex justify-between gap-3 text-sm"><span>{item.quantity} × {item.name}{item.grind && <span className="text-muted-foreground"> · {grindLabels[item.grind as Grind] ?? item.grind}</span>}</span><span className="shrink-0">{formatPrice(item.quantity * item.unitPriceCents)}</span></li>)}</ul><p className="mt-4 text-right font-semibold">Total {formatPrice(order.totalCents)}</p></article>)}</div> : <Empty title="No orders yet">Checkout activity will appear here. Payment status is confirmed by the signed Stripe webhook.</Empty>}
    </section>}

    {data.view === "leads" && <section aria-labelledby="leads-heading"><h2 id="leads-heading" className="mb-5 text-2xl font-semibold">Support requests <span className="text-muted-foreground">({data.total})</span></h2>
      {data.leads.length ? <div className="grid gap-5 lg:grid-cols-2">{data.leads.map(lead => <article key={lead.id} className={panel}><h3 className="text-xl font-semibold">{lead.name}</h3><p className="mt-1 break-all text-sm text-muted-foreground">{lead.email}</p><p className="mt-2 text-xs text-muted-foreground">{date(lead.createdAt)} UTC</p><p className="my-5 whitespace-pre-wrap text-sm leading-relaxed [overflow-wrap:anywhere]">{lead.question}</p><LeadStatusEditor key={`${lead.id}:${lead.status}`} id={lead.id} status={lead.status} /></article>)}</div> : <Empty title="All quiet at the help desk">Requests submitted through Talk to a human will appear here. Changing a status does not send an email.</Empty>}
    </section>}

    {data.view === "conversations" && <section aria-labelledby="conversations-heading"><h2 id="conversations-heading" className="mb-5 text-2xl font-semibold">Conversations <span className="text-muted-foreground">({data.total})</span></h2>
      <div className="grid gap-6 lg:grid-cols-[.8fr_1.2fr]"><div className="space-y-3">{data.threads.length ? data.threads.map(thread => <Link key={thread.id} prefetch={false} href={`/admin?view=conversations&page=${data.page}&conversation=${thread.id}`} aria-current={data.transcript?.id === thread.id ? "true" : undefined} className={`block rounded-2xl border p-5 ${data.transcript?.id === thread.id ? "border-ember bg-latte" : "border-border bg-card hover:border-oak"}`}><h3 className="line-clamp-2 font-sans text-sm font-semibold [overflow-wrap:anywhere]">{thread.messages[0]?.content ?? "Conversation"}</h3><p className="mt-3 text-xs text-muted-foreground">{date(thread.createdAt)} UTC</p><p className="mt-1 text-xs text-muted-foreground">{thread._count.messages} messages · ${(thread.costMicrousd / 1_000_000).toFixed(4)} estimated</p></Link>) : <Empty title="No conversations yet">Sessions appear after a customer sends a message. Simply opening the widget does not count.</Empty>}</div>
      <div className={panel}>{data.transcript ? <><h3 className="text-xl font-semibold">Conversation transcript</h3><p className="mt-2 mb-6 text-xs text-muted-foreground">{date(data.transcript.createdAt)} UTC · Saved text; email addresses are redacted.</p><ol className="space-y-4">{data.transcript.messages.map(message => <li key={message.id} className={`rounded-xl p-4 ${message.role === "USER" ? "ml-4 bg-latte" : "mr-4 border border-border"}`}><p className="mb-2 text-[10px] font-semibold tracking-wider text-oak uppercase">{message.role === "USER" ? "Customer" : "Coffee guide"}</p><p className="whitespace-pre-wrap text-sm leading-relaxed [overflow-wrap:anywhere]">{message.content}</p>{message.recommendations.map((item, index) => <p key={index} className="mt-2 text-xs text-ember">Recommended: {item.product.name}{item.addedToCartAt ? " · Added to cart" : ""}</p>)}</li>)}</ol></> : <Empty title={data.selectedConversation ? "Conversation unavailable" : "Choose a conversation"}>{data.selectedConversation ? "This conversation may have been removed. Choose another from the list." : "Open a conversation to read the saved transcript and see recommended products."}</Empty>}</div></div>
    </section>}
    {data.view !== "overview" && data.pages > 1 && <nav aria-label="Pagination" className="mt-8 flex items-center justify-between text-sm">{data.page > 1 ? <Link prefetch={false} className="font-semibold text-ember underline" href={`/admin?view=${data.view}&page=${data.page - 1}`}>Previous</Link> : <span />}<span>Page {data.page} of {data.pages}</span>{data.page < data.pages ? <Link prefetch={false} className="font-semibold text-ember underline" href={`/admin?view=${data.view}&page=${data.page + 1}`}>Next</Link> : <span />}</nav>}
    <footer className="mt-12 border-t border-border pt-5 text-xs text-muted-foreground">Private owner workspace · Fictional portfolio store · Times shown in UTC</footer>
  </div>;
}
