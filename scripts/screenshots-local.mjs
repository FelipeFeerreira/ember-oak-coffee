import { spawn, spawnSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { config } from "dotenv";
import pg from "pg";

config({ path: ".env.local", quiet: true });
const url = new URL(process.env.DATABASE_URL);
if (!["localhost", "127.0.0.1"].includes(url.hostname)) throw new Error("Local screenshots require local Postgres.");
url.pathname = "/postgres";
const pool = new pg.Pool({ connectionString: url.toString() });
try {
  if (!(await pool.query("SELECT 1 FROM pg_database WHERE datname = 'ember_oak_capture_test'")).rowCount) {
    await pool.query('CREATE DATABASE "ember_oak_capture_test"');
  }
} finally { await pool.end(); }
url.pathname = "/ember_oak_capture_test";
const token = randomBytes(32).toString("hex");
const env = { ...process.env, DATABASE_URL: url.toString(), DIRECT_URL: url.toString(),
  ADMIN_TOKEN: token, SCREENSHOT_ADMIN_TOKEN: token, SCREENSHOT_BASE_URL: "http://localhost:3110",
  SCREENSHOT_STAGED_CHAT: "true", SCREENSHOT_FICTIONAL_DATA: "true",
  NEXT_PUBLIC_SITE_URL: "http://localhost:3110", ANTHROPIC_API_KEY: "", STRIPE_SECRET_KEY: "", STRIPE_WEBHOOK_SECRET: "",
  RESEND_API_KEY: "", DEMO_MODE: "false", CRON_SECRET: "", NODE_ENV: "production" };
function run(args) {
  const result = spawnSync(process.execPath, args, { env, stdio: "inherit" });
  if (result.error || result.status !== 0) throw new Error("Local screenshot preparation failed.");
}
run(["node_modules/prisma/build/index.js", "migrate", "deploy"]);
run(["node_modules/tsx/dist/cli.mjs", "scripts/seed-screenshots.ts"]);
// Use a production build so no development badge appears in the images.
// A private temporary token is passed only through this child process environment.
try {
  await fetch(env.SCREENSHOT_BASE_URL);
  throw new Error("Port 3110 is already in use. Stop that server before capturing.");
} catch (error) { if (!(error instanceof TypeError)) throw error; }
const server = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "-p", "3110"], { env, stdio: "ignore" });
try {
  let ready = false;
  for (let i = 0; i < 60; i++) {
    if (server.exitCode !== null) throw new Error("Capture server exited before startup.");
    try { ready = (await fetch(env.SCREENSHOT_BASE_URL)).ok; } catch { /* Wait for startup. */ }
    if (ready) break;
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  if (!ready) throw new Error("Capture server did not become ready.");
  run(["node_modules/tsx/dist/cli.mjs", "scripts/screenshots.ts"]);
} finally { server.kill(); }
