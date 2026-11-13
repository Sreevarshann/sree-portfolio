// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getProvider, groqProvider, ProviderError, selectedProvider } from "@/lib/ai/providers";
import type { StreamEvent } from "@/lib/ai/protocol";

const KEY = "gsk_test_not_a_real_key";
const enc = new TextEncoder();

/** An SSE body delivered in arbitrary byte chunks (lines may split mid-JSON). */
function sse(chunks: string[], status = 200) {
  const body = new ReadableStream<Uint8Array>({
    start(c) {
      for (const ch of chunks) c.enqueue(enc.encode(ch));
      c.close();
    },
  });
  return new Response(body, { status, headers: { "content-type": "text/event-stream" } });
}
const evt = (o: unknown) => `data: ${JSON.stringify(o)}\n\n`;
const delta = (content: string, finish: string | null = null) => evt({ choices: [{ index: 0, delta: { content }, finish_reason: finish }] });

const env = (o: Record<string, string>) => o as unknown as NodeJS.ProcessEnv;
const fetchMock = vi.fn();
beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});
afterEach(() => vi.unstubAllGlobals());

async function run(p = groqProvider(KEY, "openai/gpt-oss-120b", "https://groq.test/openai/v1")) {
  let text = "";
  const stop = await p.stream({ system: "SYS", messages: [{ role: "user", content: "Who is Sree?" }], maxTokens: 900, signal: new AbortController().signal, onText: (t) => (text += t) });
  return { text, stop };
}

describe("provider selection", () => {
  it("uses Groq when ASK_SREE_PROVIDER=groq or when only GROQ_API_KEY is set", () => {
    expect(selectedProvider(env({ ASK_SREE_PROVIDER: "groq" }))).toBe("groq");
    expect(selectedProvider(env({ GROQ_API_KEY: KEY }))).toBe("groq");
    expect(selectedProvider(env({ ASK_SREE_PROVIDER: "anthropic", GROQ_API_KEY: KEY }))).toBe("anthropic");
    expect(selectedProvider(env({}))).toBe("anthropic");
  });
  it("returns no provider when the selected provider's key is missing", () => {
    expect(getProvider(env({ ASK_SREE_PROVIDER: "groq", ANTHROPIC_API_KEY: "x" }))).toBeNull();
    const p = getProvider(env({ ASK_SREE_PROVIDER: "groq", GROQ_API_KEY: KEY }));
    expect(p?.name).toBe("groq");
    expect(p?.model).toBe("openai/gpt-oss-120b");
    expect(getProvider(env({ ASK_SREE_PROVIDER: "groq", GROQ_API_KEY: KEY, ASK_SREE_MODEL: "llama-3.3-70b-versatile" }))?.model).toBe("llama-3.3-70b-versatile");
  });
});

describe("Groq streaming", () => {
  it("sends a streaming chat-completions request with the system prompt first", async () => {
    fetchMock.mockResolvedValue(sse([delta("Hi"), "data: [DONE]\n\n"]));
    await run();
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://groq.test/openai/v1/chat/completions");
    expect(init.headers.Authorization).toBe(`Bearer ${KEY}`);
    const body = JSON.parse(init.body);
    expect(body).toMatchObject({ model: "openai/gpt-oss-120b", stream: true, max_completion_tokens: 900, reasoning_effort: "low", include_reasoning: false });
    expect(body.messages).toEqual([{ role: "system", content: "SYS" }, { role: "user", content: "Who is Sree?" }]);
  });

  it("does not send reasoning parameters to non-reasoning models", async () => {
    fetchMock.mockResolvedValue(sse([delta("Hi"), "data: [DONE]\n\n"]));
    await run(groqProvider(KEY, "llama-3.3-70b-versatile", "https://groq.test/openai/v1"));
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.reasoning_effort).toBeUndefined();
    expect(body.include_reasoning).toBeUndefined();
  });

  it("streams content deltas across arbitrary chunk boundaries and ignores reasoning fields", async () => {
    const all = [
      evt({ choices: [{ delta: { role: "assistant", content: "" } }] }),
      evt({ choices: [{ delta: { reasoning: "secret chain of thought" } }] }),
      delta("Sreevarshan is "),
      delta("an engineer in **Boston**."),
      evt({ choices: [{ delta: {}, finish_reason: "stop" }], x_groq: { usage: { total_tokens: 42 } } }),
      "data: [DONE]\n\n",
    ].join("");
    // Split into 7-byte pieces so JSON lines arrive in fragments.
    fetchMock.mockResolvedValue(sse(all.match(/[\s\S]{1,7}/g)!));
    const { text, stop } = await run();
    expect(text).toBe("Sreevarshan is an engineer in **Boston**.");
    expect(text).not.toContain("secret");
    expect(stop).toBe("end");
  });

  it("reports a length stop and a content-filter stop", async () => {
    fetchMock.mockResolvedValueOnce(sse([delta("partial", "length"), "data: [DONE]\n\n"]));
    expect((await run()).stop).toBe("length");
    fetchMock.mockResolvedValueOnce(sse([evt({ choices: [{ delta: {}, finish_reason: "content_filter" }] }), "data: [DONE]\n\n"]));
    expect((await run()).stop).toBe("refusal");
  });

  it.each([
    [401, "authentication_error (check GROQ_API_KEY)", "unavailable"],
    [404, "not_found_error (check ASK_SREE_MODEL=openai/gpt-oss-120b)", "unavailable"],
    [429, "rate_limit_error", "busy"],
    [498, "capacity_exceeded", "busy"],
  ])("maps HTTP %i to a safe label and fallback reason", async (status, label, reason) => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ error: { message: "nope", type: "x" } }), { status }));
    const err = await run().catch((e) => e);
    expect(err).toBeInstanceOf(ProviderError);
    expect(err).toMatchObject({ label, reason, status });
    expect(String(err.label)).not.toContain(KEY);
  });

  it("retries once on a transient server error before any text", async () => {
    fetchMock.mockResolvedValueOnce(new Response("{}", { status: 500 })).mockResolvedValueOnce(sse([delta("ok"), "data: [DONE]\n\n"]));
    expect((await run()).text).toBe("ok");
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("treats a stream that ends without [DONE] or a finish reason as interrupted", async () => {
    fetchMock.mockResolvedValue(sse([delta("Sreevarshan is an engineer who ")]));
    const err = await run().catch((e) => e);
    expect(err).toBeInstanceOf(ProviderError);
    expect(err.label).toBe("stream_interrupted");
  });

  it("raises an error event sent mid-stream", async () => {
    fetchMock.mockResolvedValue(sse([delta("Hello"), evt({ error: { type: "internal_server_error" } })]));
    const err = await run().catch((e) => e);
    expect(err).toBeInstanceOf(ProviderError);
    expect(err.label).toContain("stream_error");
  });
});

describe("/api/chat with Groq", () => {
  beforeEach(async () => {
    vi.resetModules();
    process.env.ASK_SREE_PROVIDER = "groq";
    process.env.GROQ_API_KEY = KEY;
    const { resetRateLimits } = await import("@/lib/ai/guard");
    resetRateLimits();
  });
  afterEach(() => {
    delete process.env.ASK_SREE_PROVIDER;
    delete process.env.GROQ_API_KEY;
  });

  async function call(messages: { role: string; content: string }[]) {
    const { POST } = await import("@/app/api/chat/route");
    const res = await POST(
      new Request("http://localhost/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json", host: "localhost", "x-forwarded-for": `10.2.0.${Math.floor(Math.random() * 250)}` },
        body: JSON.stringify({ messages }),
      }),
    );
    const events = (await res.text()).trim().split("\n").map((l) => JSON.parse(l) as StreamEvent);
    return { res, events };
  }

  it("streams the Groq answer with retrieval context, citations, follow-ups and phone redaction", async () => {
    fetchMock.mockResolvedValue(sse([delta("At [RightRev](/experience#rightrev) he built Cortex agents. Call +1 (61"), delta("7) 555-0100."), "data: [DONE]\n\n"]));
    const { events } = await call([
      { role: "user", content: "What did he build at RightRev?" },
      { role: "assistant", content: "Snowflake Cortex agents." },
      { role: "user", content: "Tell me more about that work" },
    ]);
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.messages[0].role).toBe("system");
    expect(body.messages).toHaveLength(4); // system + 3 turns: the conversation is kept
    expect(body.messages[3].content).toMatch(/<portfolio_context>[\s\S]*RightRev/);
    const text = events.filter((e) => e.type === "delta").map((e) => (e.type === "delta" ? e.text : "")).join("");
    expect(text).toBe("At [RightRev](/experience#rightrev) he built Cortex agents. Call [redacted].");
    const src = events.find((e) => e.type === "sources");
    expect(src?.type === "sources" && src.sources.map((s) => s.href)).toEqual(["/experience#rightrev"]);
    expect(events.find((e) => e.type === "suggestions")).toBeTruthy();
    expect(events.at(-1)?.type).toBe("done");
  });

  it("serves the busy fallback on a Groq rate limit, and never logs the key", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    fetchMock.mockResolvedValue(new Response("{}", { status: 429 }));
    const { events } = await call([{ role: "user", content: "Who is Sree?" }]);
    const fb = events.find((e) => e.type === "fallback");
    expect(fb?.type === "fallback" && fb.reason).toBe("busy");
    expect(log.mock.calls.flat().join(" ")).toContain("groq model error: rate_limit_error");
    expect(log.mock.calls.flat().join(" ")).not.toContain(KEY);
  });

  it("falls back when GROQ_API_KEY is missing, and the health check reflects it", async () => {
    delete process.env.GROQ_API_KEY;
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    const { events } = await call([{ role: "user", content: "Who is Sree?" }]);
    expect(events[0]).toMatchObject({ type: "fallback", reason: "unavailable" });
    expect(log.mock.calls.flat().join(" ")).toContain("GROQ_API_KEY is not set");
    expect(fetchMock).not.toHaveBeenCalled();
    const { GET } = await import("@/app/api/chat/route");
    expect(await GET().json()).toEqual({ ok: true, configured: false });
    process.env.GROQ_API_KEY = KEY;
    expect(await GET().json()).toEqual({ ok: true, configured: true });
  });
});
