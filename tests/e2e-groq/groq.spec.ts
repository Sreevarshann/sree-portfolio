import { expect, test, type Page } from "@playwright/test";

const STAND_IN = "http://127.0.0.1:4610";

async function openChat(page: Page) {
  await page.goto("/ask");
  await page.evaluate(() => sessionStorage.clear());
  await page.reload();
  return page.getByLabel("Ask a question about Sree");
}

async function ask(page: Page, q: string) {
  const input = page.getByLabel("Ask a question about Sree");
  await input.fill(q);
  await input.press("Enter");
}

test("health check reports the Groq provider as configured", async ({ request }) => {
  const res = await request.get("/api/chat");
  expect(await res.json()).toEqual({ ok: true, configured: true });
});

test("streams a real Groq-format answer with Markdown, one email link, sources and follow-ups", async ({ page, request }) => {
  await openChat(page);
  await ask(page, "Who is Sree?");
  // Streaming: text appears while generation is still running (Stop is shown).
  await expect(page.getByText(/Sreevarshan Sathiyamurthy/).first()).toBeVisible();
  await expect(page.getByRole("button", { name: "Stop generating" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Copy response" })).toBeVisible({ timeout: 15_000 });

  const answer = page.locator(".md").last();
  await expect(answer.locator("strong")).toHaveText("Sreevarshan Sathiyamurthy");
  await expect(answer.getByRole("link", { name: "his RightRev internship" })).toHaveAttribute("href", "/experience#rightrev");
  const mail = answer.getByRole("link", { name: "sreevarshan.dev@gmail.com" });
  await expect(mail).toHaveCount(1);
  await expect(mail).toHaveAttribute("href", "mailto:sreevarshan.dev@gmail.com");
  await expect(answer).not.toContainText("(mailto:");
  await expect(page.getByRole("list", { name: "Sources" }).getByRole("link", { name: "RightRev" })).toBeVisible();
  await expect(page.getByRole("list", { name: "Suggested follow-up questions" }).getByRole("button")).toHaveCount(3);
  await expect(page.locator("[data-fallback]")).toHaveCount(0);

  // The request reached Groq with the system prompt, retrieval context and the server-side key.
  const sent = await (await request.get(`${STAND_IN}/__last`)).json();
  expect(sent.authorized).toBe(true);
  expect(sent.model).toBe("openai/gpt-oss-120b");
  expect(sent.stream).toBe(true);
  expect(sent.messages[0].role).toBe("system");
  expect(sent.messages.at(-1).content).toMatch(/<portfolio_context>[\s\S]*Who Sreevarshan/);
});

test("keeps conversation history so follow-ups resolve", async ({ page, request }) => {
  await openChat(page);
  await ask(page, "What did he build at RightRev?");
  await expect(page.getByRole("button", { name: "Copy response" })).toBeVisible({ timeout: 15_000 });
  await ask(page, "What stack did he use there?");
  await expect(page.locator(".md").last().locator("li")).toHaveCount(3, { timeout: 15_000 });
  const sent = await (await request.get(`${STAND_IN}/__last`)).json();
  expect(sent.messages.map((m: { role: string }) => m.role)).toEqual(["system", "user", "assistant", "user"]);
  expect(sent.messages[1].content).toBe("What did he build at RightRev?");
  expect(sent.messages[3].content).toMatch(/Retrieval matched this question to: RightRev/);
});

test("a Groq rate limit shows the friendly busy state with Try again", async ({ page }) => {
  await openChat(page);
  await ask(page, "overload test");
  await expect(page.getByText(/getting a lot of questions/)).toBeVisible({ timeout: 15_000 });
  await expect(page.getByRole("button", { name: "Try again" })).toBeVisible();
  await expect(page.getByText(/AI model offline|rate_limit|429/)).toHaveCount(0);
});

test("an interrupted stream keeps the partial answer and offers a retry", async ({ page }) => {
  await openChat(page);
  await ask(page, "cut off test");
  await expect(page.getByRole("alert").filter({ hasText: "cut off" })).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText(/Sreevarshan is an engineer based in Boston/)).toBeVisible();
  await expect(page.getByRole("button", { name: "Try again" })).toBeVisible();
});

test("answers render in light theme too", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "light" });
  await openChat(page);
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await ask(page, "Who is Sree?");
  await expect(page.getByRole("button", { name: "Copy response" })).toBeVisible({ timeout: 15_000 });
  await expect(page.locator(".md").last()).toContainText("Boston-based engineer");
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
});
