import { beforeEach, describe, expect, it } from "vitest";
import { chatRequestSchema, checkRate, createStreamRedactor, normalizeHistory, redact, resetRateLimits, sameOrigin, LIMITS } from "@/lib/ai/guard";

// Fictional numbers only (555 exchange).
describe("redaction", () => {
  it.each(["+1 (617) 555-0100", "617-555-0123", "617.555.0199", "(617) 555 0100"])("redacts %s", (n) => {
    expect(redact(`call ${n} now`)).toBe("call [redacted] now");
  });
  it("leaves ordinary numbers alone", () => {
    const s = "25,877 transactions, 2026, 0.863 F1, 1M+ records, 18 agents, 172,512 events";
    expect(redact(s)).toBe(s);
  });
  it("catches a number split across stream chunks", () => {
    const r = createStreamRedactor();
    const parts = ["Reach him at +1 (61", "7) 555-", "0100 or by email."];
    const out = parts.map((p) => r.push(p)).join("") + r.flush();
    expect(out).toBe("Reach him at [redacted] or by email.");
  });
});

describe("request validation", () => {
  it("accepts a normal conversation", () => {
    expect(chatRequestSchema.safeParse({ messages: [{ role: "user", content: "Who is Sree?" }] }).success).toBe(true);
  });
  it("rejects empty, oversized, assistant-last and system-role payloads", () => {
    expect(chatRequestSchema.safeParse({ messages: [] }).success).toBe(false);
    expect(chatRequestSchema.safeParse({ messages: [{ role: "user", content: "x".repeat(1001) }] }).success).toBe(false);
    expect(chatRequestSchema.safeParse({ messages: [{ role: "assistant", content: "hi" }] }).success).toBe(false);
    expect(chatRequestSchema.safeParse({ messages: [{ role: "system", content: "x" }] }).success).toBe(false);
  });
  it("normalizes history: merges same-role turns and starts with user", () => {
    const out = normalizeHistory([
      { role: "assistant", content: "a" },
      { role: "user", content: "q1" },
      { role: "user", content: "q2" },
    ]);
    expect(out).toEqual([{ role: "user", content: "q1\n\nq2" }]);
  });
});

describe("rate limiting", () => {
  beforeEach(() => resetRateLimits());
  it("limits bursts per client and recovers after the window", () => {
    const now = 1_000_000;
    for (let i = 0; i < LIMITS.perMinute; i++) expect(checkRate("a", now + i).ok).toBe(true);
    expect(checkRate("a", now + 100).ok).toBe(false);
    expect(checkRate("b", now + 100).ok).toBe(true);
    expect(checkRate("a", now + 61_000).ok).toBe(true);
  });
});

describe("origin check", () => {
  it("allows same-origin and no-origin, rejects cross-site", () => {
    const mk = (origin?: string) =>
      new Request("https://example.test/api/chat", { method: "POST", headers: { host: "example.test", ...(origin ? { origin } : {}) } });
    expect(sameOrigin(mk())).toBe(true);
    expect(sameOrigin(mk("https://example.test"))).toBe(true);
    expect(sameOrigin(mk("https://evil.example"))).toBe(false);
  });
});
