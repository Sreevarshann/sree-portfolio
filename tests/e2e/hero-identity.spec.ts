import { expect, test } from "@playwright/test";

/** Hero identity: name first, nickname second, engineering statement third; the photo label is just "Sree". */
const size = (page: import("@playwright/test").Page, sel: string) => page.locator(sel).first().evaluate((e) => parseFloat(getComputedStyle(e).fontSize));

test.describe("hero identity hierarchy", () => {
  test("one h1 reads the full name; the first name is the largest type", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("h1")).toHaveCount(1);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Hey, I'm Sreevarshan Sathiyamurthy.");
    await expect(page.locator(".hero-hey")).toHaveText("Hey, I'm");
    await expect(page.locator(".hero-nick")).toHaveText("Most people call me Sree.");
    await expect(page.locator(".hero-title")).toContainText("I build intelligent systems, from data to interface.");
    const [hey, first, nick, title] = [await size(page, ".hero-hey"), await size(page, ".hero-first"), await size(page, ".hero-nick"), await size(page, ".hero-title")];
    expect(first).toBeGreaterThan(title * 1.5);
    expect(title).toBeGreaterThan(nick);
    expect(nick).toBeGreaterThanOrEqual(hey);
    // The full name stays in the document title and structured data.
    await expect(page).toHaveTitle(/Sreevarshan Sathiyamurthy/);
    const ld = await page.locator('script[type="application/ld+json"]').allTextContents();
    expect(ld.join("")).toContain("Sreevarshan Sathiyamurthy");
    // No intro paragraph in the hero (V13).
    await expect(page.locator(".hero-stage .lede")).toHaveCount(0);
  });

  for (const width of [320, 375, 390, 430, 768, 1024, 1280, 1440, 1920, 2560]) {
    test(`${width}px: name unclipped, caption centred, no overflow`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto("/");
      const r = await page.evaluate(() => {
        const name = document.querySelector(".hero-first-mask")!.getBoundingClientRect();
        const col = document.querySelector(".hero-id")!.parentElement!.getBoundingClientRect();
        const cap = document.querySelector<HTMLElement>(".pswap-caption span")!;
        const photo = document.querySelector<HTMLElement>(".pswap-photo")!;
        return {
          overflow: document.documentElement.scrollWidth - innerWidth,
          left: name.left,
          over: name.right - col.right,
          height: name.height,
          lineHeight: parseFloat(getComputedStyle(document.querySelector(".hero-first")!).fontSize),
          capOffset: cap.offsetLeft + cap.offsetWidth / 2 - (photo.offsetLeft + photo.offsetWidth / 2),
        };
      });
      expect(r.overflow).toBeLessThanOrEqual(0);
      expect(r.left).toBeGreaterThanOrEqual(0);
      expect(r.over).toBeLessThanOrEqual(1);
      expect(r.height, "the name stays on one line").toBeLessThan(r.lineHeight * 1.5);
      expect(Math.abs(r.capOffset)).toBeLessThanOrEqual(1);
    });
  }

  test("the photo label says only 'Sree', readable in both themes", async ({ page }) => {
    for (const theme of ["dark", "light"]) {
      await page.addInitScript((t) => localStorage.setItem("theme", t), theme);
      await page.goto("/");
      const cap = page.locator(".pswap-caption").first();
      await expect(cap).toHaveText("Sree", { useInnerText: true });
      expect(await cap.evaluate((e) => getComputedStyle(e).textTransform)).toBe("none");
      expect(await size(page, ".pswap-caption")).toBeGreaterThanOrEqual(15);
    }
  });

  test("reduced motion: the whole introduction is visible immediately", async ({ browser }) => {
    const ctx = await browser.newContext({ reducedMotion: "reduce" });
    const page = await ctx.newPage();
    await page.goto("/");
    for (const sel of [".hero-hey", ".hero-first", ".hero-nick", ".hero-title"]) {
      expect(await page.locator(sel).first().evaluate((e) => getComputedStyle(e).opacity), sel).toBe("1");
    }
    await ctx.close();
  });
});
