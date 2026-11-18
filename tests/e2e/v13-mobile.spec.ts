import { expect, test, type Page } from "@playwright/test";

/**
 * V13 mobile hotfix: the page opens at the top, the portrait and the whole
 * centred name share the first screen, the floating logo-only launcher is the
 * one Ask My AI entry point, and no hint covers the portrait on phones.
 */

const PHONES = [
  [320, 568],
  [375, 667],
  [390, 664],
  [393, 659],
  [402, 678],
  [430, 739],
] as const;

const visibleWord = (page: Page) =>
  page.evaluate(() =>
    Array.from(document.querySelectorAll<HTMLElement>(".hf-word [data-c]"))
      .filter((e) => e.getClientRects().length > 0)
      .map((e) => e.dataset.c)
      .join(""),
  );

async function geometry(page: Page) {
  return page.evaluate(() => {
    const r = (s: string) => document.querySelector(s)!.getBoundingClientRect();
    const text = (s: string) => {
      const range = document.createRange();
      range.selectNodeContents(document.querySelector(s)!);
      return range.getBoundingClientRect();
    };
    const word = r(".hf-word");
    const print = r(".pswap-print");
    const hey = text(".hero-hey");
    const nick = text(".hero-nick");
    const l = r("button.ask-launcher");
    const mid = (b: DOMRect) => (b.left + b.right) / 2 - innerWidth / 2;
    const clear = (b: DOMRect) => l.top >= b.bottom || l.left >= b.right || l.bottom <= b.top || l.right <= b.left;
    return {
      vw: innerWidth,
      vh: innerHeight,
      overflow: document.documentElement.scrollWidth - innerWidth,
      word: { left: word.left, right: word.right, top: word.top, bottom: word.bottom },
      printBottom: print.bottom,
      heyTop: hey.top,
      centres: [mid(print), mid(hey), mid(word), mid(nick)],
      launcherClear: clear(word) && clear(nick) && clear(hey),
    };
  });
}

test.describe("mobile hero", () => {
  test.beforeEach(({}, info) => test.skip(info.project.name !== "mobile", "Phones."));

  for (const [width, height] of PHONES) {
    test(`${width}x${height}: photo, then the whole centred name, in the first screen`, async ({ page }) => {
      await page.setViewportSize({ width, height });
      await page.goto("/");
      for (const expected of ["Spiderman.", "Sreevarshan."]) {
        if (expected === "Sreevarshan.") await expect(page.locator(".pswap").first()).toHaveAttribute("data-intro", "done", { timeout: 15_000 });
        else await page.waitForTimeout(700);
        expect(await visibleWord(page)).toBe(expected);
        const g = await geometry(page);
        expect(g.overflow).toBeLessThanOrEqual(0);
        // Directly below the photo, never clipped, inside the first screen.
        expect(g.heyTop).toBeGreaterThan(g.printBottom);
        expect(g.word.left).toBeGreaterThanOrEqual(0);
        expect(g.word.right).toBeLessThanOrEqual(g.vw);
        expect(g.word.bottom).toBeLessThanOrEqual(g.vh);
        // Photo, "Hey, I'm", the name and the nickname share one centre line.
        for (const c of g.centres) expect(Math.abs(c)).toBeLessThanOrEqual(2);
        // The floating launcher never covers the introduction.
        expect(g.launcherClear).toBe(true);
      }
    });
  }

  test("no layout shift of the name during the reveal; the photo frame does not move", async ({ page }) => {
    await page.setViewportSize({ width: 393, height: 659 });
    await page.goto("/");
    await page.waitForTimeout(700);
    const before = await geometry(page);
    await expect(page.locator(".pswap").first()).toHaveAttribute("data-intro", "done", { timeout: 15_000 });
    const after = await geometry(page);
    expect(Math.abs(after.word.top - before.word.top)).toBeLessThanOrEqual(1);
    expect(Math.abs(after.printBottom - before.printBottom)).toBeLessThanOrEqual(1);
  });

  test("no Quick/Detailed hint or view switch (V14: one homepage)", async ({ page }) => {
    await page.goto("/");
    await page.waitForTimeout(4500);
    await expect(page.locator(".coach")).toHaveCount(0);
    await expect(page.getByRole("group", { name: "Portfolio view" })).toHaveCount(0);
  });
});

test.describe("one Ask My AI entry point", () => {
  test("not in the navigation or the hero; the floating launcher opens the chat", async ({ page }, info) => {
    await page.goto("/");
    await expect(page.locator("header").getByRole("button", { name: /Ask My AI/ })).toHaveCount(0);
    await expect(page.locator(".hero-actions").getByRole("button", { name: /Ask My AI/ })).toHaveCount(0);
    await expect(page.locator(".hero-actions a")).toHaveText([/View projects/, /Resume/]);
    if (info.project.name === "mobile") {
      // The expanded menu has none either: the floating launcher is the only one.
      await page.getByRole("button", { name: "Open menu" }).click();
      await expect(page.getByRole("button", { name: /Ask My AI/ })).toHaveCount(1);
      await page.keyboard.press("Escape");
    }
    const launchers = page.getByRole("button", { name: /^Ask My AI$/ });
    await expect(launchers).toHaveCount(1);
    await launchers.click();
    await expect(page.getByRole("dialog", { name: "Sree AI assistant" })).toBeVisible();
  });
});

test.describe("scroll position on a fresh visit", () => {
  test("a reload of the homepage starts at the top; an anchor link is respected", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => window.scrollTo(0, 900));
    await page.waitForTimeout(200);
    await page.reload();
    await page.waitForLoadState("load");
    await page.waitForTimeout(300);
    expect(await page.evaluate(() => window.scrollY)).toBe(0);
    // Restoration is handed back to the browser after load.
    expect(await page.evaluate(() => history.scrollRestoration)).toBe("auto");
    await page.goto("/#tools");
    await page.waitForLoadState("load");
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(100);
  });
});

test("the closed Spider-Man mask never degenerates (Safari draws all-zero stops as transparent)", async ({ page }) => {
  await page.goto("/");
  const mask = await page.locator(".pswap-illustrated").first().evaluate((e) => {
    const cs = getComputedStyle(e);
    return cs.maskImage || cs.getPropertyValue("-webkit-mask-image");
  });
  // The final stop sits just above 0% while the mask is closed.
  expect(mask).toMatch(/rgb\(0, 0, 0\) 0\.1%/);
});
