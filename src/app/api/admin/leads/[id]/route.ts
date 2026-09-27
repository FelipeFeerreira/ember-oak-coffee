import { adminCookieValue, getAdminSession } from "@/lib/admin/auth";
import { leadUpdateSchema } from "@/lib/admin/schema";
import { adminError } from "@/lib/admin/errors";
import { db } from "@/lib/db";
import { privateJson, readBody, requireSameOrigin } from "@/lib/http";

export async function PATCH(request: Request, context: RouteContext<"/api/admin/leads/[id]">) {
  try {
    requireSameOrigin(request);
    if (!await getAdminSession(adminCookieValue(request))) return privateJson({ error: "Please sign in again." }, 401);
    const { id } = await context.params;
    if (id.length > 64) return privateJson({ error: "Request not found." }, 404);
    const { status, expectedStatus } = leadUpdateSchema.parse(JSON.parse(await readBody(request, 1024)));
    const updated = await db.lead.updateMany({ where: { id, status: expectedStatus }, data: { status } });
    if (!updated.count) return privateJson({ error: "This request changed or no longer exists. Refresh before trying again." }, 409);
    return privateJson({ status });
  } catch (error) { return adminError(error); }
}
