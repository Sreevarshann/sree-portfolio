import type { FallbackReason, StreamEvent } from "@/lib/ai/protocol";
import { chatRequestSchema, checkRate, clientKey, createStreamRedactor, normalizeHistory, sameOrigin } from "@/lib/ai/guard";
import { retrieveConversation } from "@/lib/ai/retrieve";
import { suggestFollowUps } from "@/lib/ai/intent";
import { SYSTEM_PROMPT, buildUserTurn } from "@/lib/ai/prompt";
import { citedSources, fallbackLinks } from "@/lib/ai/sources";
import { getProvider, providerKeyName, ProviderError, selectedProvider, type Turn } from "@/lib/ai/providers";

export const maxDuration = 60;

const MAX_TOKENS = Number(process.env.ASK_SREE_MAX_TOKENS ?? 1200);

const encoder = new TextEncoder();
const line = (e: StreamEvent) => encoder.encode(JSON.stringify(e) + "\n");

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
  const latest = history[history.length - 1].content;
  const { chunks, analysis } = retrieveConversation(history, 6);
  const suggestions = suggestFollowUps(analysis, latest);
  const fallback = (reason: FallbackReason): StreamEvent[] => [
    { type: "fallback", reason, links: fallbackLinks(chunks) },
    { type: "suggestions", items: suggestions },
    { type: "done" },
  ];

  const rate = checkRate(await clientKey(req));
  if (!rate.ok) {
    if (rate.reason === "budget") return ndjson(fallback("budget"));
    return ndjson(
      [{ type: "error", code: "rate_limited", message: `You're asking quickly — please wait ${rate.retryAfter < 120 ? `${rate.retryAfter} seconds` : "a while"} and try again.` }],
      429,
      { "Retry-After": String(rate.retryAfter) },
    );
  }

  const provider = getProvider();
  if (!provider) {
    console.error(`[ask-sree] ${providerKeyName(selectedProvider())} is not set for this deployment; serving page links instead of an answer`);
    return ndjson(fallback("unavailable"));
  }

  const messages: Turn[] = history.map((m, i) =>
    i === history.length - 1
      ? { role: "user", content: buildUserTurn(m.content, chunks, analysis.entities.map((e) => e.label).join(", ") || undefined) }
      : { role: m.role, content: m.content },
  );

  const abort = new AbortController();
  req.signal.addEventListener("abort", () => abort.abort());

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (e: StreamEvent) => controller.enqueue(line(e));
      const redactor = createStreamRedactor();
      let emitted = false;
      let answer = "";
      try {
        const stop = await provider.stream({
          system: SYSTEM_PROMPT,
          messages,
          maxTokens: MAX_TOKENS,
          signal: abort.signal,
          onText: (text) => {
            const out = redactor.push(text);
            if (out) {
              emitted = true;
              answer += out;
              send({ type: "delta", text: out });
            }
          },
        });
        const tail = redactor.flush();
        if (tail) {
          emitted = true;
          answer += tail;
          send({ type: "delta", text: tail });
        }
        if (stop === "refusal" && !emitted) {
          send({ type: "delta", text: "I can't help with that one, but I'm happy to answer questions about Sree's experience, projects and skills." });
        } else if (stop === "length") {
          send({ type: "delta", text: "\n\n_(Answer trimmed for length — ask a follow-up for more detail.)_" });
        }
        const sources = citedSources(answer, chunks);
        if (sources.length) send({ type: "sources", sources });
        send({ type: "suggestions", items: suggestions });
        send({ type: "done" });
      } catch (err) {
        if (abort.signal.aborted) {
          // Client stopped generation; nothing more to send.
        } else {
          const { label, reason } = err instanceof ProviderError ? err : { label: (err as Error)?.name ?? "unknown", reason: "unavailable" as FallbackReason };
          console.error(`[ask-sree] ${provider.name} model error: ${label}`);
          // Keep the words already generated (still redacted) before reporting the cut-off.
          const tail = emitted ? redactor.flush() : "";
          if (tail) send({ type: "delta", text: tail });
          if (!emitted) {
            for (const e of fallback(reason)) send(e);
          } else {
            send({ type: "error", code: "interrupted", message: "The answer was cut off. Try again in a moment." });
            send({ type: "done" });
          }
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
  return Response.json({ ok: true, configured: getProvider() !== null }, { headers: { "Cache-Control": "no-store" } });
}
