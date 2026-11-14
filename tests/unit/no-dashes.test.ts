import { describe, expect, it } from "vitest";
import { knowledge, factsOf } from "@/lib/ai/knowledge";
import { SYSTEM_PROMPT, formatContext } from "@/lib/ai/prompt";
import { DETAILED_QUESTIONS, MORE_QUESTIONS, SUGGESTED_QUESTIONS } from "@/lib/ai/protocol";
import { suggestFollowUps, analyze } from "@/lib/ai/intent";
import { GREETING, SUBTITLE } from "@/components/ask/ChatView";
import { technologies, evidence } from "@/content/technologies";

const DASH = /[—–]/;

describe("no em or en dashes in what the assistant receives or shows", () => {
  it("system prompt (and it tells the model not to use them)", () => {
    expect(SYSTEM_PROMPT).not.toMatch(DASH);
    expect(SYSTEM_PROMPT).toMatch(/Never use em dashes or en dashes/);
  });
  it("every knowledge fact, label, blurb and the formatted context", () => {
    for (const c of knowledge) {
      for (const f of factsOf(c)) expect(f, c.id).not.toMatch(DASH);
      expect(c.label + c.blurb, c.id).not.toMatch(DASH);
    }
    expect(formatContext(knowledge as typeof knowledge[number][])).not.toMatch(DASH);
  });
  it("greeting, starter questions and follow-up suggestions", () => {
    for (const t of [GREETING, SUBTITLE, ...SUGGESTED_QUESTIONS, ...DETAILED_QUESTIONS, ...MORE_QUESTIONS]) expect(t).not.toMatch(DASH);
    for (const q of ["Who is Sree?", "What did he build at RightRev?", "Tell me about AEGIS AI"]) for (const s of suggestFollowUps(analyze(q), q)) expect(s).not.toMatch(DASH);
  });
  it("technology catalog names, notes and usage labels", () => {
    for (const t of technologies) expect(`${t.name} ${t.note ?? ""}`).not.toMatch(DASH);
    for (const e of Object.values(evidence)) expect(e.label).not.toMatch(DASH);
  });
});
