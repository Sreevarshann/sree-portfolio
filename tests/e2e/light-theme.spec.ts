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

test.describe("light theme: Arctic", () => {
  test("cool canvas, deep navy type and one confident blue", async ({ page }) => {
    await open(page, "/", "light");
    expect(await style(page, "body", "background-color")).toBe("rgb(247, 249, 252)");
    expect(await style(page, "h1", "color")).toBe("rgb(16, 29, 51)");
    expect(await style(page, ".hero-title .serif-accent", "color")).toBe("rgb(30, 79, 192)");
  });

  test("cards are white sheets with daylight shadows, not grey gradients", async ({ page }) => {
    await open(page, "/?view=detailed", "light");
    const bg = await style(page, "main .panel", "background-image");
    expect(bg).toContain("rgb(255, 255, 255)");
    expect(bg).not.toContain("rgb(238, 241, 245)"); // the old grey fade
    expect(bg).not.toContain("rgb(255, 254, 251)"); // the old warm porcelain
    expect(await style(page, "main .panel", "box-shadow")).toMatch(/rgba\(34, 58, 108, 0\.26\)/);
    expect(await style(page, ".gap-px.bg-line .bg-bg", "background-color")).toBe("rgb(255, 255, 255)");
  });

  test("the island is frosted daylight glass: cool, blurred, with a bright rim", async ({ page }) => {
    await open(page, "/", "light");
    expect(await style(page, "[data-island]", "background-color")).toBe("rgba(251, 252, 255, 0.62)");
    expect(await style(page, "[data-island]", "backdrop-filter")).toBe("blur(22px) saturate(1.7) brightness(1.06)");
    expect(await style(page, "[data-island]", "background-image", "::after")).toContain("rgb(255, 255, 255)");
    // The current-page marker is a raised white lens.
    await page.goto("/about");
    expect(await style(page, ".nav-indicator", "background-image")).toContain("rgb(255, 255, 255)");
  });

  test("accent words carry an electric dimension line in light only", async ({ page }) => {
    await open(page, "/", "light");
    expect(await style(page, ".hero-title .serif-accent", "background-image")).toContain("data:image/svg+xml");
    await open(page, "/", "dark");
    expect(await style(page, ".hero-title .serif-accent", "background-image")).toBe("none");
  });

  for (const width of [390, 1440, 2560]) {
    test(`the winter sun rises between the Zakim towers at ${width}px`, async ({ page }, info) => {
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
    expect(await style(page, "body", "background-color")).toBe("rgb(247, 249, 252)");
  });

  test("under reduced motion the theme changes instantly, with no reveal", async ({ page }, info) => {
    test.skip(info.project.name !== "desktop", "Pointer interaction; desktop covers it.");
    await open(page, "/", "light", "reduce");
    await page.getByRole("button", { name: "Switch to dark theme" }).click();
    expect(await page.evaluate(() => document.documentElement.dataset.theme)).toBe("dark");
    expect(await page.evaluate(() => document.documentElement.classList.contains("theme-vt"))).toBe(false);
  });

  test("no warm sunset colors anywhere in the light theme", async ({ page }, info) => {
    test.skip(info.project.name !== "desktop", "Same CSS on every device; desktop covers it.");
    test.setTimeout(120_000);
    const found: string[] = [];
    for (const path of ["/?view=detailed", "/about", "/contact", "/projects/aegis-ai", "/ask"]) {
      await open(page, path, "light");
      const hits = await page.evaluate(() => {
        // Orange, amber, peach or rust with any real opacity. Brand logos, chart
        // series and each project's small category marks keep their own hues.
        const warm = (v: string) =>
          [...v.matchAll(/rgba?\(([\d.]+),? ([\d.]+),? ([\d.]+)(?:,? \/? ?([\d.]+))?\)/g)].some(([, r, g, b, a]) => {
            const [R, G, B, A] = [+r, +g, +b, a === undefined ? 1 : +a];
            return A > 0.04 && R > 170 && R - B > 55 && G < R - 15 && G > B - 10;
          });
        const exempt = ".tech-logo, .js-plotly-plot, [class*='logo'], img, picture, .tech-chip-icon, .stage-dot, .signal-pulse";
        const props = ["color", "background-color", "background-image", "box-shadow", "border-top-color", "fill", "stroke", "-webkit-text-stroke-color"];
        const out: string[] = [];
        for (const el of document.querySelectorAll("body *")) {
          if (el.closest(exempt)) continue;
          for (const ps of [null, "::before", "::after"]) {
            const cs = getComputedStyle(el, ps);
            if ((ps && cs.content === "none") || cs.display === "none") continue;
            for (const p of props) if (warm(cs.getPropertyValue(p))) out.push(`${el.className}${ps ?? ""} ${p}`);
          }
        }
        return out.slice(0, 5);
      });
      found.push(...hits.map((h) => `${path}: ${h}`));
    }
    expect(found).toEqual([]);
  });

  test("the hero contours are drawn in cool ink", async ({ page }) => {
    await open(page, "/", "light");
    const v = await page.evaluate(() => ["--contour-ink", "--contour-warm"].map((n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim()));
    for (const rgb of v) {
      const [r, , b] = rgb.split(/\s+/).map(Number);
      expect(b).toBeGreaterThan(r); // blue-dominant, never sunset
    }
  });

  const ROUTES = ["/?view=quick", "/?view=detailed", "/about", "/experience", "/projects", "/projects/aegis-ai", "/achievements", "/education", "/certifications", "/lab", "/ask", "/contact"];
  test("no horizontal overflow in light at any width", async ({ page }, info) => {
    test.skip(info.project.name !== "desktop", "Widths set explicitly.");
    test.setTimeout(300_000);
    await page.emulateMedia({ colorScheme: "light", reducedMotion: "reduce" });
    const out: string[] = [];
    for (const width of [320, 375, 390, 430, 768, 1024, 1280, 1440, 1920, 2560]) {
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
