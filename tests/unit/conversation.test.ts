import { describe, expect, it } from "vitest";
import { analyze, modeOf } from "@/lib/ai/intent";
import { createCommitmentGate, unsupportedClaims } from "@/lib/ai/validate";
import { retryAfterMs } from "@/lib/ai/providers";
import { SYSTEM_PROMPT, buildUserTurn } from "@/lib/ai/prompt";
import { knowledge, factsOf } from "@/lib/ai/knowledge";

/** The V10 evaluation questions and the answer mode each should get. */
const MODES: [string, string][] = [
  ["Who is Sree?", "facts"],
  ["Can I hire Sree?", "hiring"],
  ["Why should we hire him?", "hiring"],
  ["Is Sree smart?", "casual"],
  ["Can he dance?", "casual"],
  ["Does he have a girlfriend?", "private"],
  ["What does he do at RightRev?", "facts"],
  ["What are his strongest technical skills?", "facts"],
  ["Can he build an AI agent for my business?", "hiring"],
  ["What's his greatest achievement?", "facts"],
  ["Does he know LangGraph?", "facts"],
  ["What projects prove his data engineering skills?", "facts"],
  ["Can he explain his AEGIS architecture?", "facts"],
  ["What is retrieval-augmented generation?", "knowledge"],
  ["Tell me something funny about Sree.", "casual"],
  ["What are his weaknesses?", "casual"],
  ["How can I contact him?", "facts"],
  ["Can he move to another city?", "hiring"],
  ["What salary does he expect?", "private"],
  ["Tell me something about him that isn't on his resume.", "casual"],
];

describe("conversation modes", () => {
  for (const [q, mode] of MODES) it(`${q} → ${mode}`, () => expect(modeOf(analyze(q))).toBe(mode));

  it("general knowledge stays general unless it is about Sree", () => {
    expect(modeOf(analyze("What is Kafka?"))).toBe("knowledge");
    expect(modeOf(analyze("What is his experience with Kafka?"))).toBe("facts");
  });

  it("the user turn carries the mode", () => {
    expect(buildUserTurn("Can he dance?", [], undefined, "casual")).toContain("(Mode: casual (");
  });
});

describe("system prompt", () => {
  it("separates facts, assessments, general knowledge, humour and unknowns", () => {
    expect(SYSTEM_PROMPT).toMatch(/Five kinds of statements/);
    for (const m of ["facts:", "hiring:", "casual:", "private:", "knowledge:"]) expect(SYSTEM_PROMPT).toContain(m);
    expect(SYSTEM_PROMPT).toMatch(/Never turn missing evidence into a yes or a no/);
    expect(SYSTEM_PROMPT).toMatch(/Never answer with a bare "I don't have that information"/);
    expect(SYSTEM_PROMPT).toMatch(/contributing to a team result must not become "leading the team"/);
  });

  it("knows the published availability line, and nothing more about logistics", () => {
    const profile = knowledge.find((c) => c.id === "profile")!;
    expect(factsOf(profile).join("\n")).toMatch(/Availability \(as published on this site\): Available for full-time opportunities\./);
  });
});

describe("commitment gate", () => {
  const run = (chunks: string[]) => {
    const dropped: string[] = [];
    const g = createCommitmentGate((_, hit) => dropped.push(hit));
    const text = chunks.map((c) => g.push(c)).join("") + g.flush();
    return { text, dropped };
  };

  it("drops guarantees, availability promises, money, literal superlatives and immigration claims", () => {
    const { text, dropped } = run([
      "He's worth talking to. He guarantees results. He is available to start immediately. ",
      "He expects $150k. He is the best engineer in the world. He's a genius. He is on STEM OPT. ",
      "He doesn't need sponsorship. He builds AI agents [S1].",
    ]);
    expect(text.replace(/\s+/g, " ").trim()).toBe("He's worth talking to. He builds AI agents [S1].");
    expect(dropped).toHaveLength(7);
  });

  it("keeps humour, qualified assessments, real figures and general knowledge", () => {
    const answer = "His dance moves are unverified! He's worth interviewing. AEGIS reached 0.926 PR-AUC [S2]. RAG pairs retrieval with generation.";
    expect(run([answer]).text).toBe(answer);
    expect(unsupportedClaims(answer, "0.926 PR-AUC").filter((f) => f.kind === "commitment")).toEqual([]);
  });

  it("holds an unfinished sentence until it ends, and releases it on flush", () => {
    const g = createCommitmentGate();
    expect(g.push("He built the ingestion layer and")).toBe("");
    expect(g.push(" the dashboard. Then")).toBe("He built the ingestion layer and the dashboard.");
    expect(g.flush()).toBe(" Then");
  });

  it("the claim checker reports commitments for the server log", () => {
    expect(unsupportedClaims("He will definitely accept your offer.", "")).toContainEqual({ kind: "commitment", value: "He will definitely accept" });
  });
});

describe("provider rate-limit retry", () => {
  it("reads Retry-After in seconds or as a date, with a short default", () => {
    expect(retryAfterMs("2")).toBe(2000);
    expect(retryAfterMs(null)).toBe(1200);
    expect(retryAfterMs(new Date(10_000).toUTCString(), 8_000)).toBe(2000);
    expect(retryAfterMs("soon")).toBeNull();
  });
});

describe("V10 hotfix: honesty and reliability", () => {
  it("forbids invented anecdotes, weaknesses and embellished availability", () => {
    expect(SYSTEM_PROMPT).toMatch(/Never invent anecdotes, habits, hobbies, stories, preferences, friends, weaknesses or "fun facts"/);
    expect(SYSTEM_PROMPT).toMatch(/For weaknesses, do not name any/);
    expect(SYSTEM_PROMPT).toMatch(/never add "right away", "immediately", "ready to join"/);
    expect(SYSTEM_PROMPT).toMatch(/never open with "I'm sorry"/);
    expect(SYSTEM_PROMPT).toMatch(/something not on his resume/);
  });

  it("the gate drops start-date commitments the evaluation caught", () => {
    const g = createCommitmentGate();
    const text = g.push("Sree is open to full-time roles [S1]. He is ready to join a team right away. He can start next week. He brings production AI work [S2].") + g.flush();
    expect(text).not.toMatch(/ready to join|can start/);
    expect(text).toContain("open to full-time roles");
    expect(text).toContain("production AI work");
  });
});
