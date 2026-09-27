"use client";
import { usePathname } from "next/navigation";
import { ChatWidget } from "@/components/chat/chat-widget";

/** Keep the shopping widget and navigation out of the private owner workspace. */
export function StoreChrome({ children, header, footer }: { children: React.ReactNode; header: React.ReactNode; footer: React.ReactNode }) {
  const path = usePathname();
  const owner = path === "/admin" || path.startsWith("/admin/");
  return <>{!owner && header}<main id="main" className="flex-1">{children}</main>{!owner && <>{footer}<ChatWidget /></>}</>;
}
