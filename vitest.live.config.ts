import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

/** Live evaluation against a deployed site; see tests/live/ask-ai.live.test.ts. */
export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  test: { environment: "node", include: ["tests/live/**/*.test.ts"], testTimeout: 60_000, fileParallelism: false },
});
