// @vitest-environment node
/**
 * Offline half of the V15 My AI evaluation (tests/ai-eval/cases-v15.ts): the
 * routing production uses must send each case the right way, and the
 * deterministic replies must already meet the answer rules. The live half is
 * tests/live/ai-eval-v15.live.test.ts.
 */
import { describe, expect, it } from "vitest";
import { V15_CASES, wordCount, type V15Case } from "../ai-eval/cases-v15";
import { ALWAYS_NOT } from "../ai-eval/cases";
import { planAnswer } from "@/lib/ai/plan";
import { SYSTEM_PROMPT, PROMPT_VERSION } from "@/lib/ai/prompt";
import type { Turn } from "@/lib/ai/retrieve";

const turns = (c: V15Case): Turn[] => [...(c.history ?? []), { role: "user", content: c.q }];

describe("My AI V15 evaluation set", () => {
  it("has the 20 cases of the V15 spec", () => {
    expect(V15_CASES.map((c) => c.n)).toEqual(Array.from({ length: 20 }, (_, i) => i + 1));
  });

  describe.each(V15_CASES)("#$n $q", (c) => {
    const plan = planAnswer(turns(c));
    if (c.quick) {
      it(`is answered at once (${c.quick})`, () => {
        expect(plan.kind).toBe("quick");
        if (plan.kind !== "quick") return;
        expect(plan.reply.kind).toBe(c.quick);
        const text = plan.reply.text;
        if (c.maxWords) expect(wordCount(text)).toBeLessThanOrEqual(c.maxWords);
        for (const re of c.must ?? []) expect(text).toMatch(re);
        for (const re of [...(c.mustNot ?? []), ...ALWAYS_NOT]) expect(text).not.toMatch(re);
      });
      return;
    }
    it("goes to the model", () => expect(plan.kind).toBe("model"));
    if (plan.kind !== "model") return;
    if (c.mode) it(`answers in ${c.mode} mode`, () => expect(plan.mode).toBe(c.mode));
    if (c.sources)
      it(`retrieves ${c.sources.join(", ")}`, () => {
        const ids = plan.chunks.map((k) => k.id);
        for (const s of c.sources!) expect(ids.some((id) => id.startsWith(s)), `${s} in ${ids.join(" ")}`).toBe(true);
      });
  });
});

describe("V15 prompt", () => {
  it("is My AI, version v15.3", () => {
    expect(PROMPT_VERSION).toBe("v15.3");
    expect(SYSTEM_PROMPT).toMatch(/You are "My AI"/);
    expect(SYSTEM_PROMPT).not.toMatch(/Sree AI|Recruiter Mode/);
  });

  it("states the length guides and the hiring paragraph", () => {
    expect(SYSTEM_PROMPT).toMatch(/8 to 25 words/);
    expect(SYSTEM_PROMPT).toMatch(/20 to 60 words/);
    expect(SYSTEM_PROMPT).toMatch(/40 to 70 words/);
    expect(SYSTEM_PROMPT).toMatch(/80 to 150 words/);
  });

  it("carries the V14 accuracy fixes", () => {
    expect(SYSTEM_PROMPT).toMatch(/migrated 18 AI agents to production" never becomes "created"/);
    expect(SYSTEM_PROMPT).toMatch(/Never say the Salesforce work used MCP/);
    expect(SYSTEM_PROMPT).toMatch(/No tables unless the visitor asks for one/);
  });

  it("hiring questions reach the model in hiring mode, never a refusal", () => {
    for (const q of ["Can I hire him?", "Is he worth interviewing?", "Why should I interview Sree?", "Is he a good candidate?", "Should we interview him?"]) {
      const plan = planAnswer([{ role: "user", content: q }]);
      expect(plan.kind, q).toBe("model");
      if (plan.kind === "model") expect(plan.mode, q).toBe("hiring");
    }
  });
});
