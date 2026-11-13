import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const PAGES = ["/", "/about", "/experience", "/projects", "/projects/aegis-ai", "/achievements", "/education", "/certifications", "/lab", "/contact", "/ask"];
const PHONE = /(?<![\d\w-])\+?1?[\s.-]?\(?\d{3}\)?[\s.-]\d{3}[\s.-]\d{4}(?![\d\w])/;

test.describe("pages", () => {
  for (const path of PAGES) {
    test(`${path} renders, has one h1 and no horizontal overflow`, async ({ page }) => {
      const errors: string[] = [];
      page.on("pageerror", (e) => errors.push(e.message));
      page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
      const res = await page.goto(path);
      expect(res?.status()).toBe(200);
      await expect(page.locator("h1:visible")).toHaveCount(1);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow).toBeLessThanOrEqual(1);
      expect(errors, errors.join("\n")).toEqual([]);
    });
  }
});

test("no phone number appears anywhere in rendered pages", async ({ page }) => {
  for (const path of PAGES) {
    await page.goto(path);
    const html = await page.content();
    const text = await page.locator("body").innerText();
    expect(PHONE.test(text), `phone-like text on ${path}`).toBe(false);
    expect(html).not.toContain("tel:");
  }
});

test("security headers are set", async ({ request }) => {
  const res = await request.get("/");
  const h = res.headers();
  expect(h["content-security-policy"]).toContain("frame-ancestors 'none'");
  expect(h["x-content-type-options"]).toBe("nosniff");
  expect(h["referrer-policy"]).toBeTruthy();
  expect(h["x-powered-by"]).toBeUndefined();
});

test("theme toggle switches, persists and applies before paint", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await page.goto("/");
  const html = page.locator("html");
  await expect(html).toHaveAttribute("data-theme", "dark");
  await page.getByRole("button", { name: /Switch to light theme/ }).click();
  await expect(html).toHaveAttribute("data-theme", "light");
  await expect.poll(() => page.evaluate(() => getComputedStyle(document.body).backgroundColor)).toBe("rgb(245, 246, 248)");
  // Reload: the inline script must set the stored theme before hydration.
  await page.reload();
  await expect(html).toHaveAttribute("data-theme", "light");
});

test("follows the system theme when nothing is stored", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "light" });
  await page.goto("/about");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
});

test("project filters work and keep a shareable URL", async ({ page }) => {
  await page.goto("/projects");
  const articles = page.locator("main article");
  await expect(articles).toHaveCount(7);
  await page.getByRole("button", { name: /^Data Engineering/ }).click();
  await expect(page).toHaveURL(/category=Data\+Engineering|category=Data%20Engineering/);
  await expect(articles).toHaveCount(3);
  await page.getByRole("button", { name: /^All/ }).click();
  await expect(articles).toHaveCount(7);
});

test("case study has every required section and a working repo link", async ({ page }) => {
  await page.goto("/projects/sourceatlas");
  for (const s of ["Problem", "Product overview", "System architecture", "Core technologies", "Engineering challenges", "Technical decisions", "Verified test results", "Screenshots", "Links"]) {
    await expect(page.getByRole("heading", { name: new RegExp(s) })).toBeVisible();
  }
  await expect(page.getByRole("link", { name: /View repository on GitHub/ })).toHaveAttribute("href", "https://github.com/Sreevarshann/sourceatlas-agentic-rag");
  await expect(page.getByRole("img", { name: /SourceAtlas architecture/ })).toBeVisible();
});

test("unknown routes return the 404 page", async ({ page }) => {
  const res = await page.goto("/projects/does-not-exist");
  expect(res?.status()).toBe(404);
  await expect(page.getByText(/Nothing at these/)).toBeVisible();
});

test("resume PDF is served and is the sanitized copy", async ({ request }) => {
  const res = await request.get("/Sreevarshan-Sathiyamurthy-Resume.pdf");
  expect(res.status()).toBe(200);
  expect(res.headers()["content-type"]).toContain("pdf");
  const body = (await res.body()).toString("latin1");
  expect(body).not.toContain("tel:");
});

test("internal links resolve", async ({ page, request }) => {
  const seen = new Set<string>();
  for (const path of PAGES) {
    await page.goto(path);
    const hrefs = await page.$$eval("a[href^='/']", (as) => as.map((a) => a.getAttribute("href")!.split("#")[0]));
    hrefs.forEach((h) => h && seen.add(h));
  }
  for (const h of seen) {
    const res = await request.get(h);
    expect(res.status(), h).toBe(200);
  }
});

test.describe("accessibility (axe)", () => {
  for (const path of ["/", "/projects", "/projects/tunelab", "/experience", "/lab", "/contact", "/ask"]) {
    for (const scheme of ["dark", "light"] as const) {
      test(`${path} in ${scheme} has no serious violations`, async ({ page }) => {
        await page.emulateMedia({ colorScheme: scheme, reducedMotion: "reduce" });
        await page.goto(path);
        await page.waitForTimeout(400);
        const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
        const serious = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
        expect(serious.map((v) => `${v.id}: ${v.nodes.slice(0, 3).map((n) => n.target.join(" ")).join(" | ")}`)).toEqual([]);
      });
    }
  }
});
