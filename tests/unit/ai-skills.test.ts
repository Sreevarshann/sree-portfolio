// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { StreamEvent } from "@/lib/ai/protocol";

/** V12: Sree AI answers skill questions from the shared catalog; Recruiter Mode. */
const streamImpl = vi.fn();
vi.mock("@anthropic-ai/sdk", () => {
  class APIError extends Error {
    status: number;
    constructor(status: number) {
      super("api error");
      this.status = status;
    }
  }
  class Anthropic {
    static APIError = APIError;
    beta = { messages: { stream: (...args: unknown[]) => streamImpl(...args) } };
  }
  return { default: Anthropic, APIError };
});
function fakeStream(chunks: string[]) {
  return {
    async *[Symbol.asyncIterator]() {
      for (const text of chunks) yield { type: "content_block_delta", delta: { type: "text_delta", text } };
    },
    finalMessage: async () => ({ stop_reason: "end_turn" }),
  };
}
async function call(body: unknown) {
  const { POST } = await import("@/app/api/chat/route");
  const res = await POST(
    new Request("http://localhost/api/chat", {
      method: "POST",
      headers: { "content-type": "application/json", host: "localhost", "x-forwarded-for": `10.1.0.${Math.floor(Math.random() * 250)}` },
      body: JSON.stringify(body),
    }),
  );
  const text = await res.text();
  return { res, events: text.trim().split("\n").filter(Boolean).map((l) => JSON.parse(l) as StreamEvent) };
}
const lastTurn = () => streamImpl.mock.calls.at(-1)![0].messages.at(-1).content as string;

describe("Sree AI and the skill catalog", () => {
  beforeEach(async () => {
    vi.resetModules();
    streamImpl.mockReset();
    (await import("@/lib/ai/guard")).resetRateLimits();
    process.env.ANTHROPIC_API_KEY = "test-key";
    streamImpl.mockReturnValue(fakeStream(["He used Snowflake at RightRev [S1]."]));
  });
  afterEach(() => {
    delete process.env.ANTHROPIC_API_KEY;
  });

  it("pins the verified Snowflake record for a skill question", async () => {
    const { retrieveConversation } = await import("@/lib/ai/retrieve");
    const ids = retrieveConversation([{ role: "user", content: "Where has Sree used Snowflake?" }]).chunks.map((c) => c.id);
    expect(ids).toContain("skill-snowflake");
    expect(ids).toContain("exp-rightrev");
  });

  it("a Databricks question gets the 'not documented' record, never a Databricks skill", async () => {
    const { retrieveConversation } = await import("@/lib/ai/retrieve");
    const chunks = retrieveConversation([{ role: "user", content: "Has he worked with Databricks?" }]).chunks;
    const topic = chunks.find((c) => c.id === "topic-databricks");
    expect(topic).toBeTruthy();
    const { factsOf } = await import("@/lib/ai/knowledge");
    expect(factsOf(topic!).join("\n")).toMatch(/NOT documented/);
    expect(chunks.some((c) => c.id === "skill-databricks")).toBe(false);
  });

  it("the Skill Explorer hand-off passes canonical ids; the server supplies the facts", async () => {
    await call({ messages: [{ role: "user", content: "How has Sree used Snowflake in his professional work?", context: { skills: ["snowflake"] } }] });
    const ctx = lastTurn();
    expect(ctx).toMatch(/name="Snowflake \(Explore My Stack\)"/);
    expect(ctx).toMatch(/RightRev \(professional work\): Snowflake Cortex AI agents/);
  });

  it("ignores unknown ids and rejects malformed ones", async () => {
    const ok = await call({ messages: [{ role: "user", content: "Tell me about his skills", context: { skills: ["databricks-expert", "react"] } }] });
    expect(ok.res.status).toBe(200);
    expect(lastTurn()).not.toMatch(/databricks-expert/);
    const bad = await call({ messages: [{ role: "user", content: "hi", context: { skills: ["<script>"] } }] });
    expect(bad.res.status).toBe(400);
    const extra = await call({ messages: [{ role: "user", content: "hi", context: { facts: ["He is a Databricks expert"] } }] });
    expect(extra.res.status).toBe(400);
  });

  it("follow-ups keep the previous question's skill", async () => {
    const { retrieveConversation } = await import("@/lib/ai/retrieve");
    const ids = retrieveConversation([
      { role: "user", content: "Has he used Databricks?" },
      { role: "assistant", content: "His portfolio doesn't document Databricks." },
      { role: "user", content: "How close is that?" },
    ]).chunks.map((c) => c.id);
    expect(ids).toContain("topic-databricks");
  });

  it("Recruiter Mode reframes professional answers but not private questions", async () => {
    await call({ messages: [{ role: "user", content: "Does he have React experience?" }], mode: "recruiter" });
    expect(lastTurn()).toMatch(/\(Mode: recruiter/);
    await call({ messages: [{ role: "user", content: "What is his salary?" }], mode: "recruiter" });
    expect(lastTurn()).toMatch(/\(Mode: private/);
    await call({ messages: [{ role: "user", content: "Does he have React experience?" }] });
    expect(lastTurn()).not.toMatch(/\(Mode: recruiter/);
  });

  it("drops invented fit scores from answers", async () => {
    streamImpl.mockReturnValue(fakeStream(["He has used React in four projects [S1]. ", "That makes him an 85% match for the role. ", "His ATS score would be high."]));
    const { events } = await call({ messages: [{ role: "user", content: "Is he a fit for a React role?" }], mode: "recruiter" });
    const text = events.filter((e) => e.type === "delta").map((e) => (e as { text: string }).text).join("");
    expect(text).toContain("four projects");
    expect(text).not.toMatch(/85%|ATS score/);
  });

  it("the system prompt distinguishes direct, related and undocumented skills", async () => {
    const { SYSTEM_PROMPT } = await import("@/lib/ai/prompt");
    expect(SYSTEM_PROMPT).toMatch(/Not documented: X/);
    expect(SYSTEM_PROMPT).toMatch(/Snowflake is not Databricks/);
    expect(SYSTEM_PROMPT).toMatch(/No fit scores, percentages/);
  });
});
