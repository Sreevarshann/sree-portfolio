import { expect, test } from "@playwright/test";

/** V15: pronunciation, mobile wordmark, homepage card motion and colored issuer logos. */

test.describe("hero pronunciation", () => {
  test("appears about half a second after the name is revealed, under the name", async ({ page }) => {
    await page.goto("/");
    const say = page.locator(".hero-say");
    await expect(say.locator("[aria-hidden]")).toHaveText("Sree - vur - shun");
    await expect(say.locator(".sr-only")).toHaveText("Pronounced Sree-vur-shun");
    expect(await say.evaluate((e) => getComputedStyle(e).opacity)).toBe("0");
    await expect(page.locator(".pswap").first()).toHaveAttribute("data-intro", "done", { timeout: 15_000 });
    // Still hidden right after the reveal, visible shortly after.
    const early = await say.evaluate((e) => parseFloat(getComputedStyle(e).opacity));
    expect(early).toBeLessThan(0.5);
    await expect.poll(() => say.evaluate((e) => getComputedStyle(e).opacity), { timeout: 3000 }).toBe("1");
    const g = await page.evaluate(() => {
      const r = (s: string) => document.querySelector(s)!.getBoundingClientRect();
      return { name: r(".hero-first"), say: r(".hero-say"), nick: r(".hero-nick") };
    });
    expect(g.say.top).toBeGreaterThanOrEqual(g.name.bottom - 2);
    expect(g.nick.top).toBeGreaterThanOrEqual(g.say.bottom - 1);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Hey, I'm Sreevarshan Sathiyamurthy.");
  });

  test("reduced motion shows it at once", async ({ browser }) => {
    const ctx = await browser.newContext({ reducedMotion: "reduce" });
    const page = await ctx.newPage();
    await page.goto("/");
    await page.waitForTimeout(300);
    expect(await page.locator(".hero-say").evaluate((e) => getComputedStyle(e).opacity)).toBe("1");
    await ctx.close();
  });
});

test.describe("mobile navigation wordmark", () => {
  // "Sree" takes over only when "Sreevarshan" would be tight (narrow phones at high zoom).
  for (const [w, label] of [[320, /^Sree(varshan)?$/], [375, /^Sreevarshan$/], [390, /^Sreevarshan$/], [430, /^Sreevarshan$/], [768, /^Sreevarshan$/]] as const) {
    test(`${w}px: wordmark fills the centre without overlapping the controls`, async ({ page }) => {
      await page.setViewportSize({ width: w, height: 800 });
      await page.goto("/");
      const g = await page.evaluate(() => {
        const vis = (s: string) => Array.from(document.querySelectorAll<HTMLElement>(s)).find((e) => e.getClientRects().length > 0);
        const text = vis(".island-wordmark .wm-full") ?? vis(".island-wordmark .wm-short");
        const r = (e: Element) => e.getBoundingClientRect();
        return {
          text: text?.textContent,
          t: r(text!),
          mono: r(document.querySelector(".island-brand")!),
          toggle: r(document.querySelector("[data-island] [aria-label^='Switch to']")!),
          menu: r(document.querySelector(".island-menu-btn")!),
        };
      });
      expect(g.text).toMatch(label);
      expect(g.t.left).toBeGreaterThan(g.mono.right);
      expect(g.t.right).toBeLessThan(g.toggle.left);
      expect(g.menu.width).toBeGreaterThan(0);
    });
  }

  test("desktop keeps the link bar with no wordmark", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");
    await expect(page.locator(".island-wordmark")).toBeHidden();
    await expect(page.getByRole("navigation", { name: "Primary" }).getByRole("link")).toHaveCount(8);
  });
});

test.describe("homepage cards", () => {
  test("the four sections use the interactive card system; content and links unchanged", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("#education .lux-edu")).toHaveCount(2);
    await expect(page.locator("#experience .lux-xp")).toHaveCount(3);
    await expect(page.locator("#projects .lux-proj")).toHaveCount(3);
    await expect(page.locator("#certifications .lux-cert")).toHaveCount(3);
    for (const motif of ["agents", "pipeline", "sonar"]) await expect(page.locator(`#experience [data-motif="${motif}"] .xp-motif`)).toHaveCount(1);
    await expect(page.locator("#projects").getByRole("link", { name: /View all projects/ })).toHaveAttribute("href", "/projects");
  });

  test("certification issuers show their own colored logos on light plates", async ({ page }) => {
    await page.goto("/");
    const srcs = await page.locator("#certifications .cert-logo").evaluateAll((els) => els.map((e) => (e as HTMLImageElement).getAttribute("src")));
    expect(srcs).toEqual(["/logos/issuers/google.svg", "/logos/issuers/cisco.svg", "/logos/issuers/aws.svg"]);
    for (const src of srcs) {
      const svg = await (await page.request.get(src!)).text();
      expect(svg).toMatch(/#(EA4335|049FD9|FF9900)/i);
    }
    const filters = await page.locator("#certifications .cert-logo").evaluateAll((els) => els.map((e) => getComputedStyle(e).filter));
    expect(filters.every((f) => f === "none")).toBe(true);
    await expect(page.locator("#certifications")).toContainText("Training");
  });
});
