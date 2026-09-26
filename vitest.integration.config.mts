import { mergeConfig, defineConfig } from "vitest/config";
import base from "./vitest.config.mts";

const config = mergeConfig(base, defineConfig({
  test: { include: ["tests/integration/**/*.test.ts"], fileParallelism: false, testTimeout: 20_000 },
}));
// mergeConfig concatenates arrays; this command should run only database tests.
config.test!.include = ["tests/integration/**/*.test.ts"];
export default config;
