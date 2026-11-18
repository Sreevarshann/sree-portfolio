import { expect, test, type Page, type Route } from "@playwright/test";

/** V12: interaction polish, the Skill Explorer and the AI hand-off. */

const fakeAnswer = (text: string) =>
  [
    { type: "sourceMap", items: [{ id: "S1", label: "Snowflake (Explore My Stack)", href: "/?stack=Snowflake#tools" }] },
    { type: "delta", text },
    { type: "suggestions", items: [] },
    { type: "done" },
  ]
    .map((e) => JSON.stringify(e))
    .join("\n") + "\n";

/** Captures /api/chat request bodies and answers with a canned stream (no model call in tests). */
async function captureChat(page: Page) {
  const bodies: Record<string, unknown>[] = [];
  await page.route("**/api/chat", async (route: Route) => {
    if (route.request().method() !== "POST") return route.continue();
    bodies.push(route.request().postDataJSON());
    await route.fulfill({ status: 200, contentType: "application/x-ndjson", body: fakeAnswer("He used Snowflake at RightRev [S1].") });
  });
  return bodies;
}

test.describe("portrait hint and labels", () => {
  test("desktop: a readable hint under the photo, its notch pointing up at the image", async ({ page }, info) => {
    test.skip(info.project.name !== "desktop", "Pointer layout.");
    await page.goto("/");
    // V13: the hint appears once the identity intro settles on the real photo.
    await expect(page.locator('.pswap[data-intro="done"]')).toHaveCount(1, { timeout: 15_000 });
    const note = page.locator(".pswap-note").first();
    await expect(note).toHaveText(/Hover to see Spider-Man/);
    await expect(note.locator(".pswap-note-touch-spider")).toBeHidden();
    const g = await page.evaluate(() => {
      const r = (s: string) => document.querySelector(s)!.getBoundingClientRect();
      const notch = r(".pswap-note-notch");
      return { note: r(".pswap-note"), notch, photo: r(".pswap-photo"), print: r(".pswap-print"), size: parseFloat(getComputedStyle(document.querySelector(".pswap-note")!).fontSize), pe: getComputedStyle(document.querySelector(".pswap-note")!).pointerEvents };
    });
    expect(g.size).toBeGreaterThanOrEqual(15);
    expect(g.pe).toBe("none");
    const tipX = g.notch.left + g.notch.width / 2;
    // The notch sits on the hint's top edge, under the photo, horizontally inside it: it points up at the image.
    expect(tipX).toBeGreaterThan(g.photo.left + g.photo.width * 0.25);
    expect(tipX).toBeLessThan(g.photo.right - g.photo.width * 0.25);
    expect(g.notch.top).toBeLessThan(g.note.top);
    expect(g.note.top).toBeGreaterThan(g.print.bottom - 12); // below the print (the print is tilted a few degrees)
    expect(g.note.top - g.photo.bottom).toBeLessThan(110);
    // While Spider-Man shows under the pointer, the hint steps aside (no contradictory instruction).
    await page.getByRole("button", { name: "Show Spider-Man portrait" }).hover();
    await expect.poll(() => note.evaluate((e) => getComputedStyle(e).opacity)).toBe("0");
  });

  test("phone: 'Tap to see Spider-Man', then 'Tap again for the real me'; never over the headline", async ({ page }, info) => {
    test.skip(info.project.name !== "mobile", "Touch layout.");
    await page.goto("/");
    await expect(page.locator('.pswap[data-intro="done"]')).toHaveCount(1, { timeout: 15_000 });
    const note = page.locator(".pswap-note").first();
    await expect(note).toHaveText(/Tap to see Spider-Man/);
    const size = await note.evaluate((e) => parseFloat(getComputedStyle(e).fontSize));
    expect(size).toBeGreaterThanOrEqual(14);
    const [n, h1] = await page.evaluate(() => [document.querySelector(".pswap-note")!.getBoundingClientRect().toJSON(), document.querySelector(".hero-id")!.getBoundingClientRect().toJSON()]);
    expect(n.bottom).toBeLessThanOrEqual(h1.top);
    expect(n.left).toBeGreaterThanOrEqual(0);
    expect(n.right).toBeLessThanOrEqual(page.viewportSize()!.width);
    await page.locator(".pswap-hit").first().tap();
    await expect(note).toHaveText(/Tap again for the real me/);
  });

  test("rapid hover in and out reverses smoothly and never sticks half-way", async ({ page }, info) => {
    test.skip(info.project.name !== "desktop", "Hover.");
    await page.goto("/");
    await expect(page.locator('.pswap[data-intro="done"]')).toHaveCount(1, { timeout: 15_000 });
    const btn = page.locator(".pswap-hit").first();
    const layer = page.locator(".pswap-illustrated").first();
    for (let i = 0; i < 4; i++) {
      await btn.hover();
      await page.waitForTimeout(150);
      await page.mouse.move(2, 2);
      await page.waitForTimeout(120);
    }
    // After the intro the real photo is the resting state.
    await expect(page.locator(".pswap").first()).toHaveAttribute("data-state", "real");
    await expect.poll(() => layer.evaluate((e) => getComputedStyle(e).opacity), { timeout: 3000 }).toBe("0");
  });

  test("every personal photo label says only Sree", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator(".pswap-caption").first()).toHaveText("Sree");
    await page.goto("/about");
    await expect(page.locator(".portrait figcaption").first()).toHaveText("Sree");
  });
});

test.describe("no onboarding hint (V14: one homepage)", () => {
  test.use({ storageState: { cookies: [], origins: [] } });
  test("never appears, on entry or on return", async ({ page }) => {
    await page.goto("/");
    await page.waitForTimeout(3500);
    await expect(page.locator(".coach")).toHaveCount(0);
    await expect(page.getByText("Want the full experience?")).toHaveCount(0);
    await page.goto("/projects");
    await page.goBack();
    await page.waitForTimeout(1500);
    await expect(page.locator(".coach")).toHaveCount(0);
  });
});

test.describe("SAUVC video without controls", () => {
  test("the frame is a keyboard-operable play/pause button", async ({ page }, info) => {
    test.skip(info.project.name !== "desktop", "Same player everywhere.");
    await page.goto("/achievements");
    const media = page.locator("#sauvc .ach-media");
    await media.scrollIntoViewIfNeeded();
    const video = media.locator("video");
    expect(await video.evaluate((v) => (v as HTMLVideoElement).controls)).toBe(false);
    const surface = media.locator(".ach-video-surface");
    const box = (await surface.boundingBox())!;
    const frame = (await media.locator(".ach-video-frame").boundingBox())!;
    expect(frame.width - box.width).toBeLessThanOrEqual(2); // the whole visible surface (inside the 1px border)
    await surface.focus();
    const before = await video.evaluate((v) => (v as HTMLVideoElement).paused);
    await page.keyboard.press("Enter");
    // Enter either pauses a playing video (visitor pause) or starts a paused one.
    await expect.poll(() => video.evaluate((v) => (v as HTMLVideoElement).dataset.userPaused)).toBe(before ? "0" : "1");
  });
});

test.describe("My AI launcher (one global entry point)", () => {
  test("phones: the logo only, visible from the first screen, while scrolling and after the intro", async ({ page }, info) => {
    test.skip(info.project.name !== "mobile", "Phones only.");
    await page.goto("/");
    const launcher = page.locator("button.ask-launcher");
    await expect(launcher).toHaveAccessibleName("My AI");
    await expect(launcher).toBeVisible();
    const box = async () => (await launcher.boundingBox())!;
    const first = await box();
    expect(first.width).toBeGreaterThanOrEqual(44);
    expect(first.width).toBeLessThanOrEqual(56);
    expect(Math.abs(first.width - first.height)).toBeLessThan(2);
    expect(await launcher.innerText()).toBe("");
    await expect(page.locator(".pswap").first()).toHaveAttribute("data-intro", "done", { timeout: 15_000 });
    for (const y of [600, 2400, 0]) {
      await page.evaluate((v) => window.scrollTo(0, v), y);
      await page.waitForTimeout(500);
      await expect(launcher).toBeVisible();
      expect((await box()).width).toBeLessThanOrEqual(56);
    }
    await launcher.click();
    await expect(page.getByRole("dialog", { name: "My AI assistant" })).toBeVisible();
  });

  test("desktop keeps the labelled floating launcher, visible from the start", async ({ page }, info) => {
    test.skip(info.project.name !== "desktop", "Desktop.");
    await page.goto("/");
    const launcher = page.locator("button.ask-launcher");
    await expect(launcher).toBeVisible();
    await expect(launcher).toContainText("My AI");
    await launcher.click();
    await expect(page.getByRole("dialog", { name: "My AI assistant" })).toBeVisible();
  });
});

test.describe("Skill Explorer", () => {
  async function openExplorer(page: Page) {
    await page.goto("/");
    const pill = page.locator(".tech-index summary");
    await pill.scrollIntoViewIfNeeded();
    await pill.click();
    return page.getByLabel("Search skills, tools, or technologies");
  }

  for (const [q, name] of [["React", "React"], ["dbt", "dbt"], ["Snowflake", "Snowflake"], ["Python", "Python"], ["PostgreSQL", "PostgreSQL"], ["LangGraph", "LangGraph"], ["React.js", "React"], ["DBT", "dbt"], ["Postgres", "PostgreSQL"], ["RAG", "Retrieval-augmented generation (RAG)"]] as const) {
    test(`"${q}" finds the verified ${name} skill with evidence`, async ({ page }, info) => {
      test.skip(info.project.name === "mobile" && q !== "Snowflake", "One phone check is enough.");
      const search = await openExplorer(page);
      await search.fill(q);
      const card = page.locator(".skill-card").first();
      await expect(card.locator(".skill-card-name")).toHaveText(name);
      await expect(card.locator('.skill-badge[data-kind="verified"]')).toBeVisible();
      const href = await card.locator(".skill-use-link").first().getAttribute("href");
      expect(href).toMatch(/^\/(experience|projects|achievements|education|certifications|ask|lab)?|^https:\/\//);
    });
  }

  test("Databricks shows related experience, never a verified match", async ({ page }) => {
    const search = await openExplorer(page);
    await search.fill("Databricks");
    await expect(page.locator('.skill-card[data-skill]')).toHaveCount(0);
    const card = page.locator('.skill-card[data-topic="databricks"]');
    await expect(card).toContainText("Looking for Databricks? Sree has worked with Snowflake and Apache Spark in related data engineering workflows.");
    await expect(card.locator('.skill-badge[data-kind="verified"]')).toHaveCount(0);
    await expect(card).toContainText("Not documented as direct experience");
    await expect(card.getByRole("link", { name: "RightRev" })).toHaveAttribute("href", "/experience#rightrev");
    await expect(page.getByRole("status").filter({ hasText: /related, not direct/ })).toHaveCount(1);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
  });

  test("no match: a clean empty state; clearing restores the index", async ({ page }) => {
    const search = await openExplorer(page);
    await search.fill("Java");
    await expect(page.locator(".skill-empty")).toContainText("No verified match found.");
    await expect(page.locator(".skill-card")).toHaveCount(0);
    await page.getByRole("button", { name: "Clear search" }).click();
    await expect(page.locator(".tech-index-row").first()).toBeVisible();
    await expect(search).toBeFocused();
  });

  test("category filters expose their state and explain hidden matches", async ({ page }) => {
    const search = await openExplorer(page);
    const ai = page.getByRole("button", { name: "AI & Machine Learning" });
    await ai.click();
    await expect(ai).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByRole("button", { name: "All", exact: true })).toHaveAttribute("aria-pressed", "false");
    await expect(page.locator(".tech-index-group")).toHaveCount(1);
    await search.fill("PostgreSQL");
    await expect(page.locator(".skill-hidden-note")).toContainText("in other categories");
    await page.getByRole("button", { name: "Show all categories" }).click();
    await expect(page.locator(".skill-card-name").first()).toHaveText("PostgreSQL");
  });

  test("search is local: typing makes no network requests", async ({ page }) => {
    const search = await openExplorer(page);
    const calls: string[] = [];
    page.on("request", (r) => r.url().includes("/api/") && calls.push(r.url()));
    await search.pressSequentially("Snowflake", { delay: 20 });
    await expect(page.locator(".skill-card").first()).toBeVisible();
    expect(calls).toEqual([]);
  });

  test("a deep link opens the explorer with the search", async ({ page }) => {
    await page.goto("/?stack=Postgres#tools");
    await expect(page.locator(".tech-index")).toHaveAttribute("open", "");
    await expect(page.getByLabel("Search skills, tools, or technologies")).toHaveValue("Postgres");
    await expect(page.locator(".skill-card-name").first()).toHaveText("PostgreSQL");
  });

  test("Ask AI about this hands the canonical id to the existing assistant", async ({ page }) => {
    const bodies = await captureChat(page);
    const search = await openExplorer(page);
    await search.fill("Snowflake");
    await page.locator('.skill-card[data-skill="snowflake"]').getByRole("button", { name: "Ask AI about this" }).click();
    await expect(page.getByRole("dialog", { name: "My AI assistant" })).toBeVisible();
    await expect.poll(() => bodies.length).toBe(1);
    const last = (bodies[0].messages as { content: string; context?: unknown }[]).at(-1)!;
    expect(last.content).toBe("How has Sree used Snowflake in his professional work?");
    expect(last.context).toEqual({ skills: ["snowflake"] });
    await expect(page.locator("#ask-sree-panel")).toContainText("He used Snowflake at RightRev");
  });

  test("related hand-off asks about transferable experience", async ({ page }) => {
    const bodies = await captureChat(page);
    const search = await openExplorer(page);
    await search.fill("Databricks");
    await page.getByRole("button", { name: "Ask AI about related experience" }).click();
    await expect.poll(() => bodies.length).toBe(1);
    const last = (bodies[0].messages as { content: string; context?: { topics?: string[] } }[]).at(-1)!;
    expect(last.content).toBe("How relevant is Sree's Snowflake and Apache Spark experience to Databricks-oriented work?");
    expect(last.context?.topics).toEqual(["databricks"]);
  });

  for (const scheme of ["dark", "light"] as const) {
    test(`results are legible in the ${scheme} theme`, async ({ page }, info) => {
      test.skip(info.project.name !== "desktop", "Same CSS everywhere.");
      await page.emulateMedia({ colorScheme: scheme });
      const search = await openExplorer(page);
      await search.fill("React");
      const [fg, bg] = await page.locator(".skill-card-name").first().evaluate((e) => [getComputedStyle(e).color, getComputedStyle(document.body).backgroundColor]);
      expect(fg).not.toBe(bg);
    });
  }
});

test.describe("one assistant (V15: no Recruiter Mode)", () => {
  test("no mode switch; a pasted job description is answered in the same chat", async ({ page }) => {
    const bodies = await captureChat(page);
    await page.goto("/ask");
    await expect(page.getByRole("button", { name: "Recruiter" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "General" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: /Compare a job description/ })).toHaveCount(0);
    const jd = "Data Engineer. Requirements: Python, SQL, Snowflake, Airflow, Docker and CI/CD. Nice to have: Kafka and Spark.";
    await page.getByLabel("Ask My AI about Sree").fill(jd);
    await page.keyboard.press("Enter");
    await expect.poll(() => bodies.length).toBe(1);
    expect(bodies[0].mode).toBeUndefined();
    expect((bodies[0].messages as { content: string }[]).at(-1)!.content).toBe(jd);
  });
});
