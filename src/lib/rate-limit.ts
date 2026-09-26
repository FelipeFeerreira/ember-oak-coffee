import "server-only";
import { createHash } from "node:crypto";
import { db } from "@/lib/db";

/** Atomic fixed-window counter. Row locking prevents concurrent requests bypassing the limit. */
export async function consumeLimit(key: string, limit: number, windowSeconds = 900) {
  const rows = await db.$queryRaw<{ count: number }[]>`
    INSERT INTO "RateLimit" ("key", "count", "expiresAt")
    VALUES (${key}, 1, NOW() + make_interval(secs => ${windowSeconds}::int))
    ON CONFLICT ("key") DO UPDATE SET
      "count" = CASE WHEN "RateLimit"."expiresAt" <= NOW() THEN 1 ELSE "RateLimit"."count" + 1 END,
      "expiresAt" = CASE WHEN "RateLimit"."expiresAt" <= NOW()
        THEN NOW() + make_interval(secs => ${windowSeconds}::int) ELSE "RateLimit"."expiresAt" END
    RETURNING "count"`;
  return rows[0].count <= limit;
}

export function requestLimitKey(request: Request, scope: string) {
  // Only deploy behind a proxy that overwrites this header (such as Vercel).
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0].trim().slice(0, 128) ?? "local";
  const digest = createHash("sha256").update(`${scope}:${ip}`).digest("hex");
  return `${scope}:${digest}`;
}
