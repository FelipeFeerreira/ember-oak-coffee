"use client";

import { useRef, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export function ChatLeadForm({ onBack }: { onBack: () => void }) {
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const requestId = useRef<string | null>(null);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true); setError("");
    const fields = new FormData(event.currentTarget);
    requestId.current ??= crypto.randomUUID();
    try {
      const response = await fetch("/api/chat/lead", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId: requestId.current, name: fields.get("name"), email: fields.get("email"), question: fields.get("question"), consent: fields.get("consent") === "on" }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "We couldn't save your request.");
      setSaved(true);
    } catch (error) { setError(error instanceof Error ? error.message : "Please try again."); }
    finally { setBusy(false); }
  }
  if (saved) return <div className="space-y-4 p-5" role="status">
    <h3 className="text-2xl font-semibold">Your request is saved</h3>
    <p className="text-sm leading-relaxed text-muted-foreground">The store team can review it in the owner dashboard. This is a portfolio demo, so no real support response will be sent.</p>
    <Button variant="outline" onClick={onBack}>Back to chat</Button>
  </div>;
  return <form onSubmit={submit} className="space-y-4 p-5">
    <div><h3 className="text-2xl font-semibold">Talk to a human</h3>
      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">Leave a question for the team. Demo only: your request is saved, but no real support response is sent. Please use fictional details.</p></div>
    <div className="space-y-2"><Label htmlFor="chat-lead-name">Your name</Label><Input id="chat-lead-name" name="name" autoComplete="name" required maxLength={100} /></div>
    <div className="space-y-2"><Label htmlFor="chat-lead-email">Email address</Label><Input id="chat-lead-email" name="email" type="email" autoComplete="email" required maxLength={254} /></div>
    <div className="space-y-2"><Label htmlFor="chat-lead-question">How can we help?</Label><Textarea id="chat-lead-question" name="question" required minLength={5} maxLength={1500} rows={3} /></div>
    <label className="flex items-start gap-3 text-xs leading-relaxed"><input type="checkbox" name="consent" required className="mt-1 size-4 shrink-0 accent-amber-900" />I agree to store these details with my support request.</label>
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    <div className="flex gap-2"><Button type="submit" disabled={busy}>{busy ? "Saving…" : "Save request"}</Button><Button type="button" variant="ghost" disabled={busy} onClick={onBack}>Back to chat</Button></div>
  </form>;
}
