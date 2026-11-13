import { defineConfig, devices } from "@playwright/test";

const PORT = Number(process.env.E2E_PORT ?? 3219);
const baseURL = process.env.E2E_BASE_URL ?? `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "tests/e2e",
  timeout: 45_000,
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["list"]] : "list",
  // The one-time onboarding coach mark is marked as seen so it never overlaps
  // other tests; tests/e2e/v7.spec.ts opts back in with an empty storage state.
  use: { baseURL, trace: "retain-on-failure", storageState: { cookies: [], origins: [{ origin: new URL(baseURL).origin, localStorage: [{ name: "sree:coach:view", value: "done" }] }] } },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
    // Safari engine smoke tests (theme, navigation, assistant, images).
    { name: "webkit", use: { ...devices["Desktop Safari"], viewport: { width: 1280, height: 800 } }, testMatch: /v2\.spec\.ts/ },
  ],
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        // Production build, no model key: exercises the honest fallback path.
        command: `npx next start -p ${PORT}`,
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
        env: { ANTHROPIC_API_KEY: "", GROQ_API_KEY: "", ASK_SREE_PROVIDER: "" },
      },
});
