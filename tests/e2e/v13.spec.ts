import { expect, test, type Page } from "@playwright/test";

/**
 * The identity reveal. "Hey, I'm Spiderman." with the masked photo holds for
 * 1.5 seconds (V14), then the middle letters fracture and rebuild into
 * "Sreevarshan." while the photo dissolves to the real one on the same clock,
 * finishing about 2.4 seconds after the page first paints.
 */

/** The word as drawn: the generated letters of every glyph slot that is laid out. */
const visibleWord = (page: Page) =>
  page.evaluate(() =>
    Array.from(document.querySelectorAll<HTMLElement>(".hf-word [data-c]"))
      .filter((e) => e.getClientRects().length > 0)
      .map((e) => e.dataset.c)
      .join(""),
  );
const mark = (page: Page, name: string) => page.evaluate((n) => performance.getEntriesByName(n)[0]?.startTime ?? null, name);
const illustratedOpacity = (page: Page) => page.locator(".pswap-illustrated").first().evaluate((e) => parseFloat(getComputedStyle(e).opacity));

test.describe("identity reveal", () => {
  test("holds Spiderman with the masked photo, then both transform together on one clock", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    // Record every frame in the page itself, so slow test machines cannot skew what we observe.
    await page.addInitScript(() => {
      const log: Record<string, unknown>[] = [];
      (window as unknown as { __introLog: typeof log }).__introLog = log;
      // Rows are stamped with the frame time, the same timestamp the intro's clock uses.
      const tick = (now: number) => {
        const fig = document.querySelector(".pswap");
        const word = Array.from(document.querySelectorAll<HTMLElement>(".hf-word [data-c]"))
          .filter((e) => e.getClientRects().length > 0)
          .map((e) => e.dataset.c)
          .join("");
        if (fig && word) {
          const root = document.querySelector<HTMLElement>("[data-nav-section='about']")!;
          const ill = document.querySelector(".pswap-illustrated")!;
          const vis = (s: string) => document.querySelector(s)!.getClientRects().length > 0 && getComputedStyle(document.querySelector(s)!).opacity === "1";
          const c = document.querySelector(".hf-canvas")?.getBoundingClientRect();
          const h = document.querySelector(".hero-id")!.getBoundingClientRect();
          log.push({
            t: now,
            word,
            intro: fig.getAttribute("data-intro"),
            photo: root.style.getPropertyValue("--intro-photo"),
            ill: parseFloat(getComputedStyle(ill).opacity),
            canvas: !!c,
            canvasInside: !c || (c.left >= 0 && c.right <= innerWidth && c.top >= h.top - 120 && c.bottom <= h.bottom + 120),
            sAn: vis(".hf-s") && vis(".hf-an"),
          });
        }
        if (log.length < 2000) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
    await page.goto("/");
    await expect(page.locator(".pswap").first()).toHaveAttribute("data-intro", "done", { timeout: 20_000 });
    await page.waitForTimeout(1500);
    const [hold, morph, final, clock] = [await mark(page, "identity-hold"), await mark(page, "identity-morph"), await mark(page, "identity-final"), await mark(page, "identity-clock")];
    type Row = { t: number; word: string; intro: string; photo: string; ill: number; canvas: boolean; canvasInside: boolean; sAn: boolean };
    const log = (await page.evaluate(() => (window as unknown as { __introLog: unknown[] }).__introLog)) as Row[];

    // Timing: a 1.5 s hold from first paint, then 0.9 s for both transformations.
    expect(morph! - hold!).toBeGreaterThanOrEqual(1490);
    expect(morph! - hold!).toBeLessThan(2100);
    expect(final! - clock!).toBeGreaterThanOrEqual(890);
    // Time-based: a slow machine paints fewer frames but still finishes on time
    // (the upper bounds allow for a slow setup frame on CI's software renderer).
    expect(final! - morph!).toBeLessThan(1700);
    expect(final! - hold!).toBeLessThan(3000);

    // Before: Spiderman and the fully masked photo, nothing dissolving, no particles.
    // Rows are classified by the portrait's own state, not by timestamps: on a
    // slow renderer a frame can be stamped before the morph and read after it.
    // (The first morph frame can still read "pending" before React re-renders,
    // but its canvas is already drawing; the hold is pending with no canvas.)
    const before = log.filter((r) => r.t > hold! && r.intro === "pending" && !r.canvas);
    expect(before.length).toBeGreaterThan(0);
    for (const r of before) {
      expect(r.word).toBe("Spiderman.");
      expect(r.photo).toBe("");
      expect(r.ill).toBe(1);
      expect(r.canvas).toBe(false);
    }
    // During: particles confined to the heading, S and "an" always drawn, and the
    // photo progress tracking the same clock as the letters (one shared timeline).
    // Every recorded frame is checked; CI's software renderer may paint only a few.
    const during = log.filter((r) => r.canvas && r.t > clock! + 20);
    expect(during.length).toBeGreaterThan(0);
    const ease = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
    let last = -1;
    let prevT = clock!;
    for (const r of during) {
      expect(r.canvas).toBe(true);
      expect(r.canvasInside).toBe(true);
      expect(r.sAn, "S and an stay visible").toBe(true);
      const photo = parseFloat(r.photo);
      expect(photo).toBeGreaterThanOrEqual(last);
      last = photo;
      // The photo is exactly where the shared clock puts it: this frame's value,
      // or the previous frame's if the recorder ran before the clock this frame.
      const lo = ease(Math.min(1, Math.max(0, (prevT - clock!) / 900)));
      const hi = ease(Math.min(1, (r.t - clock!) / 900));
      expect(photo).toBeGreaterThanOrEqual(lo - 0.02);
      expect(photo).toBeLessThanOrEqual(hi + 0.02);
      prevT = r.t;
    }
    if (during.length >= 10) expect(during.some((r) => parseFloat(r.photo) > 0.3 && parseFloat(r.photo) < 0.7)).toBe(true);
    // After: Sreevarshan and the real photo, no particles left.
    const after = log.filter((r) => r.t > final! + 900);
    expect(after.length).toBeGreaterThan(5);
    for (const r of after) {
      expect(r.word).toBe("Sreevarshan.");
      expect(r.canvas).toBe(false);
      expect(r.ill).toBe(0);
    }
    // Never both names, never a flash back to Spider-Man after the reveal.
    expect(log.filter((r) => r.t > final!).every((r) => r.word === "Sreevarshan.")).toBe(true);
    expect(log.filter((r) => r.t > final!).every((r) => r.ill <= log.find((x) => x.t > final!)!.ill)).toBe(true);

    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Hey, I'm Sreevarshan Sathiyamurthy.");
    await expect(page.locator(".hero-nick")).toHaveText("Most people call me Sree.");
    await expect(page.locator(".hero-title")).toContainText("I build intelligent systems, from data to interface.");
    await expect(page.locator("main").getByText(/Boston-based engineer building AI agents/)).toHaveCount(0);
    expect(errors).toEqual([]);
  });

  test("plays once: unrelated re-renders and theme switches never replay it", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator(".pswap").first()).toHaveAttribute("data-intro", "done", { timeout: 15_000 });
    const toggle = page.locator("[data-island] [aria-label^='Switch to']");
    await toggle.click();
    await toggle.click();
    await page.waitForTimeout(3200);
    expect(await page.evaluate(() => performance.getEntriesByName("identity-morph").length)).toBe(1);
    await expect(page.locator(".hf-canvas")).toHaveCount(0);
    expect(await visibleWord(page)).toBe("Sreevarshan.");
  });

  test("activating the portrait during the hold skips straight to the end", async ({ page }) => {
    await page.goto("/");
    await expect.poll(() => mark(page, "identity-hold"), { timeout: 15_000 }).not.toBeNull();
    await page.locator(".pswap-hit").first().click();
    await expect(page.locator(".pswap").first()).toHaveAttribute("data-intro", "done");
    expect(await visibleWord(page)).toBe("Sreevarshan.");
  });

  test("reduced motion: the final name and real photo at once, no particles", async ({ browser }) => {
    const ctx = await browser.newContext({ reducedMotion: "reduce" });
    const page = await ctx.newPage();
    await page.goto("/");
    expect(await visibleWord(page)).toBe("Sreevarshan.");
    expect(await illustratedOpacity(page)).toBe(0);
    await expect(page.locator(".pswap").first()).toHaveAttribute("data-intro", "done");
    await page.waitForTimeout(2600);
    await expect(page.locator(".hf-canvas")).toHaveCount(0);
    expect(await page.evaluate(() => performance.getEntriesByName("identity-morph").length)).toBe(0);
    await ctx.close();
  });

  test("without JavaScript the final name and real photo show", async ({ browser }) => {
    const ctx = await browser.newContext({ javaScriptEnabled: false });
    const page = await ctx.newPage();
    await page.goto("/");
    expect(await visibleWord(page)).toBe("Sreevarshan.");
    expect(await illustratedOpacity(page)).toBe(0);
    await ctx.close();
  });
});

test.describe("identity reveal layout", () => {
  for (const [width, height] of [[1024, 900], [1280, 800], [1440, 900], [1728, 1117], [1920, 1080], [2560, 1440]]) {
    test(`${width}px: name and statement left, full-size portrait right, centred on each other; actions and facts below`, async ({ page }, info) => {
      test.skip(info.project.name !== "desktop", "Desktop widths.");
      await page.setViewportSize({ width, height });
      await page.goto("/");
      // Measure the settled layout, after the entrance animations, the intro and the statement.
      await expect(page.locator(".pswap").first()).toHaveAttribute("data-intro", "done", { timeout: 15_000 });
      await page.waitForTimeout(1200);
      const g = await page.evaluate(() => {
        const r = (s: string) => document.querySelector(s)!.getBoundingClientRect();
        const word = r(".hf-word");
        const intro = r(".hero-intro");
        const photo = r(".pswap-photo");
        const stage = r(".hero-stage");
        const launcher = document.querySelector(".ask-launcher")?.getBoundingClientRect();
        const logos = Array.from(document.querySelectorAll(".hero-logo")).map((e) => e.getBoundingClientRect());
        return {
          wordRight: word.right,
          statementRight: r(".hero-statement").right,
          groupMid: (r(".hero-hey").top + r(".hero-statement").bottom) / 2,
          introPad: parseFloat(getComputedStyle(document.querySelector(".hero-intro")!).paddingBottom),
          introMid: (intro.top + intro.bottom) / 2,
          photoLeft: r(".pswap-print").left,
          photoMid: (photo.top + photo.bottom) / 2,
          printW: (document.querySelector(".pswap-print") as HTMLElement).offsetWidth,
          vw: innerWidth,
          ctaBottom: r(".hero-actions").bottom,
          ctaMid: (r(".hero-actions").left + r(".hero-actions").right) / 2,
          box: (stage.left + stage.right) / 2,
          metaBottom: r(".hero-meta").bottom,
          overflow: document.documentElement.scrollWidth - innerWidth,
          statementInLeftColumn: !!document.querySelector(".hero-intro .hero-statement"),
          logoUnderLauncher: !!launcher && logos.some((l) => l.right > launcher.left && l.left < launcher.right && l.bottom > launcher.top && l.top < launcher.bottom),
        };
      });
      expect(g.wordRight).toBeLessThan(g.photoLeft);
      expect(g.statementRight).toBeLessThan(g.photoLeft);
      expect(g.statementInLeftColumn).toBe(true);
      // The name, nickname and statement form one group centred on the photograph.
      expect(Math.abs(g.groupMid - g.photoMid)).toBeLessThanOrEqual(24);
      // The original portrait column: clamp(250px, 24vw, 350px).
      expect(g.printW).toBe(Math.round(Math.min(350, Math.max(250, g.vw * 0.24))));
      expect(Math.abs(g.ctaMid - g.box)).toBeLessThanOrEqual(2);
      // Identity, statement, actions and the information strip in the first view.
      expect(g.ctaBottom).toBeLessThanOrEqual(height);
      expect(g.metaBottom).toBeLessThanOrEqual(height);
      expect(g.logoUnderLauncher).toBe(false);
      expect(g.overflow).toBeLessThanOrEqual(0);
    });
  }
});
