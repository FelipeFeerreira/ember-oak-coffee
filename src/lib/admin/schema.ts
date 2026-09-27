import { z } from "zod";

export const adminLoginSchema = z.object({ token: z.string().min(1).max(256) }).strict();
export const LEAD_STATUSES = ["OPEN", "CONTACTED", "CLOSED"] as const;
export const leadUpdateSchema = z.object({ status: z.enum(LEAD_STATUSES), expectedStatus: z.enum(LEAD_STATUSES) }).strict();
export const ADMIN_VIEWS = ["overview", "orders", "conversations", "leads"] as const;
export const dashboardQuerySchema = z.object({
  view: z.enum(ADMIN_VIEWS).catch("overview"),
  page: z.coerce.number().int().min(1).max(100_000).catch(1),
  conversation: z.string().max(64).optional().catch(undefined),
});
export const leadStatusLabels = { OPEN: "Open", CONTACTED: "Contacted", CLOSED: "Closed" };
