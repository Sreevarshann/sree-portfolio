import { expect, test } from "@playwright/test";
import { projects } from "../../src/content/projects";

/** Public text must not contain em dashes (U+2014) or en dashes (U+2013). */
const DASH = /[—–]/;
const ROUTES = [
  "/?view=quick",
  "/?view=detailed",
  "/about",
  "/experience",
  "/projects",
  ...projects.map((p) => `/projects/${p.slug}`),
  "/achievements",
  "/education",
  "/certifications",
  "/lab",
  "/contact",
  "/ask",
  "/projects/does-not-exist",
];

test.describe("no em or en dashes in public content", () => {
  test.skip(({ isMobile }) => isMobile, "Same markup on every device; desktop covers it.");

  for (const route of ROUTES) {
    test(route, async ({ page }) => {
      await page.goto(route);
      const found = await page.evaluate((src) => {
        const re = new RegExp(src);
        const out: string[] = [];
        const check = (where: string, text: string | null | undefined) => {
          if (text && re.test(text)) out.push(`${where}: ${text.slice(Math.max(0, text.search(re) - 40), text.search(re) + 40)}`);
        };
        check("title", document.title);
        document.querySelectorAll("meta[content]").forEach((m) => check(`meta ${m.getAttribute("name") ?? m.getAttribute("property")}`, m.getAttribute("content")));
        // Full document text, including content hidden by the current view.
        check("text", document.body.textContent);
        document.querySelectorAll("[aria-label], [title], [alt], [placeholder]").forEach((el) => {
          for (const a of ["aria-label", "title", "alt", "placeholder"]) check(`${el.tagName.toLowerCase()}[${a}]`, el.getAttribute(a));
        });
        return out;
      }, DASH.source);
      expect(found, found.join("\n")).toEqual([]);
    });
  }

  test("web manifest and the AI assistant's visible copy", async ({ page, request }) => {
    expect(await (await request.get("/manifest.webmanifest")).text()).not.toMatch(DASH);
    await page.goto("/ask");
    const panel = page.locator("main");
    await expect(panel.getByText(/Hey! I'm Sree's AI assistant/)).toBeVisible();
    expect(await panel.textContent()).not.toMatch(DASH);
    // Ask a starter question. Without a model key (local and CI) this shows the
    // fallback copy; with a key (production) a real streamed answer, which the
    // stream normalizer must keep dash-free. Either way, wait until it settles.
    const answers = page.locator("main .msg-in.gap-3"); // assistant messages
    const before = await answers.count();
    await page.getByRole("button", { name: "Who is Sree?" }).click();
    await expect
      .poll(async () => {
        if ((await answers.count()) <= before) return false;
        const status = (await page.getByRole("status").allTextContents()).join(" ");
        const fallback = await page.getByText(/can't write an answer right now/).count();
        return /Answer ready\./.test(status) || fallback > 0;
      }, { timeout: 45_000 })
      .toBe(true);
    expect(await panel.textContent()).not.toMatch(DASH);
  });
});
