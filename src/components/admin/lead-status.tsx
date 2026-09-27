"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { LEAD_STATUSES, leadStatusLabels } from "@/lib/admin/schema";
import { Button } from "@/components/ui/button";

export function LeadStatusEditor({ id, status }: { id: string; status: (typeof LEAD_STATUSES)[number] }) {
  const router = useRouter();
  const [selected, setSelected] = useState(status);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [failed, setFailed] = useState(false);
  async function save() {
    setBusy(true); setMessage(""); setFailed(false);
    try {
      const response = await fetch(`/api/admin/leads/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: selected, expectedStatus: status }) });
      const result = await response.json();
      if (!response.ok) { setFailed(true); setMessage(result.error ?? "Unable to save."); return; }
      setMessage("Status saved."); router.refresh();
    } catch { setFailed(true); setMessage("Unable to connect. Your change was not saved."); }
    finally { setBusy(false); }
  }
  return <div className="space-y-2"><div className="flex flex-wrap items-center gap-2">
    <label htmlFor={`lead-${id}`} className="sr-only">Request status</label>
    <select id={`lead-${id}`} value={selected} onChange={event => setSelected(event.target.value as typeof status)} disabled={busy} className="h-9 rounded-md border border-input bg-card px-2 text-sm focus-visible:outline-2 focus-visible:outline-ring">
      {LEAD_STATUSES.map(value => <option key={value} value={value}>{leadStatusLabels[value]}</option>)}
    </select>
    <Button size="sm" variant="outline" disabled={busy || selected === status} onClick={save}>{busy ? "Saving…" : "Save status"}</Button>
  </div>{message && <p role={failed ? "alert" : "status"} className={`text-xs ${failed ? "text-destructive" : "text-muted-foreground"}`}>{message}</p>}</div>;
}
