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

  it("returns a clearly labelled search fallback when no API key is configured", async () => {
    const { res, events } = await call(ask("What did Sree work on at RightRev?"));
    expect(res.status).toBe(200);
    const fb = events.find((e) => e.type === "fallback");
    expect(fb && fb.type === "fallback" && fb.text).toMatch(/isn't connected/);
    expect(fb && fb.type === "fallback" && fb.sources.some((s) => s.href.includes("rightrev"))).toBe(true);
    expect(streamImpl).not.toHaveBeenCalled();
  });

  it("streams model output with sources first and redacts phone-like numbers", async () => {
    process.env.ANTHROPIC_API_KEY = "test-key";
    streamImpl.mockReturnValue(fakeStream(["Sree built Cortex agents. Call +1 (61", "7) 555-0100 now."]));
    const { events } = await call(ask("What did Sree work on at RightRev?"));
    expect(events[0].type).toBe("sources");
    const text = events.filter((e) => e.type === "delta").map((e) => (e.type === "delta" ? e.text : "")).join("");
    expect(text).toBe("Sree built Cortex agents. Call [redacted] now.");
    expect(events.at(-1)?.type).toBe("done");

    const params = streamImpl.mock.calls[0][0];
    expect(params.system[0].text).toMatch(/not Sree/);
    const lastUser = params.messages.at(-1).content as string;
    expect(lastUser).toMatch(/<portfolio_context>/);
    expect(lastUser).toMatch(/RightRev/);
    expect(params.max_tokens).toBeLessThanOrEqual(2000);
  });

  it("falls back to search results when the model errors before output", async () => {
    process.env.ANTHROPIC_API_KEY = "test-key";
    streamImpl.mockImplementation(() => {
      throw new Error("boom");
    });
    const { events } = await call(ask("Tell me about the Singapore AUV Challenge"));
    const fb = events.find((e) => e.type === "fallback");
    expect(fb && fb.type === "fallback" && fb.text).toMatch(/temporarily unavailable/);
  });

  it("rate limits bursts from one client", async () => {
    let last: Response | undefined;
    for (let i = 0; i < 12; i++) last = (await call(ask("hi"), { "x-forwarded-for": "10.9.9.9" })).res;
    expect(last?.status).toBe(429);
    expect(last?.headers.get("retry-after")).toBeTruthy();
  });
});
