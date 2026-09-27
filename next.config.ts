import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    const headers = [
      { key: "Cache-Control", value: "private, no-store, max-age=0" },
      { key: "X-Robots-Tag", value: "noindex, nofollow" },
      { key: "Referrer-Policy", value: "no-referrer" },
      { key: "X-Frame-Options", value: "DENY" },
    ];
    return [{ source: "/admin/:path*", headers }, { source: "/api/admin/:path*", headers }];
  },
};

export default nextConfig;
