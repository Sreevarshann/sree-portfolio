import { expect, test, type Page } from "@playwright/test";
import { technologies } from "../../src/content/technologies";

const CREDLY = "https://www.credly.com/badges/baf259bc-66bf-44cc-ba50-85b92f12c31f";
const PDF = "/certificates/google-data-analytics-professional-certificate.pdf";

/** Relative luminance of an sRGB colour (0–1). */
const lum = (r: number, g: number, b: number) => {
  const c = [r, g, b].map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};

/**
 * For each logo in the primary marquee list: how much of it stands out from
 * the tile background in the current theme. Sprite logos are measured by
 * colour contrast; image logos by drawing them on a canvas filled with the
 * tile colour and counting visibly different pixels.
 */
async function logoVisibility(page: Page) {
  return page.evaluate(async () => {
    const parse = (c: string) => (c.match(/[\d.]+/g) ?? []).slice(0, 3).map(Number);
    const L = (r: number, g: number, b: number) => {
      const f = (v: number) => {
        const s = v / 255;
        return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
      };
      return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
    };
    const ratio = (a: number, b: number) => (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
    // Tiles are translucent over the page background; the page colour is what shows through.
    const bg = parse(getComputedStyle(document.body).backgroundColor);
    const bgL = L(bg[0], bg[1], bg[2]);
    const out: { name: string; kind: string; score: number }[] = [];
    for (const tile of document.querySelectorAll(".marquee-group:not([aria-hidden]) .tech-tile")) {
      const name = tile.querySelector(".tech-name")!.textContent!;
      const logo = tile.querySelector(".tech-logo")!;
      if (logo instanceof HTMLImageElement) {
        await logo.decode().catch(() => {});
        const canvas = document.createElement("canvas");
        canvas.width = canvas.height = 48;
        const ctx = canvas.getContext("2d")!;
        ctx.fillStyle = `rgb(${bg.join(",")})`;
        ctx.fillRect(0, 0, 48, 48);
        ctx.drawImage(logo, 0, 0, 48, 48);
        const data = ctx.getImageData(0, 0, 48, 48).data;
        let visible = 0;
        for (let i = 0; i < data.length; i += 4) if (ratio(L(data[i], data[i + 1], data[i + 2]), bgL) > 1.6) visible++;
        out.push({ name, kind: "file", score: visible / (48 * 48) });
      } else if (logo instanceof SVGElement) {
        const c = parse(getComputedStyle(logo).color);
        // A mark drawn over its own backdrop (JavaScript) is judged against that backdrop.
        const back = getComputedStyle(logo).backgroundImage.match(/rgb\([^)]*\)/)?.[0];
        const b = back ? parse(back) : bg;
        out.push({ name, kind: "sprite", score: ratio(L(c[0], c[1], c[2]), L(b[0], b[1], b[2])) });
      } else {
        const c = parse(getComputedStyle(logo).color);
        out.push({ name, kind: "text", score: ratio(L(c[0], c[1], c[2]), bgL) });
      }
    }
    return out;
  });
}

test.describe("technology logo audit", () => {
  test("every catalog technology appears once, named, with a logo", async ({ page }) => {
    await page.goto("/");
    const names = await page.locator(".marquee-group:not([aria-hidden]) .tech-name").allInnerTexts();
    expect(names.sort()).toEqual(technologies.map((t) => t.name).sort());
    // Every tile in the primary list carries a logo element.
    const withoutLogo = await page.$$eval(".marquee-group:not([aria-hidden]) .tech-tile", (ts) => ts.filter((t) => !t.querySelector(".tech-logo")).length);
    expect(withoutLogo).toBe(0);
  });

  test("every local logo asset is served as SVG and every sprite symbol exists", async ({ page, request }) => {
    await page.goto("/");
    const files = [...new Set(technologies.flatMap((t) => (t.logo.kind === "file" ? [t.logo.src] : [])))];
    for (const src of files) {
      const res = await request.get(src);
      expect(res.status(), src).toBe(200);
      expect(res.headers()["content-type"], src).toContain("image/svg+xml");
    }
    const sprite = await (await request.get("/tech-icons.svg")).text();
    for (const t of technologies) if (t.logo.kind === "sprite") expect(sprite, t.id).toContain(`<symbol id="${t.logo.id}"`);
    await page.locator(".tools-section").scrollIntoViewIfNeeded();
    await expect
      .poll(() => page.$$eval(".tech-marquee img", (imgs) => imgs.filter((i) => !(i as HTMLImageElement).complete || (i as HTMLImageElement).naturalWidth === 0).length), { timeout: 10_000 })
      .toBe(0);
  });

  for (const scheme of ["dark", "light"] as const) {
    test(`every logo is visible against the ${scheme} theme`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: scheme });
      await page.goto("/");
      await expect(page.locator("html")).toHaveAttribute("data-theme", scheme);
      await page.locator(".tools-section").scrollIntoViewIfNeeded();
      const vis = await logoVisibility(page);
      expect(vis.length).toBe(technologies.length);
      const weak = vis.filter((v) => (v.kind === "file" ? v.score < 0.08 : v.score < 1.6));
      expect(weak, JSON.stringify(weak)).toEqual([]);
    });
  }

  test("the four previously text-only tools now show their marks", async ({ page }) => {
    await page.goto("/");
    for (const [name, src] of [["SQL", "/tech/sql.svg"], ["dbt", "/tech/dbt.svg"], ["Power BI", "/tech/powerbi.svg"], ["Tableau", "/tech/tableau.svg"]]) {
      const tile = page.locator(".marquee-group:not([aria-hidden]) .tech-tile", { has: page.locator(".tech-name", { hasText: new RegExp(`^${name}$`) }) });
      await expect(tile.locator("img.tech-logo")).toHaveAttribute("src", src);
    }
  });
});

test.describe("Google Data Analytics certificate", () => {
  test("offers View credential (Credly) and View PDF, both opening in a new tab", async ({ page, request }) => {
    await page.goto("/certifications");
    const card = page.locator("article", { hasText: "Google Data Analytics Professional Certificate" });
    await expect(card).toContainText("Google");
    const cred = card.getByRole("link", { name: /^View credential/ });
    await expect(cred).toHaveAttribute("href", CREDLY);
    await expect(cred).toHaveAttribute("target", "_blank");
    await expect(cred).toHaveAttribute("rel", /noopener/);
    const pdf = card.getByRole("link", { name: /^View PDF/ });
    await expect(pdf).toHaveAttribute("href", PDF);
    await expect(pdf).toHaveAttribute("target", "_blank");
    const res = await request.get(PDF);
    expect(res.status()).toBe(200);
    expect(res.headers()["content-type"]).toContain("pdf");
    const body = (await res.body()).toString("latin1");
    expect(body.startsWith("%PDF-")).toBe(true);
    expect(body).not.toContain("tel:");
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
  });

  for (const scheme of ["dark", "light"] as const) {
    test(`certificate actions are legible in ${scheme} theme`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: scheme });
      await page.goto("/certifications");
      const card = page.locator("article", { hasText: "Google Data Analytics Professional Certificate" });
      for (const name of [/^View credential/, /^View PDF/]) {
        // Composite the (possibly translucent, oklab) button background over the page on a canvas.
        const [fg, bg] = await card.getByRole("link", { name }).evaluate((a) => {
          const canvas = document.createElement("canvas");
          canvas.width = canvas.height = 1;
          const ctx = canvas.getContext("2d")!;
          const px = (fill: string[]) => {
            ctx.clearRect(0, 0, 1, 1);
            for (const f of fill) {
              ctx.fillStyle = f;
              ctx.fillRect(0, 0, 1, 1);
            }
            return [...ctx.getImageData(0, 0, 1, 1).data].slice(0, 3);
          };
          const layers: string[] = [];
          for (let el: Element | null = a; el; el = el.parentElement) layers.unshift(getComputedStyle(el).backgroundColor);
          const back = px([getComputedStyle(document.body).backgroundColor, ...layers]);
          return [px([`rgb(${back.join(",")})`, getComputedStyle(a).color]), back];
        });
        const r = (Math.max(lum(fg[0], fg[1], fg[2]), lum(bg[0], bg[1], bg[2])) + 0.05) / (Math.min(lum(fg[0], fg[1], fg[2]), lum(bg[0], bg[1], bg[2])) + 0.05);
        expect(r, `${name} contrast`).toBeGreaterThanOrEqual(4.5);
      }
    });
  }
});
