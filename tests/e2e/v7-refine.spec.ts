import { expect, test, type Page } from "@playwright/test";

const approach = (page: Page) => page.locator('main > section[aria-label="Approach"]');
const triggers = (page: Page) => page.evaluate(() => Number(document.documentElement.dataset.motionTriggers ?? -1));

test.describe("Approach statement", () => {
  for (const v of ["quick", "detailed"] as const) {
    test(`compact and present in ${v} view`, async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto(`/?view=${v}`);
      const s = approach(page);
      await expect(s).toBeVisible();
      await expect(s.getByRole("heading", { level: 2 })).toHaveText(/An AI feature is only as good as\s+the data it reads\./);
      await expect(s.locator(".approach-hl")).toHaveText("the data it reads.");
      await expect(s.locator(".approach-label")).toHaveText(/my approach/i);
      await expect(s.locator(".approach-support")).toContainText("systems that work beyond the prototype");
      const m = await s.locator(".approach-statement").evaluate((el) => {
        const cs = getComputedStyle(el);
        return { lines: Math.round(el.getBoundingClientRect().height / parseFloat(cs.lineHeight)), size: parseFloat(cs.fontSize) };
      });
      expect(m.lines).toBeGreaterThanOrEqual(2);
      expect(m.lines).toBeLessThanOrEqual(3);
      expect(m.size).toBeLessThanOrEqual(48);
      // The section stays compact: well under one viewport tall.
      expect((await s.boundingBox())!.height).toBeLessThan(560);
    });
  }

  test("readable at phone width with no overflow, in both themes", async ({ page }) => {
    for (const scheme of ["light", "dark"] as const) {
      await page.emulateMedia({ colorScheme: scheme });
      await page.setViewportSize({ width: 320, height: 700 });
      await page.goto("/");
      const s = approach(page);
      await s.scrollIntoViewIfNeeded();
      const box = (await s.locator(".approach-statement").boundingBox())!;
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width).toBeLessThanOrEqual(320);
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
      // Text is fully opaque once in view (the entrance never leaves it hidden).
      await expect.poll(() => s.locator(".approach-hl").evaluate((el) => getComputedStyle(el).opacity)).toBe("1");
    }
  });

  test("final state without animation under reduced motion", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    const words = approach(page).locator(".approach-word");
    const states = await words.evaluateAll((els) => els.map((el) => [getComputedStyle(el).opacity, getComputedStyle(el).transform]));
    for (const [o, t] of states) {
      expect(o).toBe("1");
      expect(t).toBe("none");
    }
  });
});

test.describe("university logos on white plates", () => {
  for (const scheme of ["light", "dark"] as const) {
    test(`education page and homepage, ${scheme}`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: scheme });
      for (const width of [1440, 375]) {
        await page.setViewportSize({ width, height: 900 });
        for (const url of ["/education", "/?view=detailed"]) {
          await page.goto(url);
          const plates = page.locator(".logo-plate:visible");
          expect(await plates.count()).toBeGreaterThanOrEqual(2);
          // Logos load lazily: bring each into view first.
          for (const plate of await plates.all()) {
            await plate.scrollIntoViewIfNeeded();
            await expect.poll(() => plate.locator("img").evaluate((i: HTMLImageElement) => i.complete && i.naturalWidth > 0)).toBe(true);
          }
          const info = await plates.evaluateAll((els) =>
            els.map((el) => {
              const img = el.querySelector("img")!;
              const r = el.getBoundingClientRect();
              const ir = img.getBoundingClientRect();
              return {
                bg: getComputedStyle(el).backgroundColor,
                radius: parseFloat(getComputedStyle(el).borderTopLeftRadius),
                filter: getComputedStyle(img).filter,
                loaded: img.complete && img.naturalWidth > 0,
                ratioOk: Math.abs(ir.width / ir.height - img.naturalWidth / img.naturalHeight) < 0.08 || getComputedStyle(img).objectFit === "contain",
                inside: ir.left >= r.left - 0.5 && ir.right <= r.right + 0.5 && ir.top >= r.top - 0.5 && ir.bottom <= r.bottom + 0.5,
              };
            }),
          );
          for (const p of info) {
            expect(p.bg).toBe("rgb(255, 255, 255)");
            expect(p.radius).toBeGreaterThan(4);
            expect(p.filter).toBe("none"); // official colours, never recoloured
            expect(p.loaded).toBe(true);
            expect(p.ratioOk).toBe(true);
            expect(p.inside).toBe(true);
          }
        }
      }
    });
  }
});

test.describe("mobile hero order", () => {
  for (const width of [320, 375, 390, 430, 768]) {
    test(`portrait comes before the headline at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 860 });
      await page.goto("/");
      const portrait = (await page.locator(".hero-portrait").boundingBox())!;
      const h1 = (await page.locator("h1").boundingBox())!;
      expect(portrait.y + portrait.height).toBeLessThanOrEqual(h1.y + 1);
      // Centred, not wider than the viewport.
      expect(Math.abs(portrait.x + portrait.width / 2 - width / 2)).toBeLessThan(6);
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
      // Calls to action stay reachable and in order after the statement.
      const cta = page.locator("main section").first().getByRole("link").first();
      await expect(cta).toBeVisible();
      // One portrait and one h1 in the accessibility tree: nothing is duplicated.
      await expect(page.locator(".hero-portrait")).toHaveCount(1);
      await expect(page.locator("h1")).toHaveCount(1);
    });
  }

  test("desktop keeps text left and portrait right", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");
    const portrait = (await page.locator(".hero-portrait").boundingBox())!;
    const h1 = (await page.locator("h1").boundingBox())!;
    expect(portrait.x).toBeGreaterThan(h1.x + h1.width / 2);
    expect(Math.abs(portrait.y + portrait.height / 2 - (h1.y + 200))).toBeLessThan(400);
  });

  test("hero causes no layout shift while it loads and animates", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.addInitScript(() => {
      (window as unknown as { __cls: number }).__cls = 0;
      new PerformanceObserver((l) =>
        l.getEntries().forEach((e) => {
          const s = e as PerformanceEntry & { value: number; hadRecentInput: boolean };
          if (!s.hadRecentInput) (window as unknown as { __cls: number }).__cls += s.value;
        }),
      ).observe({ type: "layout-shift", buffered: true });
    });
    await page.goto("/");
    await page.waitForTimeout(3000);
    expect(await page.evaluate(() => (window as unknown as { __cls: number }).__cls)).toBeLessThan(0.02);
  });
});

test.describe("performance guards", () => {
  test("scroll triggers are built once, only for rendered elements, and rebuilt (not duplicated) on view switch", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/?view=quick");
    await expect.poll(() => triggers(page), { timeout: 8000 }).toBeGreaterThan(0);
    const quick = await triggers(page);
    const sw = page.getByRole("group", { name: "Portfolio view" });
    await sw.getByRole("button", { name: "Detailed View", exact: true }).click();
    // Detailed View renders more scroll-linked elements, so the set grows once rebuilt.
    await expect.poll(() => triggers(page)).toBeGreaterThan(quick);
    await page.waitForTimeout(300);
    const detailed = await triggers(page);
    for (let i = 0; i < 4; i++) {
      await sw.getByRole("button", { name: "Quick View", exact: true }).click();
      await sw.getByRole("button", { name: "Detailed View", exact: true }).click();
    }
    await page.waitForTimeout(400);
    expect(await triggers(page)).toBe(detailed);
    await sw.getByRole("button", { name: "Quick View", exact: true }).click();
    await expect.poll(() => triggers(page)).toBe(quick);
  });

  test("phone hero portrait has no parallax tween", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    await page.waitForTimeout(2500);
    await page.mouse.wheel(0, 400);
    await page.waitForTimeout(400);
    expect(await page.locator(".hero-portrait").evaluate((el) => (el as HTMLElement).style.transform)).toBe("");
  });

  test("triggers are cleaned up on navigation", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");
    await expect.poll(() => triggers(page), { timeout: 8000 }).toBeGreaterThan(0);
    await page.locator('a[href="/about"]').first().evaluate((a) => (a as HTMLAnchorElement).click());
    await expect(page).toHaveURL(/\/about/);
    // About has no scroll-linked elements, so no triggers remain.
    await expect.poll(() => page.evaluate(() => document.documentElement.dataset.motionTriggers ?? "none")).toBe("none");
  });

  test("looping decorations pause off screen and resume in view", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/?view=detailed");
    const echo = page.locator("svg:has(.echo-line)").last(); // the footer echo (the first sits in the hero)
    await expect.poll(() => echo.evaluate((el) => el.hasAttribute("data-offscreen"))).toBe(true);
    expect(await echo.locator(".echo-line").first().evaluate((el) => getComputedStyle(el).animationPlayState)).toBe("paused");
    await echo.scrollIntoViewIfNeeded();
    await expect.poll(() => echo.evaluate((el) => el.hasAttribute("data-offscreen"))).toBe(false);
    expect(await echo.locator(".echo-line").first().evaluate((el) => getComputedStyle(el).animationPlayState)).toBe("running");
  });

  test("the WebGL hero stops drawing once scrolled away", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");
    const hasCanvas = await page.locator("section canvas").count();
    test.skip(hasCanvas === 0, "WebGL unavailable in this browser");
    const frames = async () =>
      page.evaluate(
        () =>
          new Promise<number>((resolve) => {
            const c = document.querySelector("section canvas") as HTMLCanvasElement;
            const gl = c.getContext("webgl2")!;
            let n = 0;
            const orig = gl.drawArrays.bind(gl);
            gl.drawArrays = (...a: Parameters<typeof orig>) => {
              n++;
              return orig(...a);
            };
            setTimeout(() => {
              gl.drawArrays = orig;
              resolve(n);
            }, 1500);
          }),
      );
    expect(await frames()).toBeGreaterThan(0);
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(300);
    expect(await frames()).toBe(0);
  });

  test("Plotly never loads on the homepage", async ({ page }) => {
    const plotly: string[] = [];
    page.on("request", (r) => /plotly/i.test(r.url()) && plotly.push(r.url()));
    for (const v of ["quick", "detailed"]) {
      await page.goto(`/?view=${v}`);
      await page.evaluate(async () => {
        for (let y = 0; y < document.body.scrollHeight; y += 600) {
          window.scrollTo(0, y);
          await new Promise((r) => setTimeout(r, 30));
        }
      });
      await page.waitForTimeout(500);
    }
    expect(plotly).toEqual([]);
  });

  test("scrolling the whole homepage has no long tasks and no console errors", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
    page.on("pageerror", (e) => errors.push(e.message));
    await page.setViewportSize({ width: 1440, height: 900 });
    // Software WebGL in headless Chromium is not representative; skip it here.
    await page.addInitScript(() => Object.defineProperty(navigator, "connection", { value: { saveData: true }, configurable: true }));
    await page.goto("/?view=detailed", { waitUntil: "networkidle" });
    await page.waitForTimeout(2000);
    const long = await page.evaluate(async () => {
      const out: number[] = [];
      const po = new PerformanceObserver((l) => l.getEntries().forEach((e) => out.push(e.duration)));
      po.observe({ type: "longtask" });
      const H = document.documentElement.scrollHeight - innerHeight;
      for (let y = 0; y <= H; y += 60) {
        window.scrollTo(0, y);
        await new Promise(requestAnimationFrame);
      }
      await new Promise((r) => setTimeout(r, 300));
      po.disconnect();
      return out;
    });
    // Parallel CI load adds stray long tasks, so this guards against blocking
    // work (a forced-layout storm, a synchronous chart), not frame pacing;
    // frame pacing is measured separately (see the PR's performance notes).
    expect(Math.max(0, ...long), `long tasks: ${long.map(Math.round).join(", ")}`).toBeLessThan(400);
    expect(errors, errors.join("\n")).toEqual([]);
  });
});
