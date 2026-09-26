import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    // Resolves the "@/..." imports from tsconfig.json.
    tsconfigPaths: true,
    alias: {
      // `server-only` throws outside a React Server Component bundle; in tests it is a no-op.
      "server-only": fileURLToPath(new URL("./tests/support/empty-module.ts", import.meta.url)),
    },
  },
  oxc: {
    jsx: { runtime: "automatic" },
  },
  test: {
    include: ["tests/unit/**/*.test.{ts,tsx}"],
    environment: "node",
    setupFiles: ["./tests/support/setup.ts"],
    restoreMocks: true,
  },
});
