import { expect, test, type Page } from "@playwright/test";

const WIDTHS = [320, 375, 390, 430, 768, 1024, 1280, 1440, 1920, 2560];
const SAUVC_POST = "https://www.linkedin.com/posts/sreevarshansathiyamurthy_sauvc2022-throwback-teamvaruna-ugcPost-7244625106197512192-ilNL/";

/** Document-relative boxes for the index and the Selected Work section. */
async function layout(page: Page) {
  return page.evaluate(() => {
    const abs = (el: Element) => {
      const r = el.getBoundingClientRect();
      return { top: r.top + scrollY, bottom: r.bottom + scrollY, height: r.height };
    };
    const index = document.querySelector(".tech-index")!;
    const body = index.querySelector(".tech-index-body")!;
    const work = document.querySelector('section[aria-label="Selected work"]')!;
    const rule = work.querySelector(".rule-draw") ?? work;
    // The site's established gap between two full sections (bottom + top padding).
    const sectionPad = parseFloat(getComputedStyle(work).paddingTop);
    return { index: abs(index), body: abs(body), bodyScroll: body.scrollHeight, rule: abs(rule), work: abs(work), sectionPad };
  });
}

async function settle(page: Page) {
  await page.waitForTimeout(900); // longer than the 640ms height transition
}

test.describe("V6 technology index", () => {
  test("collapsed: no oversized empty region before Selected Work", async ({ page }) => {
    for (const width of WIDTHS) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto("/");
      const l = await layout(page);
      const gap = l.rule.top - l.index.bottom;
      // Selected Work's own top padding is the spacing; the toolkit adds at most 40px.
      expect(gap, `gap at ${width}px`).toBeLessThanOrEqual(l.sectionPad + 41);
      expect(gap, `gap at ${width}px`).toBeGreaterThanOrEqual(l.sectionPad);
      // The closed index is just its summary row.
      expect(l.index.height, `collapsed height at ${width}px`).toBeLessThan(64);
      expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
    }
  });

  test("expanded: the panel fits its content and Selected Work follows directly", async ({ page }) => {
    for (const width of [375, 768, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto("/");
      const closed = await layout(page);
      await page.getByText("Where I've Used These Technologies").click();
      await settle(page);
      const open = await layout(page);
      // The body renders exactly its content: no extra reserved height.
      expect(Math.abs(open.body.height - open.bodyScroll), `body fit at ${width}px`).toBeLessThanOrEqual(1);
      // Following content moves down by exactly the growth of the index.
      expect(Math.round(open.rule.top - closed.rule.top)).toBe(Math.round(open.index.height - closed.index.height));
      // Columns are balanced: the index is not taller than the content needs.
      const groupBottoms = await page.$$eval(".tech-index-group", (gs) => gs.map((g) => g.getBoundingClientRect().bottom + scrollY));
      expect(open.index.bottom - Math.max(...groupBottoms), `trailing space at ${width}px`).toBeLessThanOrEqual(32);
      const columns = await page.$eval(".tech-index-body", (b) => getComputedStyle(b).columnCount);
      expect(columns).toBe(width >= 1024 ? "3" : width >= 640 ? "2" : "1");
      expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
    }
  });

  test("rapid repeated toggling settles to the natural open and closed heights", async ({ page }) => {
    await page.goto("/");
    const summary = page.getByText("Where I've Used These Technologies");
    await summary.scrollIntoViewIfNeeded();
    const closed = await layout(page);
    for (let i = 0; i < 7; i++) await summary.click({ delay: 10 });
    await settle(page);
    expect(await page.locator(".tech-index").evaluate((d) => (d as HTMLDetailsElement).open)).toBe(true);
    const open = await layout(page);
    expect(Math.abs(open.body.height - open.bodyScroll)).toBeLessThanOrEqual(1);
    await summary.click();
    await settle(page);
    const again = await layout(page);
    expect(Math.round(again.index.height)).toBe(Math.round(closed.index.height));
    expect(Math.round(again.rule.top)).toBe(Math.round(closed.rule.top));
  });

  test("no classification labels; renamed trigger; every row shows where it was used", async ({ page }) => {
    await page.goto("/");
    const tools = page.locator(".tools-section");
    await expect(tools).not.toContainText("Used in work or projects");
    await expect(tools).not.toContainText(/exploring/i);
    await expect(tools.locator("summary")).toHaveText("Where I've Used These Technologies");
    await page.getByText("Where I've Used These Technologies").click();
    const rows = tools.locator(".tech-index-row");
    expect(await rows.count()).toBeGreaterThan(30);
    for (const row of await rows.all()) await expect(row.locator(".tech-index-where a").first()).toBeVisible();
    // Internal links in the index resolve.
    const hrefs = [...new Set(await tools.locator(".tech-index-where a").evaluateAll((as) => as.map((a) => a.getAttribute("href")!)))];
    for (const h of hrefs) expect((await page.request.get(h)).status(), h).toBe(200);
  });

  for (const scheme of ["dark", "light"] as const) {
    test(`index is readable in ${scheme} theme`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: scheme });
      await page.goto("/");
      await page.getByText("Where I've Used These Technologies").click();
      const [name, where] = await page.$eval(".tech-index-row", (r) => [getComputedStyle(r.querySelector(".tech-index-name")!).color, getComputedStyle(r.querySelector(".tech-index-where")!).color]);
      expect(name).not.toBe(where); // names and context are visually distinct
    });
  }

  test("the marquee still runs", async ({ page }) => {
    await page.goto("/");
    await page.locator(".tools-section").scrollIntoViewIfNeeded();
    await expect.poll(() => page.$$eval(".marquee-track", (ts) => ts.map((t) => t.getAnimations()[0]?.playState))).toEqual(["running", "running"]);
  });
});

test.describe("V6 LinkedIn links", () => {
  for (const path of ["/", "/achievements"]) {
    test(`SAUVC link reads "View on LinkedIn" on ${path}`, async ({ page }) => {
      await page.goto(path);
      const link = page.locator(`a[href="${SAUVC_POST}"]`).filter({ hasText: "View on LinkedIn" }).first();
      await expect(link).toBeVisible();
      const visible = (await link.evaluate((a) => [...a.childNodes].filter((n) => !(n instanceof Element && n.classList.contains("sr-only"))).map((n) => n.textContent).join(""))).trim();
      expect(visible).toBe("View on LinkedIn");
      await expect(link).toHaveAttribute("target", "_blank");
      await expect(link).toHaveAttribute("rel", /noopener/);
      await expect(link).toHaveAccessibleName(/^View on LinkedIn — SAUVC result post, opens in a new tab$/);
      await expect(page.getByText(/Proof on LinkedIn|View proof on LinkedIn/)).toHaveCount(0);
    });
  }
});
