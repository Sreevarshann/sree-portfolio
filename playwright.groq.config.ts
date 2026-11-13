import { defineConfig, devices } from "@playwright/test";

/**
 * End-to-end tests for the Groq provider: the production build talks to a
 * local Groq-compatible stand-in (tests/e2e-groq/groq-stand-in.mjs) through
 * ASK_SREE_API_BASE_URL. No real key is used or needed.
 */
const PORT = Number(process.env.E2E_GROQ_PORT ?? 3229);
const STAND_IN = 4610;

export default defineConfig({
  testDir: "tests/e2e-groq",
  timeout: 45_000,
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["list"]] : "list",
  use: { baseURL: `http://localhost:${PORT}`, trace: "retain-on-failure" },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
  webServer: [
    {
      command: `node tests/e2e-groq/groq-stand-in.mjs`,
      url: `http://127.0.0.1:${STAND_IN}/__last`,
      reuseExistingServer: false,
      env: { GROQ_STAND_IN_PORT: String(STAND_IN) },
    },
    {
      command: `npx next start -p ${PORT}`,
      url: `http://localhost:${PORT}`,
      reuseExistingServer: false,
      timeout: 120_000,
      env: {
        ASK_SREE_PROVIDER: "groq",
        GROQ_API_KEY: "e2e-stand-in-key",
        ASK_SREE_API_BASE_URL: `http://127.0.0.1:${STAND_IN}/openai/v1`,
        ANTHROPIC_API_KEY: "",
        // Generous limits: every test here is one visitor on localhost.
        ASK_SREE_RATE_PER_MINUTE: "100",
        ASK_SREE_RATE_PER_DAY: "1000",
      },
    },
  ],
});
