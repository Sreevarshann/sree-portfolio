import { expect, test } from "@playwright/test";

/** Average RGB luminance of a screenshot region (0 = black, 255 = white). */
async function regionLuma(page: import("@playwright/test").Page, clip: { x: number; y: number; width: number; height: number }) {
  const png = await page.screenshot({ clip });
  return page.evaluate(async (b64) => {
    const img = new Image();
    img.src = "data:image/png;base64," + b64;
    await img.decode();
    const c = document.createElement("canvas");
    c.width = img.width;
    c.height = img.height;
    const ctx = c.getContext("2d")!;
    ctx.drawImage(img, 0, 0);
    const d = ctx.getImageData(0, 0, c.width, c.height).data;
    let sum = 0;
    for (let i = 0; i < d.length; i += 4) sum += 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2];
    return sum / (d.length / 4);
  }, png.toString("base64"));
}

test.describe("hero theme regression", () => {
  for (const scheme of ["dark", "light"] as const) {
    test(`hero background matches ${scheme} theme on direct load and after the field starts`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: scheme });
      await page.goto("/");
      await expect(page.locator("html")).toHaveAttribute("data-theme", scheme);
      await page.waitForTimeout(2500); // WebGL field initialises on idle
      const vw = page.viewportSize()!.width;
      const luma = await regionLuma(page, { x: Math.round(vw * 0.55), y: 90, width: Math.round(vw * 0.3), height: 60 });
      if (scheme === "dark") expect(luma).toBeLessThan(60);
      else expect(luma).toBeGreaterThan(200);
      const h1 = await page.locator("h1").evaluate((el) => getComputedStyle(el).color);
      expect(h1).toBe(scheme === "dark" ? "rgb(238, 241, 246)" : "rgb(13, 17, 23)");
    });
  }

  test("theme switch keeps hero and sections consistent", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "dark" });
    await page.goto("/");
    await page.getByRole("button", { name: /Switch to light theme/ }).click();
    await expect.poll(() => page.evaluate(() => getComputedStyle(document.body).backgroundColor)).toBe("rgb(245, 246, 248)");
    await page.waitForTimeout(800);
    const vw = page.viewportSize()!.width;
    expect(await regionLuma(page, { x: Math.round(vw * 0.55), y: 90, width: Math.round(vw * 0.3), height: 60 })).toBeGreaterThan(200);
  });
});

test("CSP does not upgrade localhost requests (Safari regression)", async ({ request }) => {
  const csp = (await request.get("/")).headers()["content-security-policy"];
  expect(csp).not.toContain("upgrade-insecure-requests");
});

test("no broken images on content pages", async ({ page }) => {
  for (const path of ["/", "/experience", "/education", "/certifications", "/projects", "/projects/nexus-ai", "/contact"]) {
    await page.goto(path);
    await page.evaluate(async () => {
      for (let y = 0; y < document.body.scrollHeight; y += 600) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 40));
      }
    });
    await page.waitForLoadState("networkidle");
    const broken = await page.$$eval("img", (imgs) =>
      imgs.filter((i) => i.complete && i.naturalWidth === 0 && getComputedStyle(i).display !== "none").map((i) => i.getAttribute("src")),
    );
    expect(broken, path).toEqual([]);
  }
});

test("floating nav condenses on scroll and the indicator follows the page", async ({ page, isMobile }) => {
  test.skip(isMobile, "desktop nav");
  await page.goto("/projects");
  const capsule = page.locator("header .glass").first();
  const tall = (await capsule.boundingBox())!.height;
  await page.mouse.wheel(0, 1200);
  await expect.poll(async () => (await capsule.boundingBox())!.height).toBeLessThan(tall);
  const active = page.getByRole("navigation", { name: "Primary" }).getByRole("link", { name: "Projects" });
  await expect(active).toHaveAttribute("aria-current", "page");
  // The indicator glides (560ms spring) to its target; wait for it to settle.
  await expect
    .poll(async () => {
      const ind = await page.locator(".nav-indicator").boundingBox();
      const link = await active.boundingBox();
      return Math.abs(ind!.x - link!.x);
    })
    .toBeLessThan(3);
});

test("mobile menu closes by tapping outside", async ({ page, isMobile }) => {
  test.skip(!isMobile, "mobile only");
  await page.goto("/about");
  await page.getByRole("button", { name: "Open menu" }).click();
  await expect(page.getByRole("dialog", { name: "Site menu" })).toBeVisible();
  await page.mouse.click(20, 700);
  await expect(page.getByRole("dialog", { name: "Site menu" })).toBeHidden();
});

test("Sree AI greets with the four starter prompts and opens with Ctrl+K", async ({ page }) => {
  await page.goto("/education");
  await page.waitForLoadState("networkidle");
  await page.keyboard.press("Control+k");
  const panel = page.getByRole("dialog", { name: /Sree AI assistant/ });
  await expect(panel).toBeVisible();
  // The chat bundle is lazy-loaded on first open; allow for a cold load under parallel test runs.
  await expect(panel.getByText("Hey! I'm Sree's AI assistant. Ask me about his experience, projects, achievements, or what he's building.")).toBeVisible({ timeout: 15_000 });
  for (const q of ["Who is Sree?", "What did he build at RightRev?", "What is his most impressive project?", "What did he achieve at the Singapore AUV Challenge?"]) {
    await expect(panel.getByRole("button", { name: new RegExp(q.replace("?", "\\?")) })).toBeVisible();
  }
  await panel.getByRole("button", { name: /What is his most impressive project\?/ }).click();
  await expect(panel.getByText(/can't write an answer right now/)).toBeVisible();
  await panel.getByRole("button", { name: "Close Sree AI" }).click();
  await expect(panel).toBeHidden();
});

test("launcher never covers the contact buttons", async ({ page }) => {
  await page.goto("/contact");
  const launcher = page.getByRole("button", { name: /^Ask My AI$/ });
  for (const name of [/Write an email/, /Copy address/]) {
    const btn = page.getByRole("button", { name }).or(page.getByRole("link", { name }));
    await btn.first().scrollIntoViewIfNeeded();
    const a = (await btn.first().boundingBox())!;
    const b = (await launcher.boundingBox())!;
    const overlap = !(a.x + a.width < b.x || b.x + b.width < a.x || a.y + a.height < b.y || b.y + b.height < a.y);
    expect(overlap, String(name)).toBe(false);
  }
});

test("portrait slot renders (photo or labelled placeholder)", async ({ page, isMobile }) => {
  await page.goto("/about");
  const photo = page.getByRole("img", { name: /Portrait of Sreevarshan|Portrait placeholder/ }).first();
  await expect(photo).toBeVisible();
  if (!isMobile) {
    await page.goto("/");
    await expect(page.getByRole("img", { name: /Portrait of Sreevarshan|Portrait placeholder/ }).last()).toBeVisible();
  }
});

test("achievements link to Sree's LinkedIn proof posts", async ({ page }) => {
  const posts = [
    "https://www.linkedin.com/posts/sreevarshansathiyamurthy_sauvc2022-throwback-teamvaruna-ugcPost-7244625106197512192-ilNL/",
    "https://www.linkedin.com/posts/sreevarshansathiyamurthy_mlops-machinelearning-dataengineering-ugcPost-7408534309613031425-L_Bj/",
  ];
  for (const path of ["/achievements", "/"]) {
    await page.goto(path);
    for (const href of posts) {
      const link = page.locator(`a[href="${href}"]`).first();
      await expect(link).toHaveAttribute("target", "_blank");
      await expect(link).toHaveAttribute("rel", /noopener/);
    }
    // No link may be nested inside another link.
    expect(await page.locator("a a").count()).toBe(0);
  }
  await page.goto("/achievements");
  await expect(page.locator("#sauvc")).toContainText("130+");
  await expect(page.locator("#sauvc")).toContainText("teams shortlisted");
});
