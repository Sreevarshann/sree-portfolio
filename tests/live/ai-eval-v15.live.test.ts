// @vitest-environment node
/**
 * Live half of the focused V15 My AI evaluation (tests/ai-eval/cases-v15.ts)
 * against a running site with a real model. Not part of `npm test`; run with:
 *   ASK_AI_LIVE_URL=https://www.sreevarshan.com npm run test:live -- ai-eval-v15
 * Set ASK_AI_EVAL_REPORT=docs/v15/ai-eval.md to write a Markdown report.
 * Model calls are spaced 20 s apart by default (ASK_AI_LIVE_PAUSE_MS), since
 * the provider throttles back-to-back requests.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import { V15_CASES, wordCount, type V15Case } from "../ai-eval/cases-v15";
import { ALWAYS_NOT } from "../ai-eval/cases";
import type { SourceRef, StreamEvent } from "@/lib/ai/protocol";
import { resolveCitations } from "@/lib/ai/citations";
import { planAnswer } from "@/lib/ai/plan";
import { groundingText, unsupportedClaims } from "@/lib/ai/validate";
import { PROMPT_VERSION } from "@/lib/ai/prompt";
import type { Turn } from "@/lib/ai/retrieve";

const BASE = process.env.ASK_AI_LIVE_URL;
const REPORT = process.env.ASK_AI_EVAL_REPORT;
const PAUSE_MS = Number(process.env.ASK_AI_LIVE_PAUSE_MS ?? 20_000);

type Row = { c: V15Case; ms: number; words: number; answer: string; failures: string[] };
const rows: Row[] = [];

async function ask(messages: Turn[]) {
  const t0 = Date.now();
  const res = await fetch(`${BASE}/api/chat`, {
    method: "POST",
    headers: { "content-type": "application/json", origin: BASE! },
    body: JSON.stringify({ messages }),
  });
  const events = (await res.text()).trim().split("\n").filter(Boolean).map((l) => JSON.parse(l) as StreamEvent);
  const map = (events.find((e) => e.type === "sourceMap") as { items: SourceRef[] } | undefined)?.items ?? [];
  const answer = events.map((e) => (e.type === "delta" ? e.text : "")).join("");
  return { status: res.status, events, map, answer, ms: Date.now() - t0 };
}

function check(c: V15Case, r: Awaited<ReturnType<typeof ask>>, turns: Turn[]): string[] {
  const f: string[] = [];
  if (r.status !== 200) f.push(`HTTP ${r.status}`);
  if (r.events.some((e) => e.type === "fallback")) f.push("fallback instead of an answer");
  if (r.events.some((e) => e.type === "error")) f.push("error event");
  if (!r.answer.trim()) f.push("empty answer");
  const words = wordCount(r.answer);
  if (c.maxWords && words > c.maxWords) f.push(`too long (${words} > ${c.maxWords} words)`);
  if (c.minWords && words < c.minWords) f.push(`too short (${words} < ${c.minWords} words)`);
  for (const re of c.must ?? []) if (!re.test(r.answer)) f.push(`missing ${re}`);
  for (const re of [...(c.mustNot ?? []), ...ALWAYS_NOT]) if (re.test(r.answer)) f.push(`contains ${re}`);
  const plan = planAnswer(turns);
  if (plan.kind === "model") {
    if (c.cites && !resolveCitations(r.answer, r.map).length) f.push("no citation");
    const unsupported = unsupportedClaims(r.answer, groundingText(plan.chunks));
    if (unsupported.length) f.push(`unsupported: ${unsupported.map((u) => `${u.kind}:${u.value}`).join(", ")}`);
    if (/\]\((?:\/|https?:)|https?:\/\//.test(r.answer)) f.push("model wrote a link");
  }
  return f;
}

describe.skipIf(!BASE)("My AI live evaluation, V15 (20 cases)", () => {
  it.each(V15_CASES)("#$n $q", async (c) => {
    const turns: Turn[] = [...(c.history ?? []), { role: "user", content: c.q }];
    if (!c.quick) await new Promise((r) => setTimeout(r, PAUSE_MS));
    const r = await ask(turns);
    const failures = check(c, r, turns);
    rows.push({ c, ms: r.ms, words: wordCount(r.answer), answer: r.answer, failures });
    expect(failures, `${c.q}\n---\n${r.answer}`).toEqual([]);
  }, 120_000);

  afterAll(() => {
    if (!REPORT || !rows.length) return;
    const passed = rows.filter((r) => !r.failures.length).length;
    const out = [
      `# My AI evaluation (V15)`,
      ``,
      `Prompt ${PROMPT_VERSION}, run ${new Date().toISOString().slice(0, 10)} against ${BASE}. Cases: tests/ai-eval/cases-v15.ts.`,
      ``,
      `**${passed} of ${rows.length} cases passed.**`,
      ``,
      `| # | Question | Words | Result |`,
      `| --- | --- | --- | --- |`,
      ...rows.sort((a, b) => a.c.n - b.c.n).map((r) => `| ${r.c.n} | ${r.c.q} | ${r.words} | ${r.failures.length ? r.failures.join("; ") : "pass"} |`),
      ``,
      `## Answers`,
      ``,
      ...rows.flatMap((r) => [`### ${r.c.n}. ${r.c.q}`, ``, ...r.answer.trim().split("\n").map((l) => `> ${l}`), ``]),
    ];
    mkdirSync(dirname(REPORT), { recursive: true });
    writeFileSync(REPORT, out.join("\n"));
  });
});
