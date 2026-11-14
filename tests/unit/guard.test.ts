import { beforeEach, describe, expect, it } from "vitest";
import { normalizeDashes, chatRequestSchema, checkRate, createStreamRedactor, normalizeHistory, redact, resetRateLimits, sameOrigin, LIMITS } from "@/lib/ai/guard";

// Fictional numbers only (555 exchange).
describe("redaction", () => {
  it.each(["+1 (617) 555-0100", "617-555-0123", "617.555.0199", "(617) 555 0100"])("redacts %s", (n) => {
    expect(redact(`call ${n} now`)).toBe("call [redacted] now");
  });
  it("leaves ordinary numbers alone", () => {
    const s = "25,877 transactions, 2026, 0.863 F1, 1M+ records, 18 agents, 172,512 events";
    expect(redact(s)).toBe(s);
  });
  it("does not redact long IDs inside URLs", () => {
    const url = "https://www.linkedin.com/posts/someone_tag-ugcPost-7244625106197512192-ilNL/";
    expect(redact(`See ${url}`)).toBe(`See ${url}`);
  });
  it("keeps long URL IDs intact when streamed in small chunks", () => {
    const text = "Proof: https://www.linkedin.com/posts/someone_tag-ugcPost-7244625106197512192-ilNL/ — see the post.";
    for (const size of [1, 3, 7, 11]) {
      const r = createStreamRedactor();
      let out = "";
      for (let i = 0; i < text.length; i += size) out += r.push(text.slice(i, i + size));
      out += r.flush();
      // (The em dash becomes a plain hyphen; the URL is untouched.)
      expect(out).toBe(text.replace(" \u2014 ", " - "));
    }
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


describe("dash normalization in streamed answers", () => {
  const stream = (text: string, size: number) => {
    const r = createStreamRedactor();
    let out = "";
    for (let i = 0; i < text.length; i += size) out += r.push(text.slice(i, i + size));
    return out + r.flush();
  };

  it("replaces em and en dashes with plain hyphens, wherever the chunks split", () => {
    const text = "He built agents \u2014 grounded ones [S1]. Ranges like 2\u20135 stay readable, and A\u2014B too. Done [S2][S3].";
    const expected = "He built agents - grounded ones [S1]. Ranges like 2-5 stay readable, and A - B too. Done [S2][S3].";
    for (const size of [1, 2, 3, 5, 8, 13, 400]) expect(stream(text, size), `chunk ${size}`).toBe(expected);
  });

  it("never leaves a double space when the dash follows an already-released space", () => {
    const long = "x".repeat(40) + " ";
    for (const size of [1, 4, 41, 42]) {
      const out = stream(long + "\u2014 next part of the answer, long enough to release.", size);
      expect(out).not.toMatch(/  /);
      expect(out).not.toMatch(/[\u2014\u2013]/);
    }
  });

  it("keeps Markdown links, citations and phone redaction intact", () => {
    const text = "See [the case study](/projects/aegis-ai) \u2014 or call +1 (617) 555-0100 [S1].";
    for (const size of [1, 3, 7]) expect(stream(text, size)).toBe("See [the case study](/projects/aegis-ai) - or call [redacted] [S1].");
  });

  it("normalizeDashes is idempotent", () => {
    const once = normalizeDashes("a \u2014 b \u2013 c\u2014d");
    expect(normalizeDashes(once)).toBe(once);
    expect(once).toBe("a - b - c - d");
  });
});
