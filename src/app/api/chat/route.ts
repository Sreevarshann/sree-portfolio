import Anthropic from "@anthropic-ai/sdk";
import type { ChatSource, StreamEvent } from "@/lib/ai/protocol";
import { chatRequestSchema, checkRate, clientKey, createStreamRedactor, normalizeHistory, sameOrigin } from "@/lib/ai/guard";
import { retrieveForConversation } from "@/lib/ai/retrieve";
import { SYSTEM_PROMPT, buildUserTurn } from "@/lib/ai/prompt";
import type { KnowledgeChunk } from "@/lib/ai/knowledge";

export const maxDuration = 60;

const MODEL = process.env.ASK_SREE_MODEL || "claude-opus-5-5";
const MAX_TOKENS = Number(process.env.ASK_SREE_MAX_TOKENS ?? 1200);
const TIMEOUT_MS = Number(process.env.ASK_SREE_TIMEOUT_MS ?? 45_000);
/** Server-side refusal fallbacks are supported on the current Opus/Sonnet/Fable models. */
const SUPPORTS_FALLBACKS = /^claude-(opus-5|sonnet-5-5|fable-5)/.test(MODEL) && process.env.ASK_SREE_FALLBACKS !== "off";

const encoder = new TextEncoder();
const line = (e: StreamEvent) => encoder.encode(JSON.stringify(e) + "\n");

function toSources(chunks: KnowledgeChunk[]): ChatSource[] {
  const seen = new Set<string>();
  const out: ChatSource[] = [];
  for (const c of chunks) {
    if (c.id === "site-map" || seen.has(c.href)) continue;
    seen.add(c.href);
    out.push({ title: c.title.split(" — ")[0], href: c.href, section: c.section });
  }
  return out.slice(0, 4);
}

/** Honest non-AI fallback: the most relevant portfolio sections, clearly labelled. */
function searchFallback(chunks: KnowledgeChunk[], reason: string) {
  const top = chunks.filter((c) => c.id !== "site-map").slice(0, 3);
  const bullets = top
    .map((c) => {
      const excerpt = c.text.length > 220 ? c.text.slice(0, 220).replace(/\s+\S*$/, "") + "…" : c.text;
      return `- **[${c.title}](${c.href})** — ${excerpt}`;
    })
    .join("\n");
  return `${reason} Here are the most relevant parts of the portfolio for your question:\n\n${bullets || "- [About Sree](/about)"}\n\nYou can also email Sree at [sreevarshan.dev@gmail.com](mailto:sreevarshan.dev@gmail.com).`;
}

function ndjson(events: StreamEvent[], status = 200, extra: Record<string, string> = {}) {
  return new Response(events.map((e) => JSON.stringify(e)).join("\n") + "\n", {
    status,
    headers: { "Content-Type": "application/x-ndjson; charset=utf-8", "Cache-Control": "no-store", ...extra },
  });
}

export async function POST(req: Request) {
  if (!sameOrigin(req)) return ndjson([{ type: "error", code: "forbidden", message: "Cross-origin requests are not allowed." }], 403);

  const len = Number(req.headers.get("content-length") ?? 0);
  if (len > 64_000) return ndjson([{ type: "error", code: "too_large", message: "That conversation is too long. Clear it and try again." }], 413);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return ndjson([{ type: "error", code: "bad_request", message: "Invalid request." }], 400);
  }
  const parsed = chatRequestSchema.safeParse(body);
  if (!parsed.success) {
    return ndjson([{ type: "error", code: "bad_request", message: parsed.error.issues[0]?.message ?? "Invalid request." }], 400);
  }

  const history = normalizeHistory(parsed.data.messages);
  const userTurns = history.filter((m) => m.role === "user").map((m) => m.content);
  const chunks = retrieveForConversation(userTurns, 6);
  const sources = toSources(chunks);

  const rate = checkRate(await clientKey(req));
  if (!rate.ok) {
    if (rate.reason === "budget") {
      return ndjson([{ type: "fallback", sources, text: searchFallback(chunks, "Ask Sree has reached today's usage budget, so the AI model is paused.") }, { type: "done" }]);
    }
    return ndjson(
      [{ type: "error", code: "rate_limited", message: `You're asking quickly — please wait ${rate.retryAfter < 120 ? `${rate.retryAfter} seconds` : "a while"} and try again.` }],
      429,
      { "Retry-After": String(rate.retryAfter) },
    );
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return ndjson([{ type: "fallback", sources, text: searchFallback(chunks, "The AI model isn't connected right now.") }, { type: "done" }]);
  }

  const client = new Anthropic({
    apiKey,
    baseURL: process.env.ASK_SREE_API_BASE_URL || "https://api.anthropic.com",
    timeout: TIMEOUT_MS,
    maxRetries: 1,
  });

  const messages: Anthropic.Beta.BetaMessageParam[] = history.map((m, i) =>
    i === history.length - 1 ? { role: "user", content: buildUserTurn(m.content, chunks) } : { role: m.role, content: m.content },
  );

  const abort = new AbortController();
  req.signal.addEventListener("abort", () => abort.abort());

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (e: StreamEvent) => controller.enqueue(line(e));
      const redactor = createStreamRedactor();
      let emitted = false;
      send({ type: "sources", sources });
      try {
        const s = client.beta.messages.stream(
          {
            model: MODEL,
            max_tokens: MAX_TOKENS,
            system: [{ type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } }],
            messages,
            output_config: { effort: "low" },
            ...(SUPPORTS_FALLBACKS ? { betas: ["server-side-fallback-2026-07-01"], fallbacks: "default" as const } : {}),
          },
          { signal: abort.signal },
        );
        for await (const ev of s) {
          if (ev.type === "content_block_delta" && ev.delta.type === "text_delta") {
            const out = redactor.push(ev.delta.text);
            if (out) {
              emitted = true;
              send({ type: "delta", text: out });
            }
          }
        }
        const tail = redactor.flush();
        if (tail) {
          emitted = true;
          send({ type: "delta", text: tail });
        }
        const final = await s.finalMessage();
        if (final.stop_reason === "refusal" && !emitted) {
          send({ type: "delta", text: "I can't help with that one, but I'm happy to answer questions about Sree's experience, projects and skills." });
        } else if (final.stop_reason === "max_tokens") {
          send({ type: "delta", text: "\n\n_(Answer trimmed for length — ask a follow-up for more detail.)_" });
        }
        send({ type: "done" });
      } catch (err) {
        if (abort.signal.aborted) {
          // Client stopped generation; nothing more to send.
        } else {
          const status = err instanceof Anthropic.APIError ? err.status : undefined;
          console.error("[ask-sree] model error", status ?? (err as Error)?.name);
          if (!emitted) {
            send({ type: "fallback", sources, text: searchFallback(chunks, "The AI model is temporarily unavailable.") });
          } else {
            send({ type: "error", code: "upstream", message: "The answer was interrupted. Try again in a moment." });
          }
          send({ type: "done" });
        }
      } finally {
        try {
          controller.close();
        } catch {}
      }
    },
    cancel() {
      abort.abort();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-store, no-transform",
      "X-Accel-Buffering": "no",
    },
  });
}

export function GET() {
  return Response.json({ ok: true, model: MODEL, configured: Boolean(process.env.ANTHROPIC_API_KEY) }, { headers: { "Cache-Control": "no-store" } });
}
