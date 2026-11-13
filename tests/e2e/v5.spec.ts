import { expect, test, type Page } from "@playwright/test";

const WIDTHS = [320, 375, 390, 430, 768, 1024, 1280, 1440, 1920, 2560];

async function marqueeMetrics(page: Page) {
  return page.$$eval(".marquee", (rows) =>
    rows.map((m) => {
      const track = m.querySelector<HTMLElement>(".marquee-track")!;
      const groups = [...m.querySelectorAll<HTMLElement>(".marquee-group")];
      const anim = track.getAnimations()[0];
      return {
        direction: m.getAttribute("data-direction"),
        track: track.getBoundingClientRect().width,
        groups: groups.map((g) => g.getBoundingClientRect().width),
        hidden: groups.map((g) => g.getAttribute("aria-hidden")),
        names: [...groups[0].querySelectorAll(".tech-name")].map((n) => n.textContent),
        dupNames: [...groups[1].querySelectorAll(".tech-name")].map((n) => n.textContent),
        running: anim?.playState,
        rowWidth: m.getBoundingClientRect().width,
        mask: getComputedStyle(m).maskImage || getComputedStyle(m).webkitMaskImage,
      };
    }),
  );
}

test.describe("V5 hero", () => {
  test("shows the full name, availability, intro and company identities", async ({ page }) => {
    // V7: the hero's company row is part of Detailed View (Quick View has the experience snapshot).
    await page.goto("/?view=detailed");
    await expect(page.locator("h1")).toHaveText("Sreevarshan Sathiyamurthy");
    await expect(page.getByText("Available for full-time opportunities")).toBeVisible();
    await expect(page.locator("main").getByText(/a Boston-based engineer building AI agents, data platforms and full-stack applications/)).toBeVisible();
    for (const [name, slug] of [
      ["RightRev", "rightrev"],
      ["Flare Innovation", "flare-innovation"],
      ["Sri Sairam Techno Incubator Foundation", "sri-sairam-techno-incubator"],
    ]) {
      await expect(page.getByRole("link", { name: new RegExp(`^${name} —`) })).toHaveAttribute("href", `/experience#${slug}`);
    }
    await expect(page.locator(".hero-facts")).toContainText("Boston, Massachusetts");
    await expect(page.locator(".hero-facts")).toContainText("Northeastern University");
    // No work-authorization or sponsorship claims anywhere on the page.
    await expect(page.locator("body")).not.toContainText(/sponsorship|STEM OPT|work authori[sz]ation|visa/i);
  });

  test("availability pill sits below the floating navigation, never inside it", async ({ page }) => {
    for (const width of [320, 768, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto("/");
      const pill = (await page.locator(".availability").boundingBox())!;
      const nav = (await page.locator("[data-island]").boundingBox())!;
      expect(pill.y, `width ${width}`).toBeGreaterThanOrEqual(nav.y + nav.height);
      expect(pill.x + pill.width, `width ${width}`).toBeLessThanOrEqual(width);
    }
  });

  test("portrait renders its intentional placeholder until real assets are added", async ({ page }) => {
    await page.goto("/");
    const fig = page.locator(".pswap");
    await expect(fig).toHaveAttribute("data-mode", "placeholder");
    await expect(fig.getByRole("img", { name: /Portrait placeholder/ })).toBeVisible();
    await expect(fig.locator("img")).toHaveCount(0);
    const html = await page.content();
    expect(html).not.toContain("portrait-real");
    expect(html).not.toContain("portrait-illustrated");
  });
});

test.describe("V5 technology marquee", () => {
  test("two seamless rows move in opposite directions with faded edges", async ({ page }) => {
    await page.goto("/");
    await page.locator(".tools-section").scrollIntoViewIfNeeded();
    await expect.poll(async () => (await marqueeMetrics(page)).every((r) => r.running === "running")).toBe(true);
    const rows = await marqueeMetrics(page);
    expect(rows.map((r) => r.direction)).toEqual(["left", "right"]);
    for (const r of rows) {
      // The track is exactly two identical groups, so translating by -50% loops seamlessly.
      expect(Math.abs(r.groups[0] - r.groups[1])).toBeLessThan(0.5);
      expect(Math.abs(r.track - 2 * r.groups[0])).toBeLessThan(1);
      // One group is always wider than the row, so there is never an empty gap.
      expect(r.groups[0]).toBeGreaterThan(r.rowWidth);
      expect(r.hidden).toEqual([null, "true"]);
      expect(r.dupNames).toEqual(r.names);
      expect(r.mask).toContain("linear-gradient");
    }
  });

  test("every technology has a readable accessible name, announced once", async ({ page }) => {
    await page.goto("/");
    const lists = page.getByRole("list", { name: /AI, machine learning and languages|Data, cloud, delivery and visualization/ });
    await expect(lists).toHaveCount(2);
    const names = await lists.locator(".tech-name").allInnerTexts();
    for (const n of ["Claude", "OpenAI", "Gemini", "Hugging Face", "Model Context Protocol", "Snowflake Cortex", "Python", "Apache Airflow", "Docker", "Plotly", "Power BI"]) {
      expect(names.some((x) => x.startsWith(n)), n).toBe(true);
    }
    // The visual duplicates are hidden from assistive technology.
    await expect(page.locator(".marquee-group[aria-hidden='true']")).toHaveCount(2);
  });

  test("no broken logos: sprite symbols resolve and every image decodes", async ({ page, request }) => {
    await page.goto("/");
    await page.locator(".tools-section").scrollIntoViewIfNeeded();
    const sprite = await request.get("/tech-icons.svg");
    expect(sprite.status()).toBe(200);
    const svg = await sprite.text();
    const ids = await page.$$eval(".tech-marquee use", (us) => [...new Set(us.map((u) => u.getAttribute("href")!.split("#")[1]))]);
    for (const id of ids) expect(svg, id).toContain(`id="${id}"`);
    await expect
      .poll(() => page.$$eval(".tech-marquee img", (imgs) => imgs.filter((i) => !(i as HTMLImageElement).complete || !(i as HTMLImageElement).naturalWidth).length), { timeout: 10_000 })
      .toBe(0);
  });

  test("hovering a row eases it almost to a stop, and leaving resumes it", async ({ page, isMobile }) => {
    test.skip(isMobile, "hover only");
    await page.goto("/");
    const row = page.locator(".marquee").first();
    await row.scrollIntoViewIfNeeded();
    await row.hover();
    await expect.poll(() => row.evaluate((m) => m.querySelector(".marquee-track")!.getAnimations()[0].playbackRate)).toBeLessThan(0.2);
    await page.mouse.move(5, 5);
    await expect.poll(() => row.evaluate((m) => m.querySelector(".marquee-track")!.getAnimations()[0].playbackRate)).toBeGreaterThan(0.95);
  });

  test("reduced motion: still, wrapped list with no duplicate and no overflow", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    const rows = await page.$$eval(".marquee", (ms) =>
      ms.map((m) => ({
        anim: getComputedStyle(m.querySelector(".marquee-track")!).animationName,
        dup: getComputedStyle(m.querySelectorAll(".marquee-group")[1]).display,
      })),
    );
    for (const r of rows) {
      expect(r.anim).toBe("none");
      expect(r.dup).toBe("none");
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
  });

  test("usage index links each tool to where it was used", async ({ page }) => {
    await page.goto("/");
    await page.getByText("Explore My Stack").click();
    const index = page.locator(".tech-index");
    await expect(index.getByRole("link", { name: "Sree AI (this site)" })).toHaveAttribute("href", "/ask");
    await expect(index.locator(".tech-index-row", { hasText: /^Snowflake Cortex/ }).getByRole("link", { name: "RightRev" })).toHaveAttribute("href", "/experience#rightrev");
  });
});

test.describe("V5 layout and themes", () => {
  test("no horizontal page overflow across breakpoints", async ({ page }) => {
    for (const width of WIDTHS) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto("/");
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow, `width ${width}`).toBeLessThanOrEqual(1);
      const row = await page.locator(".marquee").first().boundingBox();
      expect(row!.x + row!.width, `marquee at ${width}`).toBeLessThanOrEqual(width + 1);
    }
  });

  for (const scheme of ["dark", "light"] as const) {
    test(`logos follow the ${scheme} theme`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: scheme });
      await page.goto("/");
      await expect(page.locator("html")).toHaveAttribute("data-theme", scheme);
      const { ink, fg } = await page.evaluate(() => {
        const nextLogo = [...document.querySelectorAll(".tech-tile")].find((t) => t.textContent?.startsWith("Next.js"))!.querySelector("svg")!;
        return { ink: getComputedStyle(nextLogo).color, fg: getComputedStyle(document.body).color };
      });
      // Black marks are drawn in the theme's text colour, so they never vanish on dark.
      expect(ink).toBe(fg);
    });
  }

  test("footer shows the release month and year only", async ({ page }) => {
    await page.goto("/");
    const stamp = page.locator(".site-updated");
    await expect(stamp).toHaveText(/^Last updated · [A-Z][a-z]+ \d{4}$/);
    const expected = new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric", timeZone: "America/New_York" }).format(new Date());
    // The build ran just before the tests, in the same month.
    await expect(stamp).toHaveText(`Last updated · ${expected}`);
    await expect(stamp.locator("time")).toHaveAttribute("datetime", /^\d{4}-\d{2}$/);
  });
});
