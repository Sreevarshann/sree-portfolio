import { expect, test, type Page } from "@playwright/test";

/** Every visible control's box must sit inside the capsule's box. */
async function overflowing(page: Page) {
  return page.evaluate(() => {
    const cap = document.querySelector<HTMLElement>("[data-island]")!;
    const c = cap.getBoundingClientRect();
    const out: string[] = [];
    cap.querySelectorAll<HTMLElement>("a, button").forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.width === 0 || getComputedStyle(el).display === "none") return;
      if (r.left < c.left - 0.5 || r.right > c.right + 0.5 || r.top < c.top - 0.5 || r.bottom > c.bottom + 0.5)
        out.push(`${el.getAttribute("aria-label") ?? el.textContent?.trim()}: ${Math.round(r.right - c.right)}px`);
    });
    if (cap.scrollWidth > cap.clientWidth + 1) out.push(`scrollWidth ${cap.scrollWidth} > ${cap.clientWidth}`);
    return out;
  });
}
const settle = (page: Page) => page.waitForTimeout(900);
const scrollTo = (page: Page, y: number) => page.evaluate((y) => window.scrollTo(0, y), y);
const state = (page: Page) => page.locator("[data-island]").getAttribute("data-island");

test.describe("dynamic island geometry", () => {
  test.skip(({ isMobile }) => isMobile, "Desktop project drives explicit viewport sizes.");

  // 1280 and 2560 at 125/150/200% zoom are 1024, 2048, 1707, 1280 and 640 CSS px.
  for (const width of [320, 375, 390, 430, 640, 768, 1024, 1280, 1440, 1536, 1707, 1920, 2048, 2560]) {
    test(`controls stay inside the capsule at ${width}px, expanded and compact`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto("/projects");
      await settle(page);
      expect(await state(page)).toBe("expanded");
      expect(await overflowing(page)).toEqual([]);
      await scrollTo(page, 1200);
      await settle(page);
      expect(await state(page)).toBe("compact");
      expect(await overflowing(page)).toEqual([]);
      await scrollTo(page, 0);
      await settle(page);
      expect(await state(page)).toBe("expanded");
      expect(await overflowing(page)).toEqual([]);
    });
  }

  test("compact mode makes the AI launcher icon-only with no reserved width", async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 900 });
    await page.goto("/");
    const label = page.locator(".ai-label");
    expect((await label.boundingBox())!.width).toBeGreaterThan(50);
    await scrollTo(page, 1500);
    await settle(page);
    // Wait for the collapse transition rather than a fixed delay (slow CI runners).
    await expect.poll(async () => (await label.boundingBox())!.width).toBeLessThan(1);
    const pill = (await page.getByRole("button", { name: "Ask My AI — open Sree AI" }).boundingBox())!;
    expect(Math.abs(pill.width - pill.height)).toBeLessThan(2);
  });

  test("rapid scroll reversals and a resize mid-animation leave no stale state", async ({ page }) => {
    await page.setViewportSize({ width: 1600, height: 900 });
    await page.goto("/projects");
    for (let i = 0; i < 8; i++) {
      await scrollTo(page, i % 2 ? 0 : 1400);
      await page.waitForTimeout(60 + i * 15);
    }
    await page.setViewportSize({ width: 1300, height: 900 });
    await scrollTo(page, 1400);
    await page.waitForTimeout(120);
    await page.setViewportSize({ width: 1920, height: 900 });
    await settle(page);
    expect(await state(page)).toBe("compact");
    expect(await overflowing(page)).toEqual([]);
    await scrollTo(page, 0);
    await settle(page);
    expect(await state(page)).toBe("expanded");
    expect(await overflowing(page)).toEqual([]);
  });

  test("theme switching works in both states and the toggle stays inside", async ({ page }) => {
    await page.setViewportSize({ width: 1536, height: 900 });
    await page.goto("/");
    for (const y of [0, 1500]) {
      await scrollTo(page, y);
      await settle(page);
      const before = await page.evaluate(() => document.documentElement.dataset.theme);
      await page.getByRole("button", { name: /Switch to (light|dark) theme/ }).click();
      await expect.poll(() => page.evaluate(() => document.documentElement.dataset.theme)).not.toBe(before);
      expect(await overflowing(page)).toEqual([]);
    }
  });

  test("keyboard reaches every island control in order", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/about");
    await page.keyboard.press("Tab"); // skip link
    const names: string[] = [];
    for (let i = 0; i < 12; i++) {
      await page.keyboard.press("Tab");
      names.push(await page.evaluate(() => document.activeElement?.getAttribute("aria-label") ?? document.activeElement?.textContent?.trim() ?? ""));
    }
    expect(names[0]).toBe("Sreevarshan Sathiyamurthy — Home");
    expect(names).toContain("Ask My AI — open Sree AI");
    expect(names.some((n) => /Switch to (light|dark) theme/.test(n))).toBe(true);
  });

  test("AI launcher opens and closes from the compact island", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/projects");
    await scrollTo(page, 1200);
    await settle(page);
    await page.getByRole("button", { name: "Ask My AI — open Sree AI" }).click();
    const dialog = page.getByRole("dialog", { name: /Sree AI/ });
    await expect(dialog).toBeVisible({ timeout: 15_000 });
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    expect(await overflowing(page)).toEqual([]);
  });
});

test.describe("reduced motion", () => {
  test.use({ reducedMotion: "reduce" });
  test("island switches state instantly and stays in bounds", async ({ page }) => {
    await page.goto("/projects");
    await scrollTo(page, 1200);
    await page.waitForTimeout(150);
    expect(await state(page)).toBe("compact");
    expect(await overflowing(page)).toEqual([]);
  });
});

test("mobile menu opens from the island and every link is reachable", async ({ page, isMobile }) => {
  test.skip(!isMobile, "Phone layout only.");
  await page.goto("/");
  expect(await overflowing(page)).toEqual([]);
  await page.getByRole("button", { name: "Open menu" }).click();
  const menu = page.getByRole("dialog", { name: "Site menu" });
  await expect(menu).toBeVisible();
  for (const name of ["Home", "About", "Experience", "Projects", "Achievements", "Education", "Certifications", "Lab", "Contact"])
    await expect(menu.getByRole("link", { name, exact: true })).toBeVisible();
  await menu.getByRole("link", { name: "Lab", exact: true }).click();
  await expect(page).toHaveURL(/\/lab$/);
  await expect(menu).toBeHidden();
});
