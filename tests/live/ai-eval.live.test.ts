// @vitest-environment node
/**
 * Live half of the Ask My AI evaluation: the 47 cases of tests/ai-eval/cases.ts
 * against a running site with a real model. Not part of `npm test`; run with:
 *   ASK_AI_LIVE_URL=https://www.sreevarshan.com npm run test:live -- ai-eval
 * Set ASK_AI_EVAL_REPORT=docs/v14/ai-eval.md to write a Markdown report.
 *
 * Deterministic checks on every answer: length bounds, required and forbidden
 * patterns, no phone numbers, secrets, prompt text or dashes, citations only
 * from the answer's own source map, no claim the grounding facts don't
 * support, no fallback (the model answered), and response time.
 */
import { writeFileSync } from "node:fs";
import { afterAll, describe, expect, it } from "vitest";
import { ALWAYS_NOT, CASES, type EvalCase } from "../ai-eval/cases";
import type { SourceRef, StreamEvent } from "@/lib/ai/protocol";
import { resolveCitations } from "@/lib/ai/citations";
import { planAnswer } from "@/lib/ai/plan";
import { groundingText, unsupportedClaims } from "@/lib/ai/validate";
import { PROMPT_VERSION } from "@/lib/ai/prompt";
import type { Turn } from "@/lib/ai/retrieve";

const BASE = process.env.ASK_AI_LIVE_URL;
const REPORT = process.env.ASK_AI_EVAL_REPORT;
// Groq's free tier allows a few thousand tokens per minute; space model calls out.
const PAUSE_MS = Number(process.env.ASK_AI_LIVE_PAUSE_MS ?? 9_000);

type Row = { c: EvalCase; ms: number; answer: string; failures: string[] };
const rows: Row[] = [];

async function ask(messages: Turn[]) {
  const t0 = Date.now();
  const res = await fetch(`${BASE}/api/chat`, {
    method: "POST",
    headers: { "content-type": "application/json", origin: BASE! },
    body: JSON.stringify({ messages }),
  });
  const events = (await res.text()).trim().split("\n").filter(Boolean).map((l) => JSON.parse(l) as StreamEvent);
  const ms = Date.now() - t0;
  const map = (events.find((e) => e.type === "sourceMap") as { items: SourceRef[] } | undefined)?.items ?? [];
  const answer = events.map((e) => (e.type === "delta" ? e.text : "")).join("");
  return { status: res.status, events, map, answer, ms };
}

function check(c: EvalCase, r: Awaited<ReturnType<typeof ask>>, turns: Turn[]): string[] {
  const f: string[] = [];
  if (r.status !== 200) f.push(`HTTP ${r.status}`);
  if (r.events.some((e) => e.type === "fallback")) f.push("fallback instead of an answer");
  if (r.events.some((e) => e.type === "error")) f.push("error event");
  if (!r.answer.trim()) f.push("empty answer");
  if (c.maxChars && r.answer.length > c.maxChars) f.push(`too long (${r.answer.length} > ${c.maxChars})`);
  for (const re of c.must ?? []) if (!re.test(r.answer)) f.push(`missing ${re}`);
  for (const re of [...(c.mustNot ?? []), ...ALWAYS_NOT]) if (re.test(r.answer)) f.push(`contains ${re}`);
  const plan = planAnswer(turns);
  if (plan.kind === "model") {
    const cited = resolveCitations(r.answer, r.map);
    if (c.cites && !cited.length) f.push("no citation");
    const unsupported = unsupportedClaims(r.answer, groundingText(plan.chunks));
    if (unsupported.length) f.push(`unsupported: ${unsupported.map((u) => `${u.kind}:${u.value}`).join(", ")}`);
    if (/\]\((?:\/|https?:)|https?:\/\//.test(r.answer)) f.push("model wrote a link");
  }
  return f;
}

describe.skipIf(!BASE)("Ask My AI live evaluation (47 cases)", () => {
  it.each(CASES)("#$n $q", async (c) => {
    const turns: Turn[] = [...(c.history ?? []), { role: "user", content: c.q }];
    if (!c.quick) await new Promise((r) => setTimeout(r, PAUSE_MS));
    const r = await ask(turns);
    const failures = check(c, r, turns);
    rows.push({ c, ms: r.ms, answer: r.answer, failures });
    expect(failures, `${c.q}\n---\n${r.answer}`).toEqual([]);
  }, 120_000);

  afterAll(() => {
    if (!REPORT || !rows.length) return;
    const passed = rows.filter((r) => !r.failures.length).length;
    const model = rows.filter((r) => !r.c.quick);
    const median = (xs: number[]) => xs.sort((a, b) => a - b)[Math.floor(xs.length / 2)] ?? 0;
    const groups = [...new Set(rows.map((r) => r.c.group))];
    const out = [
      `# Ask My AI evaluation`,
      ``,
      `Prompt ${PROMPT_VERSION}, run ${new Date().toISOString().slice(0, 10)} against ${BASE}.`,
      ``,
      `**${passed} of ${rows.length} cases passed.** Median response time: ${median(model.map((r) => r.ms))} ms for model answers, ${median(rows.filter((r) => r.c.quick).map((r) => r.ms))} ms for instant replies.`,
      ``,
      `| Group | Passed |`,
      `| --- | --- |`,
      ...groups.map((g) => {
        const gs = rows.filter((r) => r.c.group === g);
        return `| ${g} | ${gs.filter((r) => !r.failures.length).length} / ${gs.length} |`;
      }),
      ``,
      `## Answers`,
      ``,
      ...rows
        .sort((a, b) => a.c.n - b.c.n)
        .flatMap((r) => [
          `### ${r.c.n}. ${r.c.q.split("\n")[0]}${r.c.q.includes("\n") ? " (job description attached)" : ""}`,
          ``,
          `${r.failures.length ? `**Failed:** ${r.failures.join("; ")}` : "Passed"} (${r.ms} ms${r.c.quick ? ", no model call" : ""})`,
          ``,
          ...r.answer.trim().split("\n").map((l) => `> ${l}`),
          ``,
        ]),
    ];
    writeFileSync(REPORT, out.join("\n"));
  });
});
