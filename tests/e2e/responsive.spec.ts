import { expect, test } from "@playwright/test";

const WIDTHS = [320, 375, 390, 430, 768, 1024, 1280, 1440, 1920, 2560];
const PATHS = ["/", "/projects/aegis-ai", "/experience", "/lab", "/ask"];

test.describe("responsive layout", () => {
  test.skip(({ isMobile }) => isMobile, "runs once in the desktop project with explicit viewports");
  for (const width of WIDTHS) {
    test(`no horizontal overflow at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: width < 768 ? 800 : 900 });
      await page.emulateMedia({ reducedMotion: "reduce" });
      for (const path of PATHS) {
        await page.goto(path);
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
        expect(overflow, `${path} at ${width}px`).toBeLessThanOrEqual(1);
      }
      if (process.env.SCREENSHOTS) {
        await page.goto("/");
        await page.screenshot({ path: `test-results/shots/home-${width}.png` });
      }
    });
  }

  test("landscape phone keeps the chat usable", async ({ page }) => {
    await page.setViewportSize({ width: 844, height: 390 });
    await page.goto("/about");
    await page.getByRole("button", { name: /^Ask My AI$/ }).click();
    const input = page.getByLabel("Ask a question about Sree");
    await expect(input).toBeVisible();
    const box = await input.boundingBox();
    expect(box && box.y + box.height).toBeLessThanOrEqual(390);
  });
});
