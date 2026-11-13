// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { StreamEvent } from "@/lib/ai/protocol";

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

function fakeStream(chunks: string[], stop = "end_turn") {
  return {
    async *[Symbol.asyncIterator]() {
      for (const text of chunks) yield { type: "content_block_delta", delta: { type: "text_delta", text } };
    },
    finalMessage: async () => ({ stop_reason: stop }),
  };
}

async function call(body: unknown, headers: Record<string, string> = {}) {
  const { POST } = await import("@/app/api/chat/route");
  const res = await POST(
    new Request("http://localhost/api/chat", {
      method: "POST",
      headers: { "content-type": "application/json", host: "localhost", "x-forwarded-for": `10.0.0.${Math.floor(Math.random() * 250)}`, ...headers },
      body: JSON.stringify(body),
    }),
  );
  const text = await res.text();
  const events = text.trim().split("\n").filter(Boolean).map((l) => JSON.parse(l) as StreamEvent);
  return { res, events };
}

const ask = (q: string) => ({ messages: [{ role: "user", content: q }] });

describe("/api/chat", () => {
  beforeEach(async () => {
    vi.resetModules();
    streamImpl.mockReset();
    const { resetRateLimits } = await import("@/lib/ai/guard");
    resetRateLimits();
  });
  afterEach(() => {
    delete process.env.ANTHROPIC_API_KEY;
  });

  it("rejects invalid payloads with 400", async () => {
    const { res, events } = await call({ messages: [] });
    expect(res.status).toBe(400);
    expect(events[0].type).toBe("error");
  });

  it("rejects cross-origin browser requests", async () => {
    const { res } = await call(ask("hi"), { origin: "https://evil.example" });
    expect(res.status).toBe(403);
  });

  it("returns structured page links, not raw search text, when no API key is configured", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const { res, events } = await call(ask("What did Sree work on at RightRev?"));
    expect(res.status).toBe(200);
    const fb = events.find((e) => e.type === "fallback");
    if (fb?.type !== "fallback") throw new Error("no fallback event");
    expect(fb.reason).toBe("unavailable");
    expect(fb.links[0].href).toBe("/experience#rightrev");
    expect(new Set(fb.links.map((l) => l.href)).size).toBe(fb.links.length);
    expect(JSON.stringify(fb)).not.toMatch(/mailto:|AI model offline/);
    expect(events.find((e) => e.type === "suggestions")).toBeTruthy();
    expect(streamImpl).not.toHaveBeenCalled();
  });

  it("answers 'Who is Sree?' from the profile, not unrelated projects or contact details", async () => {
    process.env.ANTHROPIC_API_KEY = "test-key";
    streamImpl.mockReturnValue(fakeStream(["Sreevarshan is a Boston-based engineer. See [his story](/about)."]));
    const { events } = await call(ask("Who is Sree?"));
    const ctx = streamImpl.mock.calls[0][0].messages.at(-1).content as string;
    expect(ctx).toMatch(/<source index="1" name="About Sree" page="\/about">/);
    // Internal chunk titles are not offered to the model as link text.
    expect(ctx).not.toContain("Who Sreevarshan (Sree, SS) is");
    expect(ctx).not.toMatch(/Event Processing/);
    expect(ctx).not.toMatch(/name="Contact"/);
    const src = events.find((e) => e.type === "sources");
    expect(src?.type === "sources" && src.sources).toEqual([{ title: "About Sree", href: "/about", section: "About" }]);
  });

  it("sends the conversation so follow-ups resolve, with context for the latest turn only", async () => {
    process.env.ANTHROPIC_API_KEY = "test-key";
    streamImpl.mockReturnValue(fakeStream(["Python, Snowflake and MCP."]));
    await call({
      messages: [
        { role: "user", content: "What did he build at RightRev?" },
        { role: "assistant", content: "Snowflake Cortex agents." },
        { role: "user", content: "What stack did he use there?" },
      ],
    });
    const msgs = streamImpl.mock.calls[0][0].messages;
    expect(msgs).toHaveLength(3);
    expect(msgs[0].content).toBe("What did he build at RightRev?");
    expect(msgs[2].content).toMatch(/<source index="1" name="RightRev" page="\/experience#rightrev">/);
    expect(msgs[2].content).toMatch(/Retrieval matched this question to: RightRev/);
  });

  it("streams model output, cites only linked pages, suggests follow-ups and redacts phone-like numbers", async () => {
    process.env.ANTHROPIC_API_KEY = "test-key";
    streamImpl.mockReturnValue(fakeStream(["Sree built [Cortex agents](/experience#rightrev). Call +1 (61", "7) 555-0100 now."]));
    const { events } = await call(ask("What did Sree work on at RightRev?"));
    expect(events[0].type).toBe("delta");
    const text = events.filter((e) => e.type === "delta").map((e) => (e.type === "delta" ? e.text : "")).join("");
    expect(text).toBe("Sree built [Cortex agents](/experience#rightrev). Call [redacted] now.");
    const src = events.find((e) => e.type === "sources");
    expect(src?.type === "sources" && src.sources.map((s) => s.href)).toEqual(["/experience#rightrev"]);
    const sug = events.find((e) => e.type === "suggestions");
    expect(sug?.type === "suggestions" && sug.items.length).toBe(3);
    expect(events.at(-1)?.type).toBe("done");

    const params = streamImpl.mock.calls[0][0];
    expect(params.system[0].text).toMatch(/not Sree/);
    const lastUser = params.messages.at(-1).content as string;
    expect(lastUser).toMatch(/<portfolio_context>/);
    expect(lastUser).toMatch(/RightRev/);
    expect(params.max_tokens).toBeLessThanOrEqual(2000);
  });

  it("falls back to page links when the model errors before output, and logs a safe label", async () => {
    process.env.ANTHROPIC_API_KEY = "test-key";
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    streamImpl.mockImplementation(() => {
      throw new Error("boom");
    });
    const { events } = await call(ask("Tell me about the Singapore AUV Challenge"));
    const fb = events.find((e) => e.type === "fallback");
    expect(fb?.type === "fallback" && fb.links[0].href).toBe("/achievements#sauvc");
    expect(log.mock.calls.flat().join(" ")).not.toMatch(/test-key/);
  });

  it("marks provider overload as busy so the client can suggest retrying", async () => {
    process.env.ANTHROPIC_API_KEY = "test-key";
    vi.spyOn(console, "error").mockImplementation(() => {});
    const { APIError } = (await import("@anthropic-ai/sdk")) as unknown as { APIError: new (s: number) => Error };
    streamImpl.mockImplementation(() => {
      throw new APIError(529);
    });
    const { events } = await call(ask("Who is Sree?"));
    const fb = events.find((e) => e.type === "fallback");
    expect(fb?.type === "fallback" && fb.reason).toBe("busy");
  });

  it("reports an interrupted stream as an error, keeping what was already sent", async () => {
    process.env.ANTHROPIC_API_KEY = "test-key";
    vi.spyOn(console, "error").mockImplementation(() => {});
    streamImpl.mockReturnValue({
      async *[Symbol.asyncIterator]() {
        yield { type: "content_block_delta", delta: { type: "text_delta", text: "Sreevarshan is an engineer based in Boston who builds data systems and " } };
        throw new Error("socket hang up");
      },
      finalMessage: async () => ({ stop_reason: "end_turn" }),
    });
    const { events } = await call(ask("Who is Sree?"));
    expect(events.some((e) => e.type === "delta")).toBe(true);
    const err = events.find((e) => e.type === "error");
    expect(err?.type === "error" && err.code).toBe("interrupted");
    expect(events.at(-1)?.type).toBe("done");
  });

  it("does not expose the model id from the health check", async () => {
    const { GET } = await import("@/app/api/chat/route");
    const body = await GET().json();
    expect(body).toEqual({ ok: true, configured: false });
  });

  it("rate limits bursts from one client", async () => {
    let last: Response | undefined;
    for (let i = 0; i < 12; i++) last = (await call(ask("hi"), { "x-forwarded-for": "10.9.9.9" })).res;
    expect(last?.status).toBe(429);
    expect(last?.headers.get("retry-after")).toBeTruthy();
  });
});

describe("prompt grounding", () => {
  it("forbids padding and source-name link text, and labels project parts", async () => {
    const { SYSTEM_PROMPT, formatContext } = await import("@/lib/ai/prompt");
    const { knowledge } = await import("@/lib/ai/knowledge");
    expect(SYSTEM_PROMPT).toMatch(/Do not generalise or pad/);
    expect(SYSTEM_PROMPT).toMatch(/include only items the context names/);
    expect(SYSTEM_PROMPT).toMatch(/Never use a source's name attribute/);
    const ctx = formatContext(knowledge.filter((c) => c.id.startsWith("proj-aegis-ai")));
    expect(ctx).toContain('name="AEGIS AI" part="tests, results and stack" page="/projects/aegis-ai"');
  });
});
