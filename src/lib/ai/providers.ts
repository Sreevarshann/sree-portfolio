import Anthropic from "@anthropic-ai/sdk";
import type { FallbackReason } from "./protocol";

/**
 * LLM providers for Sree AI. The route is provider-agnostic: it builds the
 * prompt and context, and a provider streams plain text deltas back.
 *
 * Selection (server-side env only, never sent to the browser):
 *   ASK_SREE_PROVIDER = "groq" | "anthropic"   (default: groq when GROQ_API_KEY is set)
 *   GROQ_API_KEY / ANTHROPIC_API_KEY           credentials for the chosen provider
 *   ASK_SREE_MODEL                             optional model override
 *   ASK_SREE_API_BASE_URL                      optional endpoint override (tests, proxies)
 */
export type ProviderName = "groq" | "anthropic";
export type Turn = { role: "user" | "assistant"; content: string };
export type StreamArgs = { system: string; messages: Turn[]; maxTokens: number; signal: AbortSignal; onText: (text: string) => void };
/** Why generation stopped: normally, at the token cap, or by a safety refusal. */
export type StopReason = "end" | "length" | "refusal";

export type ChatProvider = {
  name: ProviderName;
  model: string;
  stream: (args: StreamArgs) => Promise<StopReason>;
};

export const DEFAULT_MODELS: Record<ProviderName, string> = {
  // Groq production model (see console.groq.com/docs/models).
  groq: "openai/gpt-oss-120b",
  anthropic: "claude-opus-5-5",
};

const TIMEOUT_MS = () => Number(process.env.ASK_SREE_TIMEOUT_MS ?? 45_000);

/** A provider failure with a log label (never containing secrets) and the fallback to show. */
export class ProviderError extends Error {
  constructor(
    readonly label: string,
    readonly reason: FallbackReason,
    readonly status?: number,
  ) {
    super(label);
    this.name = "ProviderError";
  }
}

export function selectedProvider(env: NodeJS.ProcessEnv = process.env): ProviderName {
  const explicit = env.ASK_SREE_PROVIDER?.trim().toLowerCase();
  if (explicit === "groq" || explicit === "anthropic") return explicit;
  return env.GROQ_API_KEY ? "groq" : "anthropic";
}

export function providerKeyName(name: ProviderName) {
  return name === "groq" ? "GROQ_API_KEY" : "ANTHROPIC_API_KEY";
}

/** The configured provider, or null when its API key is missing (the route then serves the fallback). */
export function getProvider(env: NodeJS.ProcessEnv = process.env): ChatProvider | null {
  const name = selectedProvider(env);
  const key = env[providerKeyName(name)];
  if (!key) return null;
  const model = env.ASK_SREE_MODEL?.trim() || DEFAULT_MODELS[name];
  const base = env.ASK_SREE_API_BASE_URL?.trim();
  return name === "groq" ? groqProvider(key, model, base) : anthropicProvider(key, model, base);
}

/* ------------------------------------------------------------------ Groq */

const statusLabel = (status: number, keyName: string, model: string) =>
  status === 401 ? `authentication_error (check ${keyName})`
  : status === 403 ? "permission_error (key lacks access)"
  : status === 404 ? `not_found_error (check ASK_SREE_MODEL=${model})`
  : status === 413 ? "request_too_large"
  : status === 429 ? "rate_limit_error"
  : status === 498 ? "capacity_exceeded"
  : `http_${status}`;

const busyStatus = (status: number) => status === 429 || status === 498 || status === 503 || status === 529;

/**
 * Groq's OpenAI-compatible Chat Completions API, streamed as server-sent
 * events (`data: {...}` lines ending with `data: [DONE]`). Only
 * `choices[0].delta.content` is forwarded; reasoning is not requested.
 */
export function groqProvider(apiKey: string, model: string, baseURL = "https://api.groq.com/openai/v1"): ChatProvider {
  const reasoningModel = /gpt-oss/.test(model);
  return {
    name: "groq",
    model,
    async stream({ system, messages, maxTokens, signal, onText }) {
      const body = JSON.stringify({
        model,
        messages: [{ role: "system", content: system }, ...messages],
        stream: true,
        max_completion_tokens: maxTokens,
        temperature: 0.4,
        // gpt-oss reasons before answering: keep it short and out of the response.
        ...(reasoningModel ? { reasoning_effort: "low", include_reasoning: false } : {}),
      });
      const timeout = AbortSignal.timeout(TIMEOUT_MS());
      const combined = AbortSignal.any([signal, timeout]);

      let res: Response | undefined;
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          res = await fetch(`${baseURL.replace(/\/$/, "")}/chat/completions`, {
            method: "POST",
            headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json", Accept: "text/event-stream" },
            body,
            signal: combined,
          });
        } catch (err) {
          if (signal.aborted) throw err;
          if (timeout.aborted) throw new ProviderError("timeout", "unavailable");
          if (attempt === 1) throw new ProviderError("network_error", "unavailable");
          continue;
        }
        // One retry for transient server errors before any text was produced.
        if (res.status >= 500 && res.status !== 503 && attempt === 0) continue;
        break;
      }
      if (!res) throw new ProviderError("network_error", "unavailable");
      if (!res.ok || !res.body) {
        await res.body?.cancel().catch(() => {});
        throw new ProviderError(statusLabel(res.status, "GROQ_API_KEY", model), busyStatus(res.status) ? "busy" : "unavailable", res.status);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      let stop: StopReason = "end";
      // A stream that ends without [DONE] or a finish_reason was cut off.
      let finished = false;
      const handle = (data: string) => {
        if (data === "[DONE]") return (finished = true);
        let json: { choices?: { delta?: { content?: string | null }; finish_reason?: string | null }[]; error?: { type?: string; code?: string } };
        try {
          json = JSON.parse(data);
        } catch {
          return false;
        }
        if (json.error) throw new ProviderError(`stream_error ${json.error.type ?? json.error.code ?? ""}`.trim(), "unavailable");
        const choice = json.choices?.[0];
        const text = choice?.delta?.content;
        if (text) onText(text);
        if (choice?.finish_reason) finished = true;
        if (choice?.finish_reason === "length") stop = "length";
        else if (choice?.finish_reason === "content_filter") stop = "refusal";
        return false;
      };
      try {
        for (;;) {
          const { value, done } = await reader.read();
          if (done) break;
          buf += decoder.decode(value, { stream: true });
          let nl: number;
          while ((nl = buf.indexOf("\n")) >= 0) {
            const raw = buf.slice(0, nl).trim();
            buf = buf.slice(nl + 1);
            if (!raw.startsWith("data:")) continue;
            if (handle(raw.slice(5).trim())) return stop;
          }
        }
      } catch (err) {
        if (err instanceof ProviderError || signal.aborted) throw err;
        if (timeout.aborted) throw new ProviderError("timeout", "unavailable");
        throw new ProviderError("stream_interrupted", "unavailable");
      } finally {
        reader.releaseLock();
      }
      const rest = buf.trim();
      if (rest.startsWith("data:")) handle(rest.slice(5).trim());
      if (!finished) throw new ProviderError("stream_interrupted", "unavailable");
      return stop;
    },
  };
}

/* ------------------------------------------------------------- Anthropic */

/** Claude through the official SDK (kept as an alternative provider). */
export function anthropicProvider(apiKey: string, model: string, baseURL = "https://api.anthropic.com"): ChatProvider {
  const fallbacks = /^claude-(opus-5|sonnet-5-5|fable-5)/.test(model) && process.env.ASK_SREE_FALLBACKS !== "off";
  const client = new Anthropic({ apiKey, baseURL, timeout: TIMEOUT_MS(), maxRetries: 1 });
  return {
    name: "anthropic",
    model,
    async stream({ system, messages, maxTokens, signal, onText }) {
      try {
        const s = client.beta.messages.stream(
          {
            model,
            max_tokens: maxTokens,
            system: [{ type: "text", text: system, cache_control: { type: "ephemeral" } }],
            messages,
            output_config: { effort: "low" },
            ...(fallbacks ? { betas: ["server-side-fallback-2026-07-01"], fallbacks: "default" as const } : {}),
          },
          { signal },
        );
        for await (const ev of s) {
          if (ev.type === "content_block_delta" && ev.delta.type === "text_delta") onText(ev.delta.text);
        }
        const final = await s.finalMessage();
        return final.stop_reason === "refusal" ? "refusal" : final.stop_reason === "max_tokens" ? "length" : "end";
      } catch (err) {
        if (signal.aborted) throw err;
        if (err instanceof Anthropic.APIError) {
          const status = err.status ?? 0;
          const label = status === 402 ? "billing_error (check API credits/billing)" : statusLabel(status, "ANTHROPIC_API_KEY", model);
          throw new ProviderError(label, busyStatus(status) ? "busy" : "unavailable", status);
        }
        const name = (err as Error)?.name ?? "unknown";
        throw new ProviderError(name === "APIConnectionTimeoutError" ? "timeout" : name, "unavailable");
      }
    },
  };
}
