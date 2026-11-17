import { expect, test, type Page } from "@playwright/test";

/** V11: the hero portrait reveal, achievement media, and the 320 to 6 counter. */

async function open(page: Page, path: string, scheme: "light" | "dark" = "dark", reducedMotion: "reduce" | "no-preference" = "no-preference") {
  await page.emulateMedia({ colorScheme: scheme, reducedMotion });
  await page.goto(path);
}

test.describe("hero portrait: Spider-Man reveal", () => {
  for (const scheme of ["light", "dark"] as const) {
    test(`shows the Spider-Man photo first and dissolves to the real photo (${scheme})`, async ({ page }, info) => {
      test.skip(info.project.name === "mobile", "Hover; the touch test covers phones.");
      await open(page, "/?view=quick", scheme);
      const fig = page.locator(".pswap").first();
      const top = fig.locator(".pswap-illustrated img");
      const bottom = fig.locator(".pswap-real img");
      await expect(top).toHaveAttribute("src", /spiderman-mask/);
      await expect(bottom).toHaveAttribute("src", /sree-real/);
      await expect(fig).toHaveAttribute("data-state", "illustrated");
      const box = await fig.boundingBox();
      // Dissolve timing: about 650 ms (opacity and the radial opening).
      const t = await fig.locator(".pswap-illustrated").evaluate((e) => getComputedStyle(e).transitionDuration);
      expect(t).toContain("0.65s");
      const btn = page.getByRole("button", { name: "Reveal Sree's portrait" });
      await btn.hover();
      await expect(fig).toHaveAttribute("data-state", "real");
      await expect(page.getByRole("button", { name: "Show Spider-Man portrait" })).toBeVisible();
      await expect.poll(() => fig.locator(".pswap-illustrated").evaluate((e) => getComputedStyle(e).opacity)).toBe("0");
      await page.mouse.move(2, 2);
      await expect(fig).toHaveAttribute("data-state", "illustrated");
      await expect.poll(() => fig.locator(".pswap-illustrated").evaluate((e) => getComputedStyle(e).opacity)).toBe("1");
      // No layout shift from the reveal: the frame keeps its size.
      const after = await fig.boundingBox();
      expect([after!.width, after!.height]).toEqual([box!.width, box!.height]);
    });
  }

  test("keyboard: Enter reveals, Space restores", async ({ page }, info) => {
    test.skip(info.project.name !== "desktop", "Keyboard path; desktop covers it.");
    await open(page, "/?view=quick");
    const btn = page.getByRole("button", { name: "Reveal Sree's portrait" });
    await btn.focus();
    await page.keyboard.press("Enter");
    await expect(page.locator(".pswap").first()).toHaveAttribute("data-state", "real");
    await page.keyboard.press(" ");
    await expect(page.locator(".pswap").first()).toHaveAttribute("data-state", "illustrated");
  });

  test("touch: first tap reveals, second restores", async ({ page }, info) => {
    test.skip(info.project.name !== "mobile", "Touch device only.");
    await open(page, "/?view=quick");
    const hit = page.locator(".pswap-hit").first();
    await hit.tap();
    await expect(page.locator(".pswap").first()).toHaveAttribute("data-state", "real");
    await hit.tap();
    await expect(page.locator(".pswap").first()).toHaveAttribute("data-state", "illustrated");
  });

  test("reduced motion: a quick crossfade, no opening mask", async ({ page }, info) => {
    test.skip(info.project.name !== "desktop", "Same CSS on every device.");
    await open(page, "/?view=quick", "dark", "reduce");
    const layer = page.locator(".pswap-illustrated").first();
    expect(await layer.evaluate((e) => getComputedStyle(e).maskImage)).toBe("none");
    // The site-wide reduced-motion rule makes the switch effectively instant.
    expect(parseFloat(await layer.evaluate((e) => getComputedStyle(e).transitionDuration))).toBeLessThanOrEqual(0.2);
  });
});

test.describe("achievement media", () => {
  test("the homepage never loads achievement video", async ({ page }) => {
    const mp4: string[] = [];
    page.on("request", (r) => r.url().endsWith(".mp4") && mp4.push(r.url()));
    await open(page, "/?view=detailed");
    await page.evaluate(async () => { for (let y = 0; y < document.documentElement.scrollHeight; y += 600) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 40)); } });
    expect(await page.locator("video").count()).toBe(0);
    expect(mp4).toEqual([]);
  });

  test("SAUVC: the task-pass video first, then its own photos", async ({ page }) => {
    await open(page, "/achievements");
    const media = page.locator("#sauvc .ach-media");
    const video = media.locator("video");
    await expect(video).toHaveAttribute("poster", /task-pass-poster\.webp$/);
    await expect(video).toHaveAttribute("preload", "none");
    expect(await video.evaluate((v) => (v as HTMLVideoElement).muted && (v as HTMLVideoElement).playsInline)).toBe(true);
    await media.scrollIntoViewIfNeeded();
    await expect.poll(() => video.getAttribute("src")).toMatch(/task-pass-(720|1080)\.mp4$/);
    // Controls: play or pause, and sound.
    await expect(media.getByRole("button", { name: /Play video|Pause video/ }).first()).toBeVisible();
    await expect(media.getByRole("button", { name: "Turn sound on" })).toBeVisible();
    const ids = await media.locator(".ach-thumb").evaluateAll((els) => els.map((e) => e.getAttribute("data-media-id")));
    expect(ids).toEqual(["sauvc-team", "sauvc-auv", "sauvc-opening"]);
    await expect(media).toContainText("Task-pass run in the competition pool");
    expect(await media.locator("img[src*='/google/']").count()).toBe(0);
  });

  test("SAUVC video: a play button when autoplay is unavailable, and it pauses when scrolled away", async ({ page }, info) => {
    test.skip(info.project.name !== "desktop", "Player logic is the same everywhere.");
    await open(page, "/achievements");
    const media = page.locator("#sauvc .ach-media");
    await media.scrollIntoViewIfNeeded();
    // Either it is playing (muted autoplay) or the large play button is offered.
    const playing = await media.locator("video").evaluate((v) => !(v as HTMLVideoElement).paused);
    if (!playing) await expect(media.getByRole("button", { name: "Play video" }).first()).toBeVisible();
    await page.locator("#google-mlops-expo").scrollIntoViewIfNeeded();
    await expect.poll(() => media.locator("video").evaluate((v) => (v as HTMLVideoElement).paused)).toBe(true);
  });

  test("Google: four real photos, no video player, and a full-frame lightbox", async ({ page }) => {
    await open(page, "/achievements");
    const media = page.locator("#google-mlops-expo .ach-media");
    await media.scrollIntoViewIfNeeded();
    expect(await media.locator("video").count()).toBe(0);
    const thumbs = media.locator(".ach-thumb");
    await expect(thumbs).toHaveCount(4);
    expect(await thumbs.evaluateAll((els) => els.map((e) => e.getAttribute("data-media-id")))).toEqual(["google-charlie-demo", "google-team", "google-opening", "google-badge"]);
    expect(await media.locator("img[src*='/sauvc/']").count()).toBe(0);
    // The badge photo is the privacy-safe derivative.
    await expect(media.getByRole("button", { name: /QR code and host name obscured/ })).toBeVisible();

    await thumbs.nth(1).click();
    const dialog = page.getByRole("dialog", { name: /Photo 2 of 4: Event participants at the Google MLOps Expo/ });
    await expect(dialog).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.classList.contains("lightbox-open"))).toBe(true);
    await page.keyboard.press("ArrowRight");
    await expect(page.getByRole("dialog", { name: /Photo 3 of 4: Google MLOps Expo opening session/ })).toBeVisible();
    await page.keyboard.press("ArrowLeft");
    await page.keyboard.press("ArrowLeft");
    await expect(page.getByRole("dialog", { name: /Photo 1 of 4: Demonstrating Charlie/ })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.locator("dialog.lightbox[open]")).toHaveCount(0);
    await expect.poll(() => page.evaluate(() => document.documentElement.classList.contains("lightbox-open"))).toBe(false);
    await expect(thumbs.nth(1)).toBeFocused();
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
  });
});

test.describe("ranking counter: 320 to 6, never clipped", () => {
  const VALUES = [320, 300, 250, 200, 150, 100, 99, 50, 10, 6];
  for (const route of ["/?view=quick", "/achievements"]) {
    test(`every value stays inside its box and card on ${route}`, async ({ page }, info) => {
      test.skip(info.project.name !== "desktop", "Widths set explicitly.");
      test.setTimeout(120_000);
      const bad: string[] = [];
      for (const scheme of ["light", "dark"] as const) {
        for (const width of [320, 375, 390, 430, 768, 1024, 1440, 1920]) {
          await page.setViewportSize({ width, height: 900 });
          await open(page, route, scheme, "reduce");
          const box = page.locator(".rank-counter").first();
          await box.scrollIntoViewIfNeeded();
          for (const v of VALUES) {
            const r = await box.evaluate((el, v) => {
              el.setAttribute("data-counting", "");
              const run = el.querySelector<HTMLElement>(".rank-run")!;
              run.textContent = String(v);
              const a = run.getBoundingClientRect();
              const b = el.getBoundingClientRect();
              const card = el.closest(".ach-card, section")!.getBoundingClientRect();
              const visible = getComputedStyle(run).visibility === "visible";
              return { ok: visible && a.left >= b.left - 0.5 && a.right <= b.right + 0.5 && a.left >= card.left && a.right <= card.right, a: Math.round(a.width), b: Math.round(b.width) };
            }, v);
            if (!r.ok) bad.push(`${scheme} ${width}px ${v}: run ${r.a}px in box ${r.b}px`);
          }
        }
      }
      expect(bad).toEqual([]);
    });
  }

  test("in light mode the running count is painted (its own text fill)", async ({ page }, info) => {
    test.skip(info.project.name !== "desktop", "Same CSS everywhere.");
    await open(page, "/?view=quick", "light", "reduce");
    const clip = await page.locator(".rank-counter .rank-run").first().evaluate((e) => getComputedStyle(e).backgroundClip);
    expect(clip).toBe("text");
  });
});
