import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { AdminLogin } from "@/components/admin/access";
import { OwnerDashboard } from "@/components/admin/dashboard";
import { ADMIN_COOKIE, adminConfigured } from "@/lib/admin/auth";
import { readDashboard } from "@/lib/admin/dashboard";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Owner dashboard", robots: { index: false, follow: false } };

export default async function AdminPage({ searchParams }: PageProps<"/admin">) {
  const token = (await cookies()).get(ADMIN_COOKIE)?.value;
  const data = await readDashboard(token, await searchParams);
  return <div className="min-h-screen bg-cream"><div className="border-b border-border bg-card"><div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-5 sm:px-6"><Link href="/" aria-label="Ember & Oak, home"><Logo /></Link><Link href="/" className="text-sm font-medium text-oak hover:text-ember">Visit store ↗</Link></div></div>{data ? <OwnerDashboard data={data} /> : <div className="px-4 py-16 sm:py-24"><AdminLogin configured={adminConfigured()} /></div>}</div>;
}
