import { expect, test } from "@playwright/test";

test("no cursor-following element exists and the native cursor is untouched", async ({ page }) => {
  await page.goto("/");
  await page.mouse.move(400, 400);
  await page.mouse.move(600, 500);
  const followers = await page.evaluate(() =>
    Array.from(document.querySelectorAll<HTMLElement>("body *")).filter((el) => {
      const cs = getComputedStyle(el);
      return cs.position === "fixed" && cs.pointerEvents === "none" && /translate3d\(|matrix/.test(el.style.transform) && el.offsetWidth <= 48;
    }).length,
  );
  expect(followers).toBe(0);
  expect(await page.evaluate(() => getComputedStyle(document.body).cursor)).toBe("auto");
  expect(await page.locator("[data-magnetic], [data-cursor]").count()).toBe(0);
});

test("SS monogram is in the navbar and returns home", async ({ page }) => {
  await page.goto("/projects");
  const home = page.getByRole("link", { name: "Sreevarshan Sathiyamurthy — Home" });
  await expect(home).toBeVisible();
  await expect(home).toContainText("SS");
  await home.click();
  await expect(page).toHaveURL(/\/$/);
});

test("hero shows the full name as the page heading", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Sreevarshan Sathiyamurthy");
  await expect(page).toHaveTitle(/Sreevarshan Sathiyamurthy/);
});

test("About speaks in the first person and stays short", async ({ page }) => {
  await page.goto("/about");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Sreevarshan");
  const intro = page.getByRole("region", { name: "Introduction" });
  const text = (await intro.locator("p, h2").allInnerTexts()).join(" ");
  expect(text).toMatch(/\bI'm Sreevarshan\b/);
  expect(text).not.toMatch(/\bSree is\b|\bHe is\b|\bhe (built|works)\b/);
  const words = (await intro.locator(".about-statement, h2 + p").allInnerTexts()).join(" ").split(/\s+/).filter(Boolean).length;
  expect(words).toBeGreaterThanOrEqual(40);
  expect(words).toBeLessThanOrEqual(100);
});
