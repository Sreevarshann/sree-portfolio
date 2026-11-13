// @vitest-environment node
/**
 * Live evaluation of Ask My AI against a deployed site (real model).
 * Not part of `npm test`; run with:
 *   ASK_AI_LIVE_URL=https://sreevarshansathiyamurthy.vercel.app npm run test:live
 * Each answer must cite only ids from its source map and contain no claim the
 * grounding facts do not support (same check the server logs).
 */
import { describe, expect, it } from "vitest";
import type { SourceRef, StreamEvent } from "@/lib/ai/protocol";
import { resolveCitations } from "@/lib/ai/citations";
import { retrieveConversation, type Turn } from "@/lib/ai/retrieve";
import { groundingText, unsupportedClaims } from "@/lib/ai/validate";

const BASE = process.env.ASK_AI_LIVE_URL;

async function ask(messages: Turn[]) {
  const res = await fetch(`${BASE}/api/chat`, {
    method: "POST",
    headers: { "content-type": "application/json", origin: BASE! },
    body: JSON.stringify({ messages }),
  });
  const events = (await res.text()).trim().split("\n").map((l) => JSON.parse(l) as StreamEvent);
  const map = (events.find((e) => e.type === "sourceMap") as { items: SourceRef[] } | undefined)?.items ?? [];
  const answer = events.map((e) => (e.type === "delta" ? e.text : "")).join("");
  const fallback = events.find((e) => e.type === "fallback");
  return { events, map, answer, fallback };
}

const CASES: { name: string; turns: Turn[]; mustCite?: string[] }[] = [
  { name: "Who is Sree?", turns: [{ role: "user", content: "Who is Sree?" }], mustCite: ["About Sree"] },
  {
    name: "RightRev follow-up",
    turns: [
      { role: "user", content: "What did he build at RightRev?" },
      { role: "assistant", content: "At RightRev he built Snowflake Cortex AI agents, SQL stored procedures and MCP integrations." },
      { role: "user", content: "What tech stack did he use there?" },
    ],
    mustCite: ["RightRev"],
  },
  { name: "RightRev", turns: [{ role: "user", content: "What did he build at RightRev?" }], mustCite: ["RightRev"] },
  { name: "SAUVC", turns: [{ role: "user", content: "What did he achieve at the Singapore AUV Challenge?" }], mustCite: ["Singapore AUV Challenge"] },
  { name: "skills", turns: [{ role: "user", content: "What are his strongest technical skills?" }] },
];

// Groq's free tier allows a few thousand tokens per minute; space requests out.
const PAUSE_MS = Number(process.env.ASK_AI_LIVE_PAUSE_MS ?? 25_000);

describe.skipIf(!BASE)("Ask My AI live evaluation", () => {
  it.each(CASES)("$name", async ({ turns, mustCite }) => {
    await new Promise((r) => setTimeout(r, PAUSE_MS));
    const { map, answer, fallback } = await ask(turns);
    expect(fallback, "the model answered (no fallback)").toBeUndefined();
    const cited = resolveCitations(answer, map);
    expect(cited.length, `answer cites sources:\n${answer}`).toBeGreaterThan(0);
    for (const label of mustCite ?? []) expect(cited.map((c) => c.label), answer).toContain(label);
    // No Markdown links or URLs written by the model.
    expect(answer, answer).not.toMatch(/\]\((?:\/|https?:)/);
    expect(answer, answer).not.toMatch(/https?:\/\//);
    const ctx = groundingText(retrieveConversation(turns).chunks);
    expect(unsupportedClaims(answer, ctx), answer).toEqual([]);
    console.log(`\n### ${turns.at(-1)!.content}\n${answer}\n→ cited: ${cited.map((c) => `${c.n} ${c.label}`).join(", ")}`);
  }, 120_000);
});
