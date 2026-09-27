"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { Dialog } from "radix-ui";
import Link from "next/link";
import { Coffee, MessageCircle, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ChatProductCard } from "./product-card";
import { ChatLeadForm } from "./lead-form";
import { MAX_CHAT_MESSAGES } from "@/lib/chat/constants";
import type { ChatEvent, ChatViewMessage } from "@/lib/chat/schema";
import { formatPrice } from "@/lib/money";

const starters = ["Recommend coffee for espresso", "What is your shipping policy?", "Help me track my order"];
const statusLabels: Record<string, string> = { PENDING: "Awaiting payment", PAID: "Payment confirmed", PAYMENT_REVIEW: "Payment received; review needed", EXPIRED: "Checkout expired", SHIPPED: "Shipped", DELIVERED: "Delivered" };

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [ready, setReady] = useState(false);
  const [available, setAvailable] = useState(true);
  const [messages, setMessages] = useState<ChatViewMessage[]>([]);
  const [remaining, setRemaining] = useState(MAX_CHAT_MESSAGES);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [handoff, setHandoff] = useState(false);
  const scroll = useRef<HTMLDivElement>(null);
  const inFlight = useRef(false);
  const pendingRequest = useRef<AbortController | null>(null);
  const initializing = useRef(false);

  useEffect(() => { if (scroll.current) scroll.current.scrollTop = scroll.current.scrollHeight; }, [messages, status, open]);
  useEffect(() => () => pendingRequest.current?.abort(), []);

  async function loadSession() {
    if (initializing.current || inFlight.current) return;
    initializing.current = true;
    setReady(false); setError("");
    try {
      const response = await fetch("/api/chat/session", { method: "POST" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setMessages(data.messages); setRemaining(data.remaining); setAvailable(data.available); setReady(true);
    } catch (error) { setError(error instanceof Error ? error.message : "We couldn't open the chat. Please try again."); }
    finally { initializing.current = false; }
  }
  function changeOpen(next: boolean) { setOpen(next); if (next) void loadSession(); }

  async function send(text: string) {
    if (!text.trim() || !ready || inFlight.current || remaining <= 0) return;
    inFlight.current = true;
    setBusy(true); setError(""); setStatus("Preparing your reply…"); setInput("");
    const id = crypto.randomUUID();
    const temporary = `${id}-reply`;
    setMessages((previous) => [...previous, { id, role: "USER", text }, { id: temporary, role: "ASSISTANT", text: "" }]);
    const controller = new AbortController(); pendingRequest.current = controller;
    const timeout = setTimeout(() => controller.abort(), 35_000);
    let complete = false;
    try {
      const response = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, requestId: id }), signal: controller.signal,
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error ?? "We couldn't send your message.");
      }
      if (!response.body) throw new Error("The reply was interrupted. Please reopen the chat.");
      const reader = response.body.getReader(); const decoder = new TextDecoder(); let buffer = "";
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          let newline: number;
          while ((newline = buffer.indexOf("\n")) >= 0) {
            const line = buffer.slice(0, newline); buffer = buffer.slice(newline + 1);
            if (!line.trim()) continue;
            const event = JSON.parse(line) as ChatEvent;
            if (event.type === "status") setStatus(event.text);
            if (event.type === "text") setMessages((previous) => previous.map((item) => item.id === temporary ? { ...item, text: item.text + event.text } : item));
            if (event.type === "error") throw new Error(event.text);
            if (event.type === "result") {
              complete = true;
              setMessages((previous) => previous.map((item) => item.id === temporary ? event.message : item));
              setRemaining(event.remaining);
            }
          }
        }
      } finally { reader.releaseLock(); }
      if (!complete) throw new Error("The reply was interrupted. Close and reopen the chat to check it before sending again.");
    } catch (error) {
      setError(error instanceof Error && error.name !== "AbortError" ? error.message : "The reply took too long. Close and reopen the chat to check it.");
      setMessages((previous) => previous.filter((item) => item.id !== temporary));
    } finally {
      clearTimeout(timeout); setBusy(false); setStatus(""); inFlight.current = false; pendingRequest.current = null;
    }
  }
  function submit(event: FormEvent) { event.preventDefault(); void send(input.trim()); }

  return <Dialog.Root open={open} onOpenChange={changeOpen}>
    <Dialog.Trigger asChild><Button className="fixed right-4 bottom-4 z-40 h-12 rounded-full px-5 shadow-lg sm:right-6 sm:bottom-6" aria-label="Open coffee chat">
      <MessageCircle aria-hidden="true" /><span>Coffee chat</span>
    </Button></Dialog.Trigger>
    <Dialog.Portal>
      <Dialog.Overlay className="fixed inset-0 z-[60] bg-espresso/20 backdrop-blur-[2px]" />
      <Dialog.Content className="fixed inset-0 z-[70] flex h-dvh w-full flex-col overflow-hidden border-border bg-cream shadow-2xl sm:inset-auto sm:right-6 sm:bottom-6 sm:h-[min(720px,calc(100dvh-3rem))] sm:w-[420px] sm:rounded-3xl sm:border">
        <div className="flex shrink-0 items-start justify-between gap-3 bg-espresso px-5 py-5 text-cream">
          <div className="flex gap-3"><Coffee className="mt-1 size-6 text-latte" aria-hidden="true" /><div>
            <Dialog.Title className="font-heading text-xl font-semibold">Your coffee guide</Dialog.Title>
            <Dialog.Description className="mt-1 text-xs text-latte">A little guidance. A better cup.</Dialog.Description>
          </div></div>
          <Dialog.Close asChild><Button variant="ghost" size="icon" className="shrink-0 text-cream hover:bg-cream/10 hover:text-cream" aria-label="Close coffee chat"><X aria-hidden="true" /></Button></Dialog.Close>
        </div>
        {handoff ? <div className="min-h-0 flex-1 overflow-y-auto"><ChatLeadForm onBack={() => setHandoff(false)} /></div> : <>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4" ref={scroll} role="log" aria-label="Coffee chat conversation" aria-live={busy ? "off" : "polite"}>
            <div className="mb-5 rounded-2xl border border-border bg-card p-4 text-sm leading-relaxed">
              <p className="font-heading text-lg font-semibold">Find your everyday favorite.</p>
              <p className="mt-2 text-muted-foreground">Ask about coffee, brewing or an order. I use our catalog and written store policies.</p>
              {!available && <p className="mt-3 rounded-xl bg-latte p-3 text-xs">AI replies are not enabled in this demo yet. You can still explore the shop, track an order or leave a message for the team.</p>}
            </div>
            {messages.map((message) => <div key={message.id} className={`mb-4 ${message.role === "USER" ? "ml-8" : "mr-2"}`}>
              <p className="mb-1 text-[11px] font-semibold tracking-wide text-muted-foreground">{message.role === "USER" ? "YOU" : "COFFEE GUIDE"}</p>
              {message.text && <p className={`whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-relaxed [overflow-wrap:anywhere] ${message.role === "USER" ? "bg-espresso text-cream" : "border border-border bg-card"}`}>{message.text}</p>}
              {!!message.products?.length && <div className="mt-3 space-y-3">{message.products.map((product) => <ChatProductCard key={product.id} product={product} messageId={message.id} onNavigate={() => setOpen(false)} />)}</div>}
              {message.order && <div className="mt-3 space-y-2 rounded-2xl border border-border bg-card p-4 text-sm">
                <p className="font-semibold">{message.order.number}</p><p>{statusLabels[message.order.status] ?? "Please contact the team"}</p>
                <p>Total: {formatPrice(message.order.totalCents)}</p>
                {message.order.trackingNumber && <p className="break-all">Tracking: {message.order.trackingNumber}</p>}
                {message.order.status === "PAYMENT_REVIEW" && <p>Please contact the team. Do not pay again.</p>}
              </div>}
              {message.handoff && <Button variant="outline" size="sm" className="mt-3" onClick={() => setHandoff(true)}>Leave a message</Button>}
            </div>)}
            {messages.length === 0 && <div className="flex flex-col items-start gap-2">{starters.map((text) => <Button key={text} variant="outline" size="sm" disabled={!ready || busy} onClick={() => void send(text)} className="h-auto max-w-full py-2 text-left whitespace-normal">{text}</Button>)}</div>}
            {status && <p role="status" className="py-2 text-xs text-muted-foreground">{status}</p>}
          </div>
          <div className="shrink-0 border-t border-border bg-card p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
            {error && <p role="alert" className="mb-3 text-xs text-destructive">{error}</p>}
            {!ready && <Button variant="outline" size="sm" onClick={() => void loadSession()} className="mb-3">Reconnect chat</Button>}
            {remaining <= 0 && <p className="mb-3 text-xs text-muted-foreground">You&apos;ve reached this demo&apos;s message limit. The FAQ and contact form are still available.</p>}
            <form onSubmit={submit} className="flex items-end gap-2">
              <label htmlFor="coffee-chat-message" className="sr-only">Your message</label>
              <Textarea id="coffee-chat-message" rows={2} maxLength={1000} value={input} disabled={!ready || busy || remaining <= 0}
                onChange={(event) => setInput(event.target.value)} placeholder="How do you like your coffee?" className="min-h-12 resize-none text-base sm:text-sm"
                onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); void send(input.trim()); } }} />
              <Button type="submit" size="icon" className="size-12 shrink-0" disabled={!ready || busy || !input.trim() || remaining <= 0} aria-label="Send message"><Send aria-hidden="true" /></Button>
            </form>
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs">
              <button type="button" className="min-h-8 font-semibold text-ember underline-offset-4 hover:underline" disabled={!ready} onClick={() => setHandoff(true)}>Talk to a human</button>
              <Link href="/track-order" onClick={() => setOpen(false)} className="min-h-8 content-center hover:underline">Track order</Link>
              <Link href="/faq" onClick={() => setOpen(false)} className="min-h-8 content-center hover:underline">FAQ</Link>
            </div>
            <p className="mt-1 text-[10px] leading-relaxed text-muted-foreground">AI-assisted demo · {remaining} messages left. Chats are saved and may be sent to our AI provider. Don&apos;t share payment details.</p>
          </div>
        </>}
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>;
}
