import "server-only";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

/**
 * One shared Prisma client per server process.
 *
 * In development, Next.js hot reload re-evaluates modules, which would open a
 * new connection pool on every change. Caching the client on `globalThis`
 * prevents "too many connections" errors.
 */
function createClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set. Copy .env.example to .env.local.");
  }
  return new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const db = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
