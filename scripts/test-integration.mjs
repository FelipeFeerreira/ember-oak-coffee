import { spawnSync } from "node:child_process";
import { config } from "dotenv";

config({ path: ".env.local", quiet: true });
const databaseUrl = process.env.TEST_DATABASE_URL ?? "postgresql://ember:ember@localhost:5433/ember_oak_test";
const target = new URL(databaseUrl);
if (!["localhost", "127.0.0.1", "[::1]"].includes(target.hostname) || !target.pathname.endsWith("_test")) {
  throw new Error("Integration tests require a local database whose name ends in _test.");
}
const env = { ...process.env, DATABASE_URL: databaseUrl, DIRECT_URL: databaseUrl, NODE_ENV: "test", RESEND_API_KEY: "", ANTHROPIC_API_KEY: "",
  STRIPE_SECRET_KEY: "sk_test_local_fixture", STRIPE_WEBHOOK_SECRET: "whsec_local_fixture",
  NEXT_PUBLIC_SITE_URL: "http://localhost:3100" };
for (const args of [
  ["node_modules/prisma/build/index.js", "migrate", "deploy"],
  ["node_modules/vitest/vitest.mjs", "run", "--config", "vitest.integration.config.mts"],
]) {
  const result = spawnSync(process.execPath, args, { env, stdio: "inherit" });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}
