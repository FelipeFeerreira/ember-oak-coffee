import { adminConfigured, adminCookieValue, createAdminSession, revokeAdminSession, sessionCookie, verifyAdminToken } from "@/lib/admin/auth";
import { adminLoginSchema } from "@/lib/admin/schema";
import { adminError } from "@/lib/admin/errors";
import { privateJson, readBody, requireSameOrigin } from "@/lib/http";
import { consumeLimit, requestLimitKey } from "@/lib/rate-limit";

export async function POST(request: Request) {
  try {
    requireSameOrigin(request);
    if (!adminConfigured()) return privateJson({ error: "Owner access has not been configured." }, 503);
    if (!await consumeLimit(requestLimitKey(request, "admin-login"), 8) ||
        !await consumeLimit("admin-login:global", 100)) {
      return privateJson({ error: "Too many sign-in attempts. Please try again in 15 minutes." }, 429);
    }
    const { token } = adminLoginSchema.parse(JSON.parse(await readBody(request, 1024)));
    if (!verifyAdminToken(token)) return privateJson({ error: "The access token is not valid." }, 401);
    await revokeAdminSession(adminCookieValue(request));
    const response = privateJson({ ok: true });
    response.headers.set("Set-Cookie", sessionCookie(await createAdminSession()));
    return response;
  } catch (error) { return adminError(error); }
}

export async function DELETE(request: Request) {
  try {
    requireSameOrigin(request);
    await revokeAdminSession(adminCookieValue(request));
    const response = privateJson({ ok: true });
    response.headers.set("Set-Cookie", sessionCookie("", 0));
    return response;
  } catch (error) { return adminError(error); }
}
