import { expect, test, type Page } from "@playwright/test";
import { experience } from "../../src/content/experience";
import { certifications } from "../../src/content/credentials";
import { projects } from "../../src/content/projects";

/**
 * V14: the statement arrives after the identity reveal, one unified homepage,
 * navigation in section order, certifications, and Lab retired.
 */

const NAV_ORDER = ["About", "Achievements", "Education", "Experience", "Tech Stack", "Projects", "Certifications", "Contact"];
const SECTION_ORDER = ["about", "achievements", "education", "experience", "tools", "projects", "certifications", "contact"];

const statementOpacity = (page: Page) =>
  page.locator(".hero-statement .hs-part").evaluateAll((els) => els.map((e) => parseFloat(getComputedStyle(e).opacity)));

test.describe("hero: the statement is the second chapter", () => {
  test("hidden during the reveal, then rises in under the name as the name glides up; the portrait never moves", async ({ page }, info) => {
    test.skip(info.project.name !== "desktop", "The name glide is a desktop layout.");
    await page.goto("/");
    // Initial state: the actions and the information strip are there from the first render.
    await expect(page.locator(".hero-actions").getByRole("link", { name: /View projects/ })).toHaveAttribute("href", "/projects");
    await expect(page.locator(".hero-actions").getByRole("link", { name: "Resume" })).toBeVisible();
    await expect(page.locator(".hero-meta")).toContainText("Boston, Massachusetts");
    await expect(page.locator(".hero-meta")).toContainText("Northeastern University");
    await expect(page.locator(".hero-logo")).toHaveCount(3);
    expect(await page.locator(".pswap").first().getAttribute("data-intro")).not.toBe("done");
    const geo = () =>
      page.evaluate(() => ({
        name: document.querySelector(".hero-first")!.getBoundingClientRect().top,
        photo: document.querySelector(".pswap-print")!.getBoundingClientRect().top,
        stage: document.querySelector(".hero-stage")!.getBoundingClientRect().height,
      }));
    const before = await geo();
    expect((await statementOpacity(page)).every((o) => o === 0)).toBe(true);
    // The statement is in the accessibility tree all along.
    await expect(page.locator(".hero-statement")).toHaveText("I build intelligent systems, from data to interface.");

    await expect(page.locator(".pswap").first()).toHaveAttribute("data-intro", "done", { timeout: 15_000 });
    await page.waitForTimeout(1000);
    const after = await geo();
    expect((await statementOpacity(page)).every((o) => o === 1)).toBe(true);
    // The name rose to make room; the portrait and the overall layout stayed put.
    expect(after.name).toBeLessThan(before.name - 20);
    expect(Math.abs(after.photo - before.photo)).toBeLessThanOrEqual(1);
    expect(Math.abs(after.stage - before.stage)).toBeLessThanOrEqual(1);
    // The statement starts after the identity reveal ends, and settles by about 2.9 s.
    const [hold, final] = await page.evaluate(() => ["identity-hold", "identity-final"].map((n) => performance.getEntriesByName(n)[0]?.startTime ?? 0));
    expect(final - hold).toBeLessThan(3000);
  });

  test("no unexpected layout shift on the homepage", async ({ page }) => {
    await page.addInitScript(() => {
      (window as unknown as { __cls: number }).__cls = 0;
      new PerformanceObserver((l) => {
        for (const e of l.getEntries() as (PerformanceEntry & { value: number; hadRecentInput: boolean })[]) if (!e.hadRecentInput) (window as unknown as { __cls: number }).__cls += e.value;
      }).observe({ type: "layout-shift", buffered: true });
    });
    await page.goto("/");
    await expect(page.locator(".pswap").first()).toHaveAttribute("data-intro", "done", { timeout: 15_000 });
    await page.waitForTimeout(1000);
    expect(await page.evaluate(() => (window as unknown as { __cls: number }).__cls)).toBeLessThan(0.02);
  });

  test("reduced motion and no JavaScript show the statement", async ({ browser }) => {
    for (const opts of [{ reducedMotion: "reduce" as const }, { javaScriptEnabled: false }]) {
      const ctx = await browser.newContext(opts);
      const page = await ctx.newPage();
      await page.goto("/");
      await page.waitForTimeout(400);
      expect((await statementOpacity(page)).every((o) => o === 1)).toBe(true);
      await ctx.close();
    }
  });
});

test.describe("one homepage", () => {
  test("sections follow the navigation order; no view switch, coach, More menu or Lab", async ({ page }) => {
    await page.goto("/");
    const ids = await page.locator("main [data-nav-section]").evaluateAll((els) => els.map((e) => e.getAttribute("data-nav-section")));
    expect(ids).toEqual(SECTION_ORDER);
    for (const id of SECTION_ORDER) await expect(page.locator(`#${id}`)).toHaveCount(1);
    await expect(page.getByRole("group", { name: "Portfolio view" })).toHaveCount(0);
    await expect(page.getByText(/Quick View|Detailed View|Want the full experience/)).toHaveCount(0);
    await expect(page.locator(".coach, #more-menu")).toHaveCount(0);
    await expect(page.locator("a[href='/lab'], a[href^='/lab#']")).toHaveCount(0);
  });

  test("navigation: eight items in homepage order, each landing on its section", async ({ page }, info) => {
    test.skip(info.project.name !== "desktop", "Desktop island.");
    await page.goto("/");
    const nav = page.getByRole("navigation", { name: "Primary" });
    await expect(nav.getByRole("link")).toHaveText(NAV_ORDER);
    await expect(nav.getByRole("button", { name: /More/ })).toHaveCount(0);
    await expect(page.locator("header").getByRole("button", { name: /Ask/ })).toHaveCount(0);
    for (const [i, label] of NAV_ORDER.entries()) {
      if (i === 0) continue;
      await nav.getByRole("link", { name: label, exact: true }).click();
      await expect(page).toHaveURL(new RegExp(`#${SECTION_ORDER[i]}$`));
      await expect.poll(() => page.locator(`#${SECTION_ORDER[i]}`).evaluate((e) => Math.round(e.getBoundingClientRect().top)), { timeout: 5000 }).toBeLessThan(200);
      await expect(nav.getByRole("link", { name: label, exact: true })).toHaveAttribute("aria-current", "location");
    }
  });

  test("mobile menu lists the same items in the same order", async ({ page }, info) => {
    test.skip(info.project.name !== "mobile", "Phone menu.");
    await page.goto("/");
    await page.getByRole("button", { name: "Open menu" }).click();
    await expect(page.getByRole("dialog", { name: "Site menu" }).getByRole("navigation").getByRole("link")).toHaveText(NAV_ORDER);
  });

  test("three experience tiles with details links that land on the record", async ({ page }) => {
    await page.goto("/");
    const tiles = page.locator("#experience .xp-tile");
    await expect(tiles).toHaveCount(3);
    for (const [i, e] of experience.entries()) {
      const tile = tiles.nth(i);
      await expect(tile).toContainText(e.company);
      await expect(tile).toContainText(e.role);
      await expect(tile).toContainText(e.period);
      await expect(tile).toContainText(e.brief);
      await expect(tile.getByRole("link", { name: /View details/ })).toHaveAttribute("href", `/experience#${e.slug}`);
    }
    const heights = await tiles.evaluateAll((els) => els.map((e) => Math.round(e.getBoundingClientRect().height)));
    expect(Math.max(...heights) - Math.min(...heights)).toBeLessThanOrEqual(1);
    await expect(page.locator("#experience").getByRole("link", { name: /Explore experience/ })).toHaveAttribute("href", "/experience");
    await page.goto("/experience#flare-innovation");
    await expect(page.locator("#flare-innovation")).toBeInViewport();
    await expect(page.locator("#rightrev")).toContainText("18");
    await expect(page.locator("#rightrev")).toContainText("200+");
  });

  test("exactly three featured projects, and the projects page keeps them all", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("#projects .project-card")).toHaveCount(3);
    await expect(page.locator("#projects").getByRole("link", { name: /View all projects/ })).toHaveAttribute("href", "/projects");
    await page.goto("/projects");
    for (const p of projects) await expect(page.getByRole("link", { name: new RegExp(p.name) }).first()).toBeAttached();
  });

  test("certifications come right after projects, from the verified records only", async ({ page }) => {
    await page.goto("/");
    const cards = page.locator("#certifications .cert-card");
    await expect(cards).toHaveCount(certifications.length);
    for (const [i, c] of certifications.entries()) {
      await expect(cards.nth(i)).toContainText(c.name);
      await expect(cards.nth(i)).toContainText(c.issuer);
      await expect(cards.nth(i).getByRole("link")).toHaveAttribute("href", c.credentialUrl ?? c.verifyUrl);
    }
    // The AWS course is presented as training, never as the exam credential.
    await expect(page.locator("#certifications")).not.toContainText("AWS Certified");
  });

  test("achievements: accurate action, and the MLOps emblem names the event and the 3rd place", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("#achievements").getByRole("link", { name: "Explore achievement details" })).toHaveAttribute("href", "/achievements");
    await expect(page.locator("#achievements").getByText(/View all achievements/)).toHaveCount(0);
    const emblem = page.locator("#achievements svg.emblem");
    await expect(emblem).toHaveCount(1);
    await expect(emblem).toContainText("GOOGLE MLOPS EXPO");
    await expect(emblem).toContainText("3rd");
    await expect(page.locator("#achievements .podium")).toHaveCount(0);
  });

  test("the retired Lab URL redirects to Projects", async ({ page }) => {
    await page.goto("/lab");
    await expect(page).toHaveURL(/\/projects$/);
    const sitemap = await (await page.request.get("/sitemap.xml")).text();
    expect(sitemap).not.toContain("/lab");
  });
});
