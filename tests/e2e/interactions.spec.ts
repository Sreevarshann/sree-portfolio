import { expect, test } from "@playwright/test";

test("navigation reaches every section (desktop nav or mobile menu)", async ({ page, isMobile }) => {
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  const targets = ["About", "Experience", "Projects", "Achievements", "Education", "Certifications", "Lab", "Contact"];
  for (const label of targets) {
    if (isMobile) {
      await page.getByRole("button", { name: "Menu" }).click();
      const menu = page.getByRole("dialog", { name: "Site menu" });
      await expect(menu).toBeVisible();
      await menu.getByRole("link", { name: label, exact: true }).click();
      await expect(menu).toBeHidden();
    } else {
      await page.getByRole("navigation", { name: "Primary" }).getByRole("link", { name: label, exact: true }).click();
    }
    await expect(page).toHaveURL(new RegExp(`/${label.toLowerCase()}$`));
    await expect(page.locator("h1:visible")).toHaveCount(1);
  }
});

test("mobile menu traps focus and closes with Escape", async ({ page, isMobile }) => {
  test.skip(!isMobile, "mobile only");
  await page.goto("/about");
  const btn = page.getByRole("button", { name: "Menu" });
  await btn.click();
  await expect(page.getByRole("dialog", { name: "Site menu" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog", { name: "Site menu" })).toBeHidden();
  await expect(btn).toBeFocused();
});

test("Sree AI opens, answers with an honest fallback without a key, and closes with Escape", async ({ page }) => {
  await page.goto("/about");
  const launcher = page.getByRole("button", { name: /^Ask My AI$/ });
  await launcher.click();
  const panel = page.getByRole("dialog", { name: /Sree AI assistant/ });
  await expect(panel).toBeVisible();
  const input = panel.getByLabel("Ask a question about Sree");
  await expect(input).toBeFocused();
  await input.fill("What did Sree work on at RightRev?");
  await input.press("Enter");
  await expect(panel.getByText("Search results · AI model offline")).toBeVisible();
  await expect(panel.getByRole("link", { name: /Software & Data Engineer Intern at RightRev/ }).first()).toBeVisible();
  await expect(panel.getByRole("button", { name: "Copy response" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(panel).toBeHidden();
});

test("suggested question runs from the full-page Ask view; clear resets", async ({ page }) => {
  await page.goto("/ask");
  await page.getByRole("button", { name: "How can I contact Sree?" }).click();
  await expect(page.getByRole("link", { name: "sreevarshan.dev@gmail.com" }).first()).toBeVisible();
  await page.getByRole("button", { name: "Clear conversation" }).click();
  await expect(page.getByText(/Hey, I'm Sree's AI/)).toBeVisible();
  await expect(page.getByRole("button", { name: /Who is Sree\?/ })).toBeVisible();
});

test("chat API validates input and labels fallback answers", async ({ request }) => {
  const bad = await request.post("/api/chat", { data: { messages: [{ role: "user", content: "x".repeat(1200) }] } });
  expect(bad.status()).toBe(400);
  const ok = await request.post("/api/chat", { data: { messages: [{ role: "user", content: "What are Sree's certifications?" }] } });
  expect(ok.status()).toBe(200);
  const events = (await ok.text()).trim().split("\n").map((l) => JSON.parse(l));
  expect(events[0].type).toBe("fallback");
  expect(events[0].text).toContain("Certifications");
});

test("Lab charts load Plotly, respond to filters and offer data tables", async ({ page }) => {
  await page.goto("/lab");
  const tune = page.locator("#tunelab");
  await tune.scrollIntoViewIfNeeded();
  await expect(tune.locator(".js-plotly-plot")).toBeVisible({ timeout: 20_000 });
  await expect(tune.locator(".js-plotly-plot .trace.bars")).toHaveCount(2);
  await tune.getByRole("radio", { name: "Training minutes" }).click();
  await expect(tune.getByRole("radio", { name: "Training minutes" })).toHaveAttribute("aria-checked", "true");
  await expect(tune.locator(".js-plotly-plot .trace.bars")).toHaveCount(1);
  await tune.getByText("View data table").click();
  await expect(tune.getByRole("table")).toBeVisible();
  await expect(tune.getByRole("cell", { name: "63.3%" })).toBeVisible();

  const aegis = page.locator("#aegis");
  await aegis.scrollIntoViewIfNeeded();
  await expect(aegis.locator(".js-plotly-plot")).toBeVisible({ timeout: 20_000 });
  await aegis.getByRole("radio", { name: "Fraud" }).click();
  await expect(aegis.locator(".js-plotly-plot .trace.bars")).toHaveCount(1);
  await aegis.getByRole("radio", { name: "Confusion matrix" }).click();
  await expect(aegis.locator(".js-plotly-plot .hm")).toHaveCount(1);

  // Theme change re-renders charts with new colors.
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.getByRole("button", { name: /Switch to (light|dark) theme/ }).click();
  await expect(aegis.locator(".js-plotly-plot")).toBeVisible();
});

test("skills map shows evidence for the selected skill", async ({ page }) => {
  await page.goto("/about#skills");
  await page.getByRole("button", { name: "dbt", exact: true }).click();
  await expect(page.getByRole("button", { name: "dbt", exact: true })).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("#skills").getByRole("link", { name: "AEGIS AI" })).toBeVisible();
});

test("copy email button gives feedback", async ({ page, context, browserName }) => {
  test.skip(browserName !== "chromium");
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/contact");
  await page.getByRole("button", { name: "Copy address" }).click();
  await expect(page.getByRole("button", { name: /Copied/ })).toBeVisible();
});

test("reduced motion shows all content without animation", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  const hidden = await page.$$eval("[data-reveal]", (els) => els.filter((e) => getComputedStyle(e).opacity === "0").length);
  expect(hidden).toBe(0);
});
