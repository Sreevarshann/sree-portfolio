import { expect, test } from "@playwright/test";
import { projects } from "../../src/content/projects";

const CASE_STUDIES = projects.map((p) => `/projects/${p.slug}`);
const ROUTES = ["/", "/about", "/experience", "/projects", ...CASE_STUDIES, "/achievements", "/education", "/certifications", "/lab", "/contact", "/ask"];

test.describe("no console errors or hydration warnings", () => {
  for (const path of ROUTES) {
    test(path, async ({ page }) => {
      const problems: string[] = [];
      page.on("pageerror", (e) => problems.push(`pageerror: ${e.message}`));
      page.on("console", (m) => {
        const t = m.text();
        if (m.type() === "error" || /hydrat|did not match|server rendered/i.test(t)) problems.push(`${m.type()}: ${t}`);
      });
      const res = await page.goto(path, { waitUntil: "networkidle" });
      expect(res?.status()).toBe(200);
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2));
      await page.waitForTimeout(400);
      expect(problems, problems.join("\n")).toEqual([]);
    });
  }
});

test("every case study links to its own GitHub repository", async ({ page }) => {
  for (const p of projects) {
    expect(p.repoUrl).toMatch(/^https:\/\/github\.com\/Sreevarshann\/[\w.-]+$/);
    await page.goto(`/projects/${p.slug}`);
    await expect(page.locator(`a[href="${p.repoUrl}"]`).first()).toBeVisible();
  }
});

test("GitHub repository links resolve", async ({ request }) => {
  test.skip(!!process.env.CI, "Live network check runs locally; CI checks the URL format above.");
  for (const p of projects) {
    let status = 0;
    for (let attempt = 0; attempt < 3 && status !== 200; attempt++) {
      try {
        status = (await request.get(p.repoUrl, { maxRedirects: 2 })).status();
      } catch {
        status = -1; // connection reset: retry
      }
    }
    expect(status, p.repoUrl).toBe(200);
  }
});

test("project stages show each project's documented data path", async ({ page, isMobile }) => {
  test.skip(isMobile, "Covered once on desktop.");
  await page.goto("/projects");
  const first = projects[0];
  const path = first.architecture.nodes.filter((n) => n.row === 0).sort((a, b) => a.col - b.col).slice(0, 5).map((n) => n.label);
  await expect(page.getByRole("img", { name: `Main data path: ${path.join(" to ")}` })).toBeVisible();
});

test("SAUVC rank counts down to 6th and the funnel keeps the real numbers", async ({ page }) => {
  await page.goto("/achievements");
  const rank = page.locator(".rank-counter");
  await rank.scrollIntoViewIfNeeded();
  await expect(rank).toContainText("6", { timeout: 5000 });
  await page.waitForTimeout(2200);
  await expect(rank.locator("span[aria-hidden]").first()).toHaveText("6");
  await expect(rank.locator(".sr-only")).toHaveText("6th place");
  const funnel = page.locator("dl.funnel");
  for (const v of ["320+", "130+", "20", "6th"]) await expect(funnel.getByText(v, { exact: true })).toBeVisible();
});

test("Lab charts render and respond to controls", async ({ page }) => {
  await page.goto("/lab");
  const card = page.locator("section#tunelab");
  await card.scrollIntoViewIfNeeded();
  await expect(card.locator(".js-plotly-plot .main-svg").first()).toBeVisible({ timeout: 20_000 });
  const radios = card.getByRole("radio");
  await radios.nth(1).click();
  await expect(radios.nth(1)).toHaveAttribute("aria-checked", "true");
  await expect(card.locator(".js-plotly-plot .main-svg").first()).toBeVisible();
});

test.describe("responsive: no horizontal overflow", () => {
  test.skip(({ isMobile }) => isMobile, "Desktop project drives explicit widths.");
  for (const width of [320, 375, 390, 430, 768, 1024, 1280, 1440, 1920, 2560]) {
    test(`${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      for (const path of ["/", "/projects", "/achievements", "/education", "/lab", "/about"]) {
        await page.goto(path);
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        await page.waitForTimeout(150);
        const over = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
        expect(over, `${path} at ${width}px`).toBeLessThanOrEqual(1);
      }
    });
  }
});
