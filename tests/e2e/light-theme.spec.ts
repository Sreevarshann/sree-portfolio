import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

/**
 * Light theme ("Harbor Daylight") regression suite, plus a pinned sample of
 * dark-theme styles: the light redesign must never change the dark theme.
 */

const style = (page: Page, selector: string, prop: string, pseudo?: string) =>
  page.evaluate(
    ([s, p, ps]) => {
      const el = document.querySelector(s);
      return el ? getComputedStyle(el, ps || null).getPropertyValue(p) : null;
    },
    [selector, prop, pseudo ?? ""] as const,
  );

async function open(page: Page, path: string, scheme: "light" | "dark", reducedMotion: "reduce" | "no-preference" = "reduce") {
  await page.emulateMedia({ colorScheme: scheme, reducedMotion });
  await page.goto(path);
  await expect(page.locator("html")).toHaveAttribute("data-theme", scheme);
}

test.describe("dark theme is untouched", () => {
  test("pinned dark surfaces, glass, buttons and footer", async ({ page }, info) => {
    test.skip(info.project.name !== "desktop", "Same CSS on every device; desktop covers it.");
    await open(page, "/?view=quick", "dark");
    expect(await style(page, "body", "background-color")).toBe("rgb(8, 9, 12)");
    expect(await style(page, "body", "color")).toBe("rgb(238, 241, 246)");
    expect(await style(page, "main .panel", "background-image")).toBe("linear-gradient(rgb(13, 16, 22), rgb(17, 22, 32))");
    expect(await style(page, "[data-island]", "background-color")).toBe("rgba(22, 28, 40, 0.46)");
    expect(await style(page, "[data-island]", "backdrop-filter")).toBe("blur(18px) saturate(1.85) brightness(1.04)");
    expect(await style(page, ".btn-primary", "background-color")).toBe("rgb(238, 241, 246)");
    expect(await style(page, ".btn-primary", "color")).toBe("rgb(8, 9, 12)");
    expect(await style(page, ".hero-title .serif-accent", "background-image")).toBe("none");
    expect(await style(page, ".gap-px.bg-line .bg-bg", "background-color")).toBe("rgb(8, 9, 12)");
    expect(await style(page, ".rank-reveal", "color")).toBe("rgb(238, 241, 246)");
    expect(await style(page, ".pswap-print", "background-image")).toBe("linear-gradient(rgb(26, 31, 41), rgb(20, 24, 33))");
    expect(await style(page, ".footer-horizon", "background-image")).toBe("none");
    await expect(page.locator(".footer-sky")).toBeHidden();
  });
});

test.describe("light theme: Harbor Daylight", () => {
  test("porcelain paper, navy ink and harbor cobalt", async ({ page }) => {
    await open(page, "/", "light");
    expect(await style(page, "body", "background-color")).toBe("rgb(246, 244, 239)");
    expect(await style(page, "h1", "color")).toBe("rgb(13, 21, 38)");
    expect(await style(page, ".hero-title .serif-accent", "color")).toBe("rgb(26, 59, 184)");
  });

  test("cards are white sheets with daylight shadows, not grey gradients", async ({ page }) => {
    await open(page, "/?view=detailed", "light");
    const bg = await style(page, "main .panel", "background-image");
    expect(bg).toContain("rgb(255, 255, 255)");
    expect(bg).not.toContain("rgb(238, 241, 245)"); // the old grey fade
    expect(await style(page, "main .panel", "box-shadow")).toMatch(/rgba\(28, 44, 110, 0\.22\)/);
    expect(await style(page, ".gap-px.bg-line .bg-bg", "background-color")).toBe("rgb(255, 255, 255)");
  });

  test("the island is daylight glass: clear, blurred, with a bright rim", async ({ page }) => {
    await open(page, "/", "light");
    expect(await style(page, "[data-island]", "background-color")).toBe("rgba(255, 255, 255, 0.56)");
    expect(await style(page, "[data-island]", "backdrop-filter")).toBe("blur(20px) saturate(1.8) brightness(1.08)");
    expect(await style(page, "[data-island]", "background-image", "::after")).toContain("rgb(255, 255, 255)");
    // The current-page marker is a raised white lens.
    await page.goto("/about");
    expect(await style(page, ".nav-indicator", "background-image")).toContain("rgb(255, 255, 255)");
  });

  test("accent words carry an inked swash in light only", async ({ page }) => {
    await open(page, "/", "light");
    expect(await style(page, ".hero-title .serif-accent", "background-image")).toContain("data:image/svg+xml");
    await open(page, "/", "dark");
    expect(await style(page, ".hero-title .serif-accent", "background-image")).toBe("none");
  });

  for (const width of [390, 1440, 2560]) {
    test(`the dawn sun rises between the Zakim towers at ${width}px`, async ({ page }, info) => {
      test.skip(info.project.name !== "desktop", "Viewport set explicitly.");
      await page.setViewportSize({ width, height: 900 });
      await open(page, "/contact", "light");
      const sky = page.locator(".footer-sky");
      await sky.scrollIntoViewIfNeeded();
      await expect(sky).toBeVisible();
      const geo = await page.evaluate(() => {
        const svg = document.querySelector('footer svg[viewBox="0 0 1200 220"]')!;
        const r = svg.getBoundingClientRect();
        const cs = getComputedStyle(svg);
        const left = r.left + parseFloat(cs.paddingLeft);
        const scale = (r.width - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight)) / 1200;
        const sun = document.querySelector(".footer-sun")!.getBoundingClientRect();
        const skyBox = document.querySelector(".footer-sky")!.getBoundingClientRect();
        return { t1: left + 960 * scale, t2: left + 1110 * scale, sun: sun.left + sun.width / 2, water: r.top + 196 * scale, skyBottom: skyBox.bottom };
      });
      expect(geo.sun).toBeGreaterThan(geo.t1);
      expect(geo.sun).toBeLessThan(geo.t2);
      // The sky ends at the drawing's water line, so the horizon cuts the sun.
      expect(Math.abs(geo.skyBottom - geo.water)).toBeLessThan(2.5);
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    });
  }

  test("switching theme reveals the new theme from the toggle, then settles", async ({ page }, info) => {
    test.skip(info.project.name !== "desktop", "Pointer interaction; desktop covers it.");
    await open(page, "/", "dark", "no-preference");
    await page.getByRole("button", { name: "Switch to light theme" }).click();
    await expect.poll(() => page.evaluate(() => document.documentElement.classList.contains("theme-vt")), { timeout: 2000 }).toBe(true);
    await expect.poll(() => page.evaluate(() => document.documentElement.dataset.theme)).toBe("light");
    await expect.poll(() => page.evaluate(() => document.documentElement.classList.contains("theme-vt")), { timeout: 4000 }).toBe(false);
    expect(await page.evaluate(() => localStorage.getItem("theme"))).toBe("light");
    expect(await style(page, "body", "background-color")).toBe("rgb(246, 244, 239)");
  });

  test("under reduced motion the theme changes instantly, with no reveal", async ({ page }, info) => {
    test.skip(info.project.name !== "desktop", "Pointer interaction; desktop covers it.");
    await open(page, "/", "light", "reduce");
    await page.getByRole("button", { name: "Switch to dark theme" }).click();
    expect(await page.evaluate(() => document.documentElement.dataset.theme)).toBe("dark");
    expect(await page.evaluate(() => document.documentElement.classList.contains("theme-vt"))).toBe(false);
  });

  const ROUTES = ["/?view=quick", "/?view=detailed", "/about", "/experience", "/projects", "/projects/aegis-ai", "/achievements", "/education", "/certifications", "/lab", "/ask", "/contact"];
  test("no horizontal overflow in light at any width", async ({ page }, info) => {
    test.skip(info.project.name !== "desktop", "Widths set explicitly.");
    test.setTimeout(150_000);
    await page.emulateMedia({ colorScheme: "light", reducedMotion: "reduce" });
    const out: string[] = [];
    for (const width of [320, 390, 768, 1280, 2560]) {
      await page.setViewportSize({ width, height: 900 });
      for (const r of ROUTES) {
        await page.goto(r);
        const sw = await page.evaluate(() => document.documentElement.scrollWidth);
        if (sw > width + 1) out.push(`${r} @${width}: ${sw}`);
      }
    }
    expect(out).toEqual([]);
  });

  for (const path of ["/about", "/achievements", "/education", "/certifications", "/projects/aegis-ai", "/does-not-exist"]) {
    test(`${path} in light has no serious accessibility violations`, async ({ page }) => {
      await open(page, path, "light");
      await page.waitForTimeout(300);
      const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
      const serious = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
      expect(serious.map((v) => `${v.id}: ${v.nodes.slice(0, 3).map((n) => n.target.join(" ")).join(" | ")}`)).toEqual([]);
    });
  }
});
