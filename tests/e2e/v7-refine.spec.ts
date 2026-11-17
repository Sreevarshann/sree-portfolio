import { expect, test, type Page } from "@playwright/test";

const triggers = (page: Page) => page.evaluate(() => Number(document.documentElement.dataset.motionTriggers ?? -1));

const ORDER = ["Introduction", "Achievements", "Education and certifications", "Experience", "Tools and technologies", "Projects", "Contact"];

test.describe("homepage information architecture (V9)", () => {
  for (const v of ["quick", "detailed"] as const) {
    test(`exact section order in ${v} view, with no approach statement`, async ({ page }) => {
      await page.goto(`/?view=${v}`);
      const labels = await page.$$eval("main > section", (ss) => ss.filter((s) => getComputedStyle(s).display !== "none").map((s) => s.getAttribute("aria-label")));
      expect(labels).toEqual(ORDER);
      await expect(page.locator("footer").first()).toBeVisible();
      await expect(page.getByText("the data it reads", { exact: false })).toHaveCount(0);
      await expect(page.getByText(/my approach/i)).toHaveCount(0);
      expect(await page.locator('[data-nav-section="approach"], [data-nav-section="build"], [data-nav-section="lab"], [data-nav-section="ai"], [data-view-anchor="approach"]').count()).toBe(0);
    });
  }

  test("achievements start within the first scroll on desktop and phone", async ({ page }) => {
    for (const [w, h] of [[1440, 900], [390, 844]]) {
      await page.setViewportSize({ width: w, height: h });
      await page.goto("/?view=quick");
      const top = await page.locator('main > section[aria-label="Achievements"]').evaluate((el) => el.getBoundingClientRect().top + scrollY);
      const hero = await page.locator('main > section[aria-label="Introduction"]').evaluate((el) => el.getBoundingClientRect().bottom + scrollY);
      expect(Math.abs(top - hero), "achievements follow the hero directly").toBeLessThanOrEqual(1);
      const ach = page.locator('main > section[aria-label="Achievements"]');
      await expect(ach.getByText("6th place globally · of 320+ teams")).toBeVisible();
      await expect(ach.locator("p.eyebrow", { hasText: /^3rd place$/ })).toBeVisible();
      await expect(ach.getByRole("link", { name: "Singapore AUV Challenge", exact: true })).toHaveAttribute("href", "/achievements#sauvc");
      await expect(ach.getByRole("link", { name: "Google MLOps Expo", exact: true })).toHaveAttribute("href", "/achievements#google-mlops-expo");
      await expect(ach.getByRole("link", { name: /View all achievements/ })).toHaveAttribute("href", "/achievements");
    }
  });

  for (const [w, view, scheme] of [[1440, "quick", "light"], [1440, "detailed", "dark"], [1024, "detailed", "light"], [820, "quick", "dark"]] as const) {
    test(`achievement cards are one aligned pair at ${w}px (${view}, ${scheme})`, async ({ page }, info) => {
      test.skip(info.project.name !== "desktop", "Viewport set explicitly.");
      await page.emulateMedia({ colorScheme: scheme, reducedMotion: "reduce" });
      await page.setViewportSize({ width: w, height: 900 });
      await page.goto(`/?view=${view}`);
      await page.locator('main > section[aria-label="Achievements"]').scrollIntoViewIfNeeded();
      const r = await page.evaluate(() => {
        const cards = [...document.querySelectorAll<HTMLElement>(".ach-card")];
        const top = (c: HTMLElement, s: string) => { const e = c.querySelector<HTMLElement>(s); return e && e.offsetParent ? e.getBoundingClientRect().top : null; };
        const rows = ["ach-rank", "ach-viz", "ach-label", "ach-title", "ach-project", "ach-desc", "ach-actions"].map((k) => ({ k, a: top(cards[0], "." + k), b: top(cards[1], "." + k) }));
        const box = cards.map((c) => c.getBoundingClientRect());
        return { rows, heights: box.map((b) => b.height), sameRow: Math.abs(box[0].top - box[1].top) < 0.5, radius: cards.map((c) => getComputedStyle(c).borderRadius) };
      });
      expect(r.sameRow).toBe(true);
      expect(Math.abs(r.heights[0] - r.heights[1])).toBeLessThanOrEqual(0.5);
      for (const row of r.rows) if (row.a !== null) expect(Math.abs(row.a - row.b!), row.k).toBeLessThanOrEqual(0.5);
      expect(r.radius[0]).toBe(r.radius[1]);
      // Aligned without padding the pair out: no taller than the content needs.
      expect(Math.max(...r.heights)).toBeLessThan(view === "quick" ? 420 : 520);
    });
  }

  test("achievement cards stack compactly on phones", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/?view=quick");
    const hs = await page.locator(".ach-card").evaluateAll((els) => els.map((e) => e.getBoundingClientRect()));
    expect(hs[1].top).toBeGreaterThan(hs[0].bottom); // stacked
    for (const h of hs) expect(h.height).toBeLessThan(380);
  });

  test("project gallery links every case study and repository", async ({ page }) => {
    await page.goto("/?view=detailed");
    const g = page.locator('main > section[aria-label="Projects"] .v-detailed');
    const cases = await g.getByRole("link", { name: /^Case study/ }).evaluateAll((as) => as.map((a) => a.getAttribute("href")));
    const repos = await g.getByRole("link", { name: /^GitHub/ }).evaluateAll((as) => as.map((a) => a.getAttribute("href")));
    expect(cases).toHaveLength(6);
    for (const h of cases) expect(h).toMatch(/^\/projects\/[a-z-]+$/);
    for (const h of repos) expect(h).toMatch(/^https:\/\/github\.com\/Sreevarshann\//);
    await expect(page.locator('main > section[aria-label="Projects"]').getByRole("link", { name: /View all projects/ })).toHaveAttribute("href", "/projects");
    // A gallery, not a vertical stack: three cards share a row on desktop.
    await page.setViewportSize({ width: 1440, height: 900 });
    const tops = await g.locator("article.project-card").evaluateAll((els) => els.slice(0, 3).map((e) => Math.round(e.getBoundingClientRect().top)));
    expect(new Set(tops).size).toBe(1);
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
