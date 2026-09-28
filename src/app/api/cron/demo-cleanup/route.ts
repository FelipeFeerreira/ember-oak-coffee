import { createHash, timingSafeEqual } from "node:crypto";
import { cleanDemo } from "@/lib/demo/cleanup";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: Request) {
  const headers = { "Cache-Control": "no-store" };
  const secret = process.env.CRON_SECRET;
  const authorization = request.headers.get("authorization") ?? "";
  const digest = (value: string) => createHash("sha256").update(value).digest();
  if (!secret || secret.length < 32 || !timingSafeEqual(digest(authorization), digest(`Bearer ${secret}`))) {
    return Response.json({ error: "Unauthorized" }, { status: 401, headers });
  }
  try {
    return Response.json(await cleanDemo(), { headers });
  } catch {
    console.error("Demo cleanup failed; its transaction was rolled back.");
    return Response.json({ error: "Cleanup failed" }, { status: 500, headers });
  }
}
