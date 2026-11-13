import { expect, test, type Page } from "@playwright/test";

const TABLEAU = "https://public.tableau.com/app/profile/sreevarshan.sathiyamurthy/vizzes";
const WIDTHS = [320, 375, 390, 430, 768, 1024, 1280, 1440, 1920, 2560];
const view = (page: Page) => page.evaluate(() => document.documentElement.dataset.view);
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

test.describe("Quick View (default)", () => {
  test("first visit opens the concise homepage", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto("/");
    expect(await view(page)).toBe("quick");
    await expect(page.locator("h1")).toHaveText("Sreevarshan Sathiyamurthy");
    await expect(page.getByText("Available for full-time opportunities")).toBeVisible();
    // Exactly three featured projects, each with one action.
    await expect(visible(page, "Selected work").getByRole("link", { name: /^Explore project/ })).toHaveCount(3);
    for (const name of ["AEGIS AI", "NEXUS AI", "WorkMesh"]) await expect(visible(page, "Selected work").getByRole("heading", { name })).toBeVisible();
    // Experience snapshot: three roles with one outcome each.
    await expect(page.locator(".xp-snap li")).toHaveCount(3);
    await expect(page.locator(".xp-snap")).toContainText("18");
    // Achievements and contact.
    await expect(visible(page, "Achievements")).toContainText("Singapore AUV Challenge");
    await expect(visible(page, "Achievements")).toContainText("Google MLOps Expo");
    await expect(visible(page, "Contact").getByRole("link", { name: /sreevarshan\.dev@gmail\.com/ })).toHaveAttribute("href", "mailto:sreevarshan.dev@gmail.com");
    // Detailed-only sections are out of layout (display:none) and their charts never load.
    for (const label of ["Lab", "Sree AI"]) await expect(visible(page, label)).toBeHidden();
    await expect(visible(page, "Approach")).toBeVisible(); // the short approach statement shows in both views
    await expect(page.locator(".js-plotly-plot")).toHaveCount(0);
    // The hero intro stays short.
    const intro = await page.locator(".hero-title + p, .lede").first().innerText();
    expect(intro.split(/\s+/).length).toBeLessThan(40);
    expect(errors.filter((e) => /hydrat|did not match/i.test(e)), errors.join("\n")).toEqual([]);
  });

  test("the marquee still runs and the stack index is collapsed", async ({ page }) => {
    await page.goto("/");
    await page.locator("#tools").scrollIntoViewIfNeeded();
    await expect.poll(() => page.$$eval(".marquee-track", (ts) => ts.map((t) => t.getAnimations()[0]?.playState))).toEqual(["running", "running"]);
    await expect(page.locator(".tech-index")).not.toHaveAttribute("open", "");
    await expect(page.locator(".tech-index summary")).toHaveText("Explore My Stack", { useInnerText: true });
  });
});

test.describe("Detailed View", () => {
  test("?view=detailed shows the full portfolio", async ({ page }) => {
    await page.goto("/?view=detailed");
    expect(await view(page)).toBe("detailed");
    for (const label of ["Approach", "Lab", "Sree AI"]) await expect(visible(page, label)).toBeVisible();
    await expect(visible(page, "Selected work").getByRole("link", { name: /^Case study/ })).toHaveCount(4);
    await expect(page.locator(".hero-companies")).toBeVisible();
    await expect(page.locator(".xp-snap")).toBeHidden();
    await expect(visible(page, "Experience").getByRole("heading", { name: "Software & Data Engineer Intern" })).toBeVisible();
  });

  test("dedicated routes are complete regardless of the homepage view", async ({ page }) => {
    await page.goto("/?view=quick");
    await page.goto("/projects/aegis-ai");
    await expect(page.getByRole("heading", { name: /System architecture/ })).toBeVisible();
    await page.goto("/experience");
    await expect(page.getByText("Integrated Salesforce CRM APIs with five AI agents.")).toBeVisible();
  });
});

test.describe("view switch", () => {
  test("switches without reload, persists, syncs the URL without adding history, and keeps the theme", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "light" });
    await page.goto("/");
    await page.evaluate(() => ((window as unknown as { __marker: number }).__marker = 1));
    const historyLength = await page.evaluate(() => history.length);
    const sw = page.getByRole("group", { name: "Portfolio view" });
    await sw.getByRole("button", { name: "Detailed View" }).click();
    await expect.poll(() => view(page)).toBe("detailed");
    await expect(sw.getByRole("button", { name: "Detailed View" })).toHaveAttribute("aria-pressed", "true");
    expect(page.url()).toContain("view=detailed");
    expect(await page.evaluate(() => history.length)).toBe(historyLength);
    expect(await page.evaluate(() => (window as unknown as { __marker?: number }).__marker)).toBe(1); // no reload
    expect(await page.evaluate(() => document.documentElement.dataset.theme)).toBe("light");
    await page.goto("/");
    expect(await view(page)).toBe("detailed"); // remembered
    await page.goto("/?view=quick");
    expect(await view(page)).toBe("quick"); // explicit URL wins
  });

  test("rapid toggling settles correctly with no errors", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto("/");
    const sw = page.getByRole("group", { name: "Portfolio view" });
    for (let i = 0; i < 9; i++) await sw.getByRole("button", { name: i % 2 ? "Quick View" : "Detailed View" }).click();
    await expect.poll(() => view(page)).toBe("detailed");
    await expect(visible(page, "Approach")).toBeVisible();
    await expect(visible(page, "Selected work").locator(".v-quick")).toBeHidden();
    expect(errors).toEqual([]);
  });

  test("back/forward keeps the chosen view", async ({ page }) => {
    await page.goto("/?view=detailed");
    await page.goto("/projects");
    await page.goBack({ waitUntil: "load" });
    await expect.poll(() => view(page).catch(() => null)).toBe("detailed");
  });
});

test.describe("onboarding coach mark", () => {
  test.use({ storageState: { cookies: [], origins: [] } });
  // The hint is on screen for only 3 s. The hero's WebGL field (software GL in
  // headless Chromium) is skipped here, as on Save-Data connections, so
  // parallel CI load cannot stretch the assertions past that window.
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => Object.defineProperty(navigator, "connection", { value: { saveData: true }, configurable: true }));
  });
  const coachOf = (page: Page) => page.getByRole("dialog", { name: "Want the full portfolio?" });

  for (const width of WIDTHS) {
    test(`points at the switch and stays on screen at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto("/");
      const coach = coachOf(page);
      await expect(coach).toBeVisible({ timeout: 15_000 });
      await page.waitForTimeout(500); // entrance animation; still well inside the 3 s window
      const [box, arrow, sw] = await page.evaluate(() => {
        const r = (el: Element) => el.getBoundingClientRect().toJSON() as DOMRect;
        return [r(document.querySelector(".coach")!), r(document.querySelector(".coach-arrow")!), r(document.getElementById("view-switch")!)];
      });
      expect(box.left).toBeGreaterThanOrEqual(0);
      expect(box.right).toBeLessThanOrEqual(width);
      expect(box.top).toBeGreaterThanOrEqual(sw.bottom); // below the switch, pointing up
      const arrowX = arrow.left + arrow.width / 2;
      expect(arrowX, "arrow points at the switch").toBeGreaterThanOrEqual(sw.left);
      expect(arrowX).toBeLessThanOrEqual(sw.right);
      // It never covers the hero headline (true rectangle intersection).
      const h = (await page.locator(".hero-title").boundingBox())!;
      const ix = Math.max(0, Math.min(box.right, h.x + h.width) - Math.max(box.left, h.x));
      const iy = Math.max(0, Math.min(box.bottom, h.y + h.height) - Math.max(box.top, h.y));
      expect(ix * iy, "coach overlaps the headline").toBe(0);
      await expect(page.getByRole("group", { name: "Portfolio view" })).toHaveAttribute("aria-describedby", "view-coach-body");
      await expect(coach).toContainText("Click here to switch to Detailed View and explore my complete experience, projects, and technical work.");
    });
  }

  test("disappears on its own about 3 seconds after it becomes visible, and never returns", async ({ page }) => {
    await page.goto("/");
    const coach = coachOf(page);
    await expect(coach).toBeVisible({ timeout: 15_000 });
    const shownAt = Date.now();
    await expect(coach).toBeHidden({ timeout: 6_000 });
    const elapsed = Date.now() - shownAt;
    expect(elapsed, "stays at least ~3 s").toBeGreaterThanOrEqual(2_600);
    expect(elapsed, "then closes").toBeLessThanOrEqual(4_500);
    await page.reload();
    await page.waitForTimeout(4_500);
    await expect(page.locator(".coach")).toHaveCount(0);
  });

  test("the close button dismisses it immediately; it is not shown again", async ({ page }) => {
    await page.goto("/");
    const coach = coachOf(page);
    await expect(coach).toBeVisible({ timeout: 15_000 });
    await coach.getByRole("button", { name: "Dismiss" }).click();
    await expect(coach).toBeHidden({ timeout: 1_000 });
    await page.reload();
    await page.waitForTimeout(4_500);
    await expect(page.locator(".coach")).toHaveCount(0);
  });

  test("clicking the hint switches to Detailed View", async ({ page }) => {
    await page.goto("/");
    const coach = coachOf(page);
    await coach.getByRole("button", { name: /Click here to switch to Detailed View/ }).click({ timeout: 15_000 });
    await expect.poll(() => view(page)).toBe("detailed");
    await expect(coach).toBeHidden();
  });

  test("using the switch dismisses it, and the switch keeps working", async ({ page }) => {
    await page.goto("/");
    const coach = coachOf(page);
    await expect(coach).toBeVisible({ timeout: 15_000 });
    await page.getByRole("button", { name: "Detailed View", exact: true }).click();
    await expect(coach).toBeHidden({ timeout: 1_000 });
    await expect.poll(() => view(page)).toBe("detailed");
    await page.getByRole("button", { name: "Quick View", exact: true }).click();
    await expect.poll(() => view(page)).toBe("quick");
  });

  test("Escape closes it; it never takes or traps focus", async ({ page }) => {
    await page.goto("/");
    const coach = coachOf(page);
    await expect(coach).toBeVisible({ timeout: 15_000 });
    expect(await page.evaluate(() => document.getElementById("view-coach")?.contains(document.activeElement))).toBe(false);
    await page.keyboard.press("Escape");
    await expect(coach).toBeHidden({ timeout: 1_000 });
  });

  for (const scheme of ["dark", "light"] as const) {
    test(`is legible in the ${scheme} theme, and still on screen on a phone`, async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 812 });
      await page.emulateMedia({ colorScheme: scheme });
      await page.goto("/");
      const coach = page.locator(".coach");
      await expect(coach).toBeVisible({ timeout: 15_000 });
      const r = await coach.evaluate((el) => ({ ...el.getBoundingClientRect().toJSON(), fg: getComputedStyle(el.querySelector(".coach-title")!).color, bg: getComputedStyle(el).backgroundColor }));
      expect(r.fg).not.toBe(r.bg);
      expect(r.left).toBeGreaterThanOrEqual(0);
      expect(r.right).toBeLessThanOrEqual(375);
    });
  }

  test("respects reduced motion", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    const coach = page.locator(".coach");
    await expect(coach).toBeVisible({ timeout: 15_000 });
    expect(await coach.evaluate((el) => getComputedStyle(el).animationName)).toBe("none");
  });

  test("does not appear on other pages or in Detailed View", async ({ page }) => {
    await page.goto("/projects");
    await page.waitForTimeout(3500);
    await expect(page.locator(".coach")).toHaveCount(0);
    await page.goto("/?view=detailed");
    await page.waitForTimeout(3500);
    await expect(page.locator(".coach")).toHaveCount(0);
  });
});

test.describe("Explore My Stack", () => {
  for (const scheme of ["dark", "light"] as const) {
    test(`pill opens and closes the index; chevron and label follow (${scheme})`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: scheme });
      await page.goto("/");
      const pill = page.locator(".tech-index summary");
      await pill.scrollIntoViewIfNeeded();
      await expect(pill).toHaveAccessibleName("Explore My Stack");
      await expect(pill).toHaveAttribute("aria-controls", "tech-index-body");
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

  const homeCases: [string, string, string][] = [
    ['section[aria-label="What I build"]', "About", "location"],
    ['section[aria-label="Selected work"]', "Projects", "location"],
    ['section[aria-label="Experience"]', "Experience", "location"],
    ["#tools", "About", "location"],
    ['section[aria-label="Achievements"]', "Achievements", "location"],
  ];
  for (const v of ["quick", "detailed"] as const) {
    test(`homepage sections highlight their owner (${v})`, async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto(`/?view=${v}`);
      await expect(page.getByRole("link", { name: "Sreevarshan Sathiyamurthy - Home" })).toHaveAttribute("aria-current", "page");
      const primary = page.getByRole("navigation", { name: "Primary" });
      for (const [sel, name, kind] of homeCases) {
        await scrollToSection(page, sel);
        await expect(primary.getByRole("link", { name, exact: true }), sel).toHaveAttribute("aria-current", kind);
        await expect(primary.locator("[aria-current]")).toHaveCount(1);
      }
      for (const sel of ['[data-nav-section="education"]', '[data-nav-section="certifications"]', 'section[aria-label="Contact"]']) {
        await scrollToSection(page, sel);
        await expect(primary.getByRole("button", { name: /^More/ }), sel).toHaveAttribute("aria-current", "true");
      }
      // The glide indicator sits inside the capsule.
      const [ind, cap] = await page.evaluate(() => [document.querySelector(".nav-indicator")!.getBoundingClientRect().toJSON(), document.querySelector("[data-island]")!.getBoundingClientRect().toJSON()]);
      expect(ind.left).toBeGreaterThanOrEqual(cap.left);
      expect(ind.right).toBeLessThanOrEqual(cap.right);
    });
  }

  test("dedicated routes highlight their owner", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    const primary = page.getByRole("navigation", { name: "Primary" });
    for (const [path, name] of [["/about", "About"], ["/experience", "Experience"], ["/projects", "Projects"], ["/projects/aegis-ai", "Projects"], ["/achievements", "Achievements"]]) {
      await page.goto(path);
      await expect(primary.getByRole("link", { name, exact: true }), path).toHaveAttribute("aria-current", "page");
    }
    for (const path of ["/education", "/certifications", "/lab", "/contact"]) {
      await page.goto(path);
      await expect(primary.getByRole("button", { name: /^More/ }), path).toHaveAttribute("aria-current", "true");
      await primary.getByRole("button", { name: /^More/ }).click();
      await expect(page.locator("#more-menu").locator("[aria-current='page']")).toHaveCount(1);
      await page.keyboard.press("Escape");
      await expect(page.locator("#more-menu")).toBeHidden();
    }
    await page.goto("/ask");
    await expect(primary.locator("[aria-current]")).toHaveCount(0);
  });

  test("More menu lists the secondary destinations, including Tableau Public", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/projects");
    await page.getByRole("button", { name: /^More/ }).click();
    const menu = page.locator("#more-menu");
    for (const name of ["Education", "Certifications", "Lab", "Contact"]) await expect(menu.getByRole("link", { name, exact: true })).toBeVisible();
    await expect(menu.getByRole("link", { name: /Tableau Public/ })).toHaveAttribute("href", TABLEAU);
    const [m, vw] = await page.evaluate(() => [document.getElementById("more-menu")!.getBoundingClientRect().toJSON(), innerWidth]);
    expect(m.right).toBeLessThanOrEqual(vw);
  });

  for (const width of WIDTHS) {
    test(`homepage island keeps every control inside at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto("/");
      expect(await overflowing(page)).toEqual([]);
      await page.evaluate(() => window.scrollTo(0, 1500));
      await page.waitForTimeout(900);
      expect(await overflowing(page)).toEqual([]);
      await expect(page.getByRole("group", { name: "Portfolio view" })).toBeVisible();
    });
  }
});

test.describe("spacing", () => {
  for (const v of ["quick", "detailed"] as const) {
    test(`consistent gaps between consecutive sections (${v})`, async ({ page }) => {
      for (const width of [375, 768, 1440]) {
        await page.setViewportSize({ width, height: 900 });
        await page.goto(`/?view=${v}`);
        const r = await page.evaluate(() => {
          const chapter = parseFloat(getComputedStyle(document.querySelector("main > section.section:not(.section-tight)")!).paddingTop);
          const secs = [...document.querySelectorAll<HTMLElement>("main > section")].filter((s) => s.offsetParent !== null);
          const gaps = secs.slice(1).map((s, i) => {
            const prevBottom = secs[i].getBoundingClientRect().bottom;
            // Gap from the previous section's content to this section's first content.
            return { label: s.getAttribute("aria-label"), tight: s.classList.contains("section-tight"), gap: s.getBoundingClientRect().top - prevBottom, pad: parseFloat(getComputedStyle(s).paddingTop), pb: parseFloat(getComputedStyle(secs[i]).paddingBottom) };
          });
          return { chapter, gaps, overflow: document.documentElement.scrollWidth - innerWidth };
        });
        for (const g of r.gaps) {
          expect(Math.abs(g.gap), `${g.label} adjacency at ${width}`).toBeLessThanOrEqual(1);
          expect(g.pb, `${g.label}'s neighbour adds no bottom padding at ${width}`).toBe(0);
          // The short Approach statement sits closer to the hero by design.
          if (g.tight) expect(g.pad, `${g.label} uses the tight gap at ${width}`).toBeLessThan(r.chapter);
          else expect(Math.abs(g.pad - r.chapter), `${g.label} uses the chapter gap at ${width}`).toBeLessThanOrEqual(1);
        }
        expect(r.overflow).toBeLessThanOrEqual(1);
      }
    });
  }

  test("Quick View is substantially shorter than Detailed View", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/?view=quick");
    const quick = await page.evaluate(() => document.documentElement.scrollHeight);
    await page.goto("/?view=detailed");
    const detailed = await page.evaluate(() => document.documentElement.scrollHeight);
    expect(quick).toBeLessThan(detailed * 0.75);
  });
});

test.describe("Tableau Public", () => {
  test("is linked from contact, toolkit, footer, More menu and the Lab with the exact URL", async ({ page, request }) => {
    await page.goto("/");
    const contact = visible(page, "Contact").getByRole("link", { name: /^Tableau Public/ });
    await expect(contact).toHaveAttribute("href", TABLEAU);
    await expect(contact).toHaveAttribute("target", "_blank");
    await expect(contact).toHaveAccessibleName(/Tableau Public\s?: explore my data visualizations/);
    await expect(page.locator("#tools").getByRole("link", { name: /View my Tableau work/ })).toHaveAttribute("href", TABLEAU);
    await expect(page.locator("footer").getByRole("link", { name: /Tableau Public/ })).toHaveAttribute("href", TABLEAU);
    expect((await request.get("/tech/tableau.svg")).status()).toBe(200);
    await page.goto("/lab");
    const vizzes = page.locator('section[aria-labelledby="tableau-heading"] li a');
    await expect(vizzes).toHaveCount(3);
    for (const a of await vizzes.all()) await expect(a).toHaveAttribute("href", /^https:\/\/public\.tableau\.com\/app\/profile\/sreevarshan\.sathiyamurthy\/viz\//);
    await expect(page.getByRole("link", { name: /Explore my data visualizations/ })).toHaveAttribute("href", TABLEAU);
  });
});
