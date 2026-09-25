import { config } from "dotenv";
import { defineConfig } from "prisma/config";

// Next.js reads .env.local, but the Prisma CLI does not, so load it here.
// Values already present in the environment (CI, Vercel) take precedence.
config({ path: ".env.local", quiet: true });
config({ quiet: true });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // `prisma generate` does not need a database, so an empty fallback keeps
    // it working on a fresh clone before .env.local exists.
    url: process.env.DATABASE_URL ?? "",
  },
});
