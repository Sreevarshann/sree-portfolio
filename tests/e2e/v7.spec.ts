import { expect, test, type Page } from "@playwright/test";

const TABLEAU = "https://public.tableau.com/app/profile/sreevarshan.sathiyamurthy/vizzes";
const WIDTHS = [320, 375, 390, 430, 768, 1024, 1280, 1440, 1920, 2560];
const visible = (page: Page, label: string) => page.locator(`main > section[aria-label="${label}"]`);

async function scrollToSection(page: Page, selector: string) {
  await page.evaluate((sel) => {
    const el = document.querySelector<HTMLElement>(sel)!;
    window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - window.innerHeight * 0.2, behavior: "instant" as ScrollBehavior });
  }, selector);
  await page.waitForTimeout(250);
}

/** Every visible control's box must sit inside the capsule. */
async function overflowing(page: Page) {
  return page.evaluate(() => {
    const cap = document.querySelector<HTMLElement>("[data-island]")!;
    const c = cap.getBoundingClientRect();
    const out: string[] = [];
    cap.querySelectorAll<HTMLElement>("a, button").forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.width === 0 || getComputedStyle(el).display === "none") return;
      if (r.left < c.left - 0.5 || r.right > c.right + 0.5) out.push(`${el.getAttribute("aria-label") ?? el.textContent?.trim()}`);
    });
    if (cap.scrollWidth > cap.clientWidth + 1) out.push("scrollWidth");
    return out;
  });
}

test.describe("Explore My Stack", () => {
  for (const scheme of ["dark", "light"] as const) {
    test(`pill opens and closes the index; chevron and label follow (${scheme})`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: scheme });
      await page.goto("/");
      const pill = page.locator(".tech-index summary");
      await pill.scrollIntoViewIfNeeded();
      await expect(pill).toHaveAccessibleName("Explore My Stack");
      await expect(pill).toHaveAttribute("aria-controls", "tech-index-body");
      await page.locator(".skill-explorer").waitFor({ state: "attached" }); // mounts at idle (V12)
      const before = await page.locator("#tech-index-body").innerHTML();
      const box = (await pill.boundingBox())!;
      expect(box.height).toBeGreaterThanOrEqual(44); // comfortable touch target
      expect(box.width).toBeLessThan(260); // compact, not a full-width bar
      const rot = () => page.$eval(".stack-pill-chevron", (el) => getComputedStyle(el).transform);
      expect(await rot()).toMatch(/none|matrix\(1, 0, 0, 1/);
      await pill.click();
      await expect(page.locator(".tech-index")).toHaveAttribute("open", "");
      await expect(pill).toHaveAccessibleName("Hide My Stack");
      await expect.poll(rot).toMatch(/matrix\(-1, /);
      await expect(page.locator("#tech-index-body")).toBeVisible();
      expect(await page.locator("#tech-index-body").innerHTML()).toBe(before); // content unchanged
      await pill.click();
      await expect(page.locator(".tech-index")).not.toHaveAttribute("open", "");
      await expect(pill).toHaveAccessibleName("Explore My Stack");
      // Keyboard works too.
      await pill.focus();
      await page.keyboard.press("Enter");
      await expect(page.locator(".tech-index")).toHaveAttribute("open", "");
    });
  }

  test("no extra space around the collapsed trigger", async ({ page }) => {
    for (const width of [375, 768, 1440, 2560]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto("/");
      const r = await page.evaluate(() => {
        const idx = document.querySelector(".tech-index")!.getBoundingClientRect();
        const pill = document.querySelector(".tech-index summary")!.getBoundingClientRect();
        const next = (document.querySelector("#tools")!.nextElementSibling as HTMLElement);
        return { slack: idx.height - pill.height, gap: next.getBoundingClientRect().top - idx.bottom };
      });
      expect(r.slack, `index wraps the pill at ${width}`).toBeLessThanOrEqual(1);
      // The next section starts right after the index; its own top padding is the only gap.
      expect(Math.abs(r.gap), `next section follows at ${width}`).toBeLessThanOrEqual(1.5);
    }
  });
});

test.describe("navigation", () => {
  test.skip(({ isMobile }) => isMobile, "Desktop island links");

  test("homepage sections highlight their owner", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");
    await expect(page.getByRole("link", { name: "Sreevarshan Sathiyamurthy - Home" })).toHaveAttribute("aria-current", "page");
    const primary = page.getByRole("navigation", { name: "Primary" });
    for (const [sel, name] of [["#achievements", "Achievements"], ["#education", "Education"], ["#experience", "Experience"], ["#tools", "Tech Stack"], ["#projects", "Projects"], ["#certifications", "Certifications"], ["#contact", "Contact"]]) {
      await scrollToSection(page, sel);
      await expect(primary.getByRole("link", { name, exact: true }), sel).toHaveAttribute("aria-current", "location");
      await expect(primary.locator("[aria-current]")).toHaveCount(1);
    }
    // The glide indicator sits inside the capsule.
    const [ind, cap] = await page.evaluate(() => [document.querySelector(".nav-indicator")!.getBoundingClientRect().toJSON(), document.querySelector("[data-island]")!.getBoundingClientRect().toJSON()]);
    expect(ind.left).toBeGreaterThanOrEqual(cap.left);
    expect(ind.right).toBeLessThanOrEqual(cap.right);
  });

  test("dedicated routes highlight their owner", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    const primary = page.getByRole("navigation", { name: "Primary" });
    for (const [path, name] of [["/about", "About"], ["/experience", "Experience"], ["/projects", "Projects"], ["/projects/aegis-ai", "Projects"], ["/achievements", "Achievements"], ["/education", "Education"], ["/certifications", "Certifications"], ["/contact", "Contact"]]) {
      await page.goto(path);
      await expect(primary.getByRole("link", { name, exact: true }), path).toHaveAttribute("aria-current", "page");
    }
    await page.goto("/ask");
    await expect(primary.locator("[aria-current]")).toHaveCount(0);
  });

  for (const width of WIDTHS) {
    test(`homepage island keeps every control inside at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto("/");
      expect(await overflowing(page)).toEqual([]);
      await page.evaluate(() => window.scrollTo(0, 1500));
      await page.waitForTimeout(900);
      expect(await overflowing(page)).toEqual([]);
    });
  }
});

test.describe("spacing", () => {
  test("consistent gaps between consecutive sections", async ({ page }) => {
    for (const width of [375, 768, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto("/");
      const r = await page.evaluate(() => {
        // The standard chapter gap, read from a section that is not the first after the hero.
        const chapter = parseFloat(getComputedStyle(document.querySelectorAll("main > section.section:not(.section-tight)")[1]!).paddingTop);
        const secs = [...document.querySelectorAll<HTMLElement>("main > section")].filter((s) => s.offsetParent !== null);
        const gaps = secs.slice(1).map((s, i) => {
          const prevBottom = secs[i].getBoundingClientRect().bottom;
          return { label: s.getAttribute("aria-label"), first: i === 0, tight: s.classList.contains("section-tight"), gap: s.getBoundingClientRect().top - prevBottom, pad: parseFloat(getComputedStyle(s).paddingTop), pb: parseFloat(getComputedStyle(secs[i]).paddingBottom) };
        });
        return { chapter, gaps, overflow: document.documentElement.scrollWidth - innerWidth };
      });
      for (const g of r.gaps) {
        expect(Math.abs(g.gap), `${g.label} adjacency at ${width}`).toBeLessThanOrEqual(1);
        if (g.first) {
          // The first chapter after the hero starts closer (the hero closes with its strip).
          expect(g.pad, `${g.label} follows the hero closely at ${width}`).toBeLessThanOrEqual(r.chapter);
          continue;
        }
        expect(g.pb, `${g.label}'s neighbour adds no bottom padding at ${width}`).toBe(0);
        if (g.tight) expect(g.pad, `${g.label} uses the tight gap at ${width}`).toBeLessThan(r.chapter);
        else expect(Math.abs(g.pad - r.chapter), `${g.label} uses the chapter gap at ${width}`).toBeLessThanOrEqual(1);
      }
      expect(r.overflow).toBeLessThanOrEqual(1);
    }
  });
});

test.describe("Tableau Public", () => {
  test("is linked from contact, toolkit and footer with the exact URL", async ({ page, request }) => {
    await page.goto("/");
    const contact = visible(page, "Contact").getByRole("link", { name: /^Tableau Public/ });
    await expect(contact).toHaveAttribute("href", TABLEAU);
    await expect(contact).toHaveAttribute("target", "_blank");
    await expect(contact).toHaveAccessibleName(/Tableau Public\s?: explore my data visualizations/);
    await expect(page.locator("#tools").getByRole("link", { name: /View my Tableau work/ })).toHaveAttribute("href", TABLEAU);
    await expect(page.locator("footer").getByRole("link", { name: /Tableau Public/ })).toHaveAttribute("href", TABLEAU);
    expect((await request.get("/tech/tableau.svg")).status()).toBe(200);
  });
});
