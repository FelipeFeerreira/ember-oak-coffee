"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { LockKeyhole, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function AdminLogin({ configured }: { configured: boolean }) {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError("");
    try {
      const response = await fetch("/api/admin/session", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token }) });
      setToken("");
      if (!response.ok) { setError((await response.json()).error ?? "Unable to sign in."); return; }
      router.refresh();
    } catch { setError("Unable to connect. Please try again."); }
    finally { setBusy(false); }
  }
  return <div className="mx-auto w-full max-w-md rounded-3xl border border-border bg-card p-8 shadow-sm sm:p-10">
    <div className="mb-7 flex size-12 items-center justify-center rounded-2xl bg-latte"><LockKeyhole className="text-ember" aria-hidden="true" /></div>
    <p className="text-xs font-semibold tracking-[.18em] text-ember uppercase">Owner access</p>
    <h1 className="mt-3 text-3xl font-semibold">Welcome back.</h1>
    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">Your roastery, at a glance. Sign in to review orders and see how your coffee guide helps customers.</p>
    {configured ? <form onSubmit={submit} className="mt-7 space-y-4">
      <div><label htmlFor="owner-token" className="mb-2 block text-sm font-semibold">Access token</label>
        <Input id="owner-token" type="password" autoComplete="current-password" maxLength={256} required value={token} onChange={event => setToken(event.target.value)} disabled={busy} />
      </div>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <Button type="submit" className="w-full" disabled={busy}>{busy ? "Signing in…" : "Open dashboard"}</Button>
      <p className="text-xs text-muted-foreground">Private owner session. Automatically expires after eight hours.</p>
    </form> : <p role="status" className="mt-7 rounded-xl bg-latte p-4 text-sm">Owner access is not configured yet. Follow the local setup instructions in docs/ADMIN.md.</p>}
  </div>;
}

export function AdminLogout() {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function logout() {
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/admin/session", { method: "DELETE" });
      if (!response.ok) throw new Error();
      // A full navigation discards private dashboard data from the client router cache.
      window.location.replace("/admin");
    } catch { setError("Sign-out failed. Please try again."); setBusy(false); }
  }
  return <div><Button variant="outline" size="sm" onClick={logout} disabled={busy}><LogOut aria-hidden="true" />{busy ? "Signing out…" : "Sign out"}</Button>{error && <p role="alert" className="mt-2 text-xs text-destructive">{error}</p>}</div>;
}
