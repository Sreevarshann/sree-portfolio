import { z } from "zod";

/* ------------------------------------------------------------ validation */
export const MAX_MESSAGE_CHARS = 1000;
export const MAX_HISTORY = 12;

export const chatRequestSchema = z
  .object({
    messages: z
      .array(
        z.object({
          role: z.enum(["user", "assistant"]),
          content: z.string().trim().min(1).max(6000),
        }),
      )
      .min(1)
      .max(40),
  })
  .superRefine((v, ctx) => {
    const last = v.messages[v.messages.length - 1];
    if (!last) return;
    if (last.role !== "user") ctx.addIssue({ code: "custom", message: "Last message must be from the user" });
    if (last.content.length > MAX_MESSAGE_CHARS)
      ctx.addIssue({ code: "custom", message: `Questions are limited to ${MAX_MESSAGE_CHARS} characters` });
  });

/** Trim history, enforce alternation, and cap assistant turns to bound token usage. */
export function normalizeHistory(messages: { role: "user" | "assistant"; content: string }[]) {
  const recent = messages.slice(-MAX_HISTORY);
  const out: { role: "user" | "assistant"; content: string }[] = [];
  for (const m of recent) {
    const content = m.role === "assistant" ? m.content.slice(0, 2500) : m.content.slice(0, MAX_MESSAGE_CHARS);
    const prev = out[out.length - 1];
    if (prev && prev.role === m.role) prev.content += "\n\n" + content;
    else out.push({ role: m.role, content });
  }
  while (out.length && out[0].role !== "user") out.shift();
  return out;
}

/* ------------------------------------------------------------ rate limiting */
/**
 * In-memory sliding-window limiter keyed by a hashed client address.
 * Serverless instances each hold their own window, so this bounds abuse per
 * instance; the global daily budget below caps total spend per instance too.
 */
type Bucket = { minute: number[]; day: number[] };
const buckets = new Map<string, Bucket>();
let dailyCount = 0;
let dailyStart = Date.now();

export const LIMITS = {
  perMinute: Number(process.env.ASK_SREE_RATE_PER_MINUTE ?? 8),
  perDay: Number(process.env.ASK_SREE_RATE_PER_DAY ?? 60),
  globalPerDay: Number(process.env.ASK_SREE_DAILY_BUDGET ?? 400),
};

export function checkRate(key: string, now = Date.now()): { ok: true } | { ok: false; reason: "minute" | "day" | "budget"; retryAfter: number } {
  if (now - dailyStart > 86_400_000) {
    dailyStart = now;
    dailyCount = 0;
  }
  if (dailyCount >= LIMITS.globalPerDay) return { ok: false, reason: "budget", retryAfter: Math.ceil((dailyStart + 86_400_000 - now) / 1000) };
  const b = buckets.get(key) ?? { minute: [], day: [] };
  b.minute = b.minute.filter((t) => now - t < 60_000);
  b.day = b.day.filter((t) => now - t < 86_400_000);
  if (b.minute.length >= LIMITS.perMinute) return { ok: false, reason: "minute", retryAfter: Math.ceil((b.minute[0] + 60_000 - now) / 1000) };
  if (b.day.length >= LIMITS.perDay) return { ok: false, reason: "day", retryAfter: Math.ceil((b.day[0] + 86_400_000 - now) / 1000) };
  b.minute.push(now);
  b.day.push(now);
  buckets.set(key, b);
  dailyCount++;
  if (buckets.size > 5000) {
    for (const [k, v] of buckets) if (!v.day.length || now - v.day[v.day.length - 1] > 86_400_000) buckets.delete(k);
  }
  return { ok: true };
}

export function resetRateLimits() {
  buckets.clear();
  dailyCount = 0;
  dailyStart = Date.now();
}

export async function clientKey(req: Request) {
  const ip = (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || req.headers.get("x-real-ip") || "local";
  const data = new TextEncoder().encode(`ask-sree:${ip}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Buffer.from(digest).toString("base64url").slice(0, 22);
}

/** Reject cross-site browser requests (curl etc. without Origin are still rate limited). */
export function sameOrigin(req: Request) {
  const origin = req.headers.get("origin");
  if (!origin) return true;
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

/* ------------------------------------------------------------ output redaction */
const PHONE = /(?<![\d\w-])(?:\+?\d{1,2}[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}(?![\d\w])/g;

/** Removes anything shaped like a phone number from model output. */
export function redact(text: string) {
  return text.replace(PHONE, "[redacted]");
}

/**
 * Streaming-safe redactor: holds back a short tail so a number split across
 * chunks is still caught before it reaches the client.
 */
export function createStreamRedactor(holdback = 24) {
  let pending = "";
  const isWord = (c: string | undefined) => !!c && /[\w-]/.test(c);
  // Characters that can appear inside a phone number ("+1 (617) 555-0100").
  const isPhoneish = (c: string | undefined) => !!c && /[\d\s().+-]/.test(c);
  return {
    push(chunk: string) {
      pending += chunk;
      if (pending.length <= holdback) return "";
      // Release only up to a word boundary at least `holdback` chars from the
      // end, so neither a phone number (digits, spaces, dots, dashes, parentheses)
      // nor a long ID (e.g. in a URL) is split
      // across the released/pending seam.
      let cut = pending.length - holdback;
      const unbreakable = (i: number) =>
        (isWord(pending[i - 1]) && isWord(pending[i])) || (isPhoneish(pending[i - 1]) && isPhoneish(pending[i]));
      while (cut > 0 && unbreakable(cut)) cut--;
      if (cut === 0) {
        if (pending.length < 4000) return "";
        cut = pending.length - holdback; // pathological unbroken run: give up waiting
      }
      const out = redact(pending.slice(0, cut));
      pending = pending.slice(cut);
      return out;
    },
    flush() {
      const out = redact(pending);
      pending = "";
      return out;
    },
  };
}
