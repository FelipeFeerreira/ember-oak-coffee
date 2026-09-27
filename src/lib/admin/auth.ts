import "server-only";
import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { db } from "@/lib/db";

export const ADMIN_COOKIE = "ember-oak-owner";
export const ADMIN_SESSION_SECONDS = 8 * 60 * 60;
const digest = (value: string) => createHash("sha256").update(value).digest("hex");

export function adminConfigured() {
  const token = process.env.ADMIN_TOKEN;
  return !!token && token.length >= 32 && token.length <= 256;
}

export function verifyAdminToken(token: string) {
  if (!adminConfigured()) return false;
  return timingSafeEqual(Buffer.from(digest(token)), Buffer.from(digest(process.env.ADMIN_TOKEN!)));
}

export function adminCookieValue(request: Request) {
  return request.headers.get("cookie")?.split(";").map(part => part.trim())
    .find(part => part.startsWith(`${ADMIN_COOKIE}=`))?.slice(ADMIN_COOKIE.length + 1);
}

export function sessionCookie(token: string, maxAge = ADMIN_SESSION_SECONDS) {
  return `${ADMIN_COOKIE}=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${maxAge}${process.env.NODE_ENV === "production" ? "; Secure" : ""}`;
}

export async function createAdminSession() {
  if (!adminConfigured()) throw new Error("Owner access is not configured.");
  const token = randomBytes(32).toString("hex");
  await db.adminSession.deleteMany({ where: { expiresAt: { lte: new Date() } } });
  await db.adminSession.create({ data: {
    tokenHash: digest(token), secretHash: digest(process.env.ADMIN_TOKEN!),
    expiresAt: new Date(Date.now() + ADMIN_SESSION_SECONDS * 1000),
  } });
  return token;
}

export async function getAdminSession(token: string | undefined) {
  if (!adminConfigured() || !token || !/^[a-f0-9]{64}$/.test(token)) return null;
  const session = await db.adminSession.findUnique({ where: { tokenHash: digest(token) } });
  if (!session || session.expiresAt.getTime() <= Date.now() || session.secretHash !== digest(process.env.ADMIN_TOKEN!)) return null;
  return session;
}

export async function revokeAdminSession(token: string | undefined) {
  if (token) await db.adminSession.deleteMany({ where: { tokenHash: digest(token) } });
}
