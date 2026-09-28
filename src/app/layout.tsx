import type { Metadata } from "next";
import { DM_Sans, Fraunces } from "next/font/google";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { Toaster } from "@/components/ui/sonner";
import { StoreChrome } from "@/components/layout/store-chrome";
import "./globals.css";

const display = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
  axes: ["SOFT", "opsz"],
});

const body = DM_Sans({
  variable: "--font-body",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3100"),
  title: {
    default: "Ember & Oak Coffee Roasters — Small-batch coffee from Portland",
    template: "%s · Ember & Oak Coffee Roasters",
  },
  description:
    "Specialty coffee roasted twice a week in Portland, Oregon. Single origins, espresso blends, gift bundles and brewing gear. (Portfolio demo store.)",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <a
          href="#main"
          className="sr-only z-50 rounded-md bg-espresso px-4 py-2 text-cream focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
        >
          Skip to content
        </a>
        <StoreChrome header={<SiteHeader />} footer={<SiteFooter />}>
          {children}
        </StoreChrome>
        <Toaster position="bottom-left" />
      </body>
    </html>
  );
}
