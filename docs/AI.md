# Sree AI

"Ask My AI" on the site. A personal AI assistant that answers questions about Sree's work using only verified portfolio content.

## Request flow

```
Browser (ChatView)
  └─ POST /api/chat  { messages: [{ role, content }] }        NDJSON stream back
        1. Same-origin check, body size limit, Zod validation
        2. History normalisation (last 12 turns, per-turn caps)
        3. Intent + entity recognition, then intent-aware retrieval
           (follow-ups inherit the previous topic)
        4. Rate limit (per hashed IP: 8/min, 60/day) and daily budget
        5. No key / budget reached → fallback (page links, clearly not an AI answer)
        6. Selected provider (Groq or Anthropic), streamed; text passes a phone-number redactor
        7. Events: sourceMap → delta… → sources (ids the answer cited) → suggestions → done
           (or fallback → suggestions → done, or error)
```

- **Knowledge base** (`src/lib/ai/knowledge.ts`): ~50 chunks generated from the typed content modules — profile, experience, education, certifications, achievements, every project (overview, features vs. planned, architecture, results) and the skills map. It asserts at load time that no chunk contains a phone-like number.
- **Intent** (`src/lib/ai/intent.ts`): deterministic recognition of the question type (identity, experience, project, achievement, certification, education, skills, contact, fit, assistant) and named entities (RightRev, AEGIS AI, the Singapore AUV Challenge, Charlie, Northeastern…). It also picks the follow-up suggestions.
- **Retrieval** (`src/lib/ai/retrieve.ts`): authoritative records for the intent are pinned first (the profile for "who is", experience records for work questions, the certification list for certificates); BM25 with stemming and synonyms fills the rest, boosted toward the intent's section. Sree's own name is ignored for ranking because it appears in every chunk. A follow-up without a named topic ("what stack did he use there?") inherits the previous question's entity, or the first page the previous answer linked. The corpus is small, so a vector database would add cost and latency without improving answers. Evaluated by `tests/unit/retrieval-eval.test.ts` (40+ questions with required top results and forbidden noise).
- **Facts** (`factsOf` in `src/lib/ai/knowledge.ts`): each source reaches the model as a list of atomic, verified facts. Identity, experience, achievement and technology-usage sources have explicit facts (role, dates, highlights, outcomes, and the role's "complete list" of technologies); others use their sentences. URLs are never in the facts.
- **Citations** (`src/lib/ai/citations.ts`, `allowlist.ts`): the model writes no links. It ends each factual sentence with source ids (`[S2]`); the server sends the id → {label, href} map first (hrefs allowlisted: portfolio pages, the public email, and URLs the portfolio itself links). The chat renders valid ids as numbered chips and a numbered Sources row; unknown ids are dropped, and any model-written link that is not in the map is shown as plain text.
- **Claim check** (`src/lib/ai/validate.ts`): after each answer, named technologies, companies, products and figures that the grounding facts don't contain, and vague padding ("and other services"), are logged as `[ask-sree] unsupported in answer: …`. Facts that state a tool was *not* used never count as support. Nothing is rewritten; the same check drives the regression tests.
- **Markdown** (`src/lib/ai/markdown.ts`): answers are normalised before rendering (one well-formed email link, no repeated URLs, standard bullets, HTML stripped) and rendered with `skipHtml`; links are limited to site paths, http(s) and mailto.
- **Prompt** (`src/lib/ai/prompt.ts`): a stable, cacheable system prompt (identity, grounding, privacy, security, style). Retrieved text is wrapped in `<portfolio_context>` inside the user turn and declared to be data, not instructions.
- **Guards** (`src/lib/ai/guard.ts`): validation, rate limiting, origin check, streaming-safe redaction.

## Providers

The route is provider-agnostic (`src/lib/ai/providers.ts`): it builds the system prompt, retrieval context and conversation, and the selected provider streams text deltas back. Retrieval, citations, Markdown normalisation, phone redaction, rate limits and the fallback are the same for every provider.

| Provider | Default model | Notes |
| --- | --- | --- |
| **Groq (primary)** | `openai/gpt-oss-120b` | Free tier, very fast. OpenAI-compatible Chat Completions over server-sent events, called with `fetch` (no extra SDK). `reasoning_effort: "low"`, reasoning excluded from the response; only `delta.content` is streamed. Other production models such as `llama-3.3-70b-versatile` work via `ASK_SREE_MODEL`. |
| Anthropic Claude | `claude-opus-5-5` | Official SDK, prompt caching, server-side refusal fallbacks (Opus 5/5.5, Sonnet 5.5, Fable; `ASK_SREE_FALLBACKS=off` disables). Paid. |

Selection: `ASK_SREE_PROVIDER=groq|anthropic`; if unset, Groq is used when `GROQ_API_KEY` exists, otherwise Anthropic.

Groq specifics: one retry on a transient 5xx before any text; 429/498/503 map to the "busy" fallback; a stream that ends without `[DONE]` or a `finish_reason` is treated as interrupted (the partial answer stays and Try again is offered); `finish_reason: "length"` adds the "trimmed" note.

## Configuration

| Variable | Default | Purpose |
| --- | --- | --- |
| `ASK_SREE_PROVIDER` | `groq` if `GROQ_API_KEY` is set, else `anthropic` | Which provider answers |
| `GROQ_API_KEY` | — | Groq credentials. Server-side only. |
| `ANTHROPIC_API_KEY` | — | Anthropic credentials (when that provider is selected). Server-side only. |
| `ASK_SREE_MODEL` | provider default (above) | Model ID override |
| `ASK_SREE_MAX_TOKENS` | `1200` | Output cap per answer |
| `ASK_SREE_TIMEOUT_MS` | `45000` | Upstream timeout |
| `ASK_SREE_RATE_PER_MINUTE` | `8` | Per visitor |
| `ASK_SREE_RATE_PER_DAY` | `60` | Per visitor |
| `ASK_SREE_DAILY_BUDGET` | `400` | Model calls per instance per day; after that the fallback is used |
| `ASK_SREE_API_BASE_URL` | provider's API | Endpoint override (used by the end-to-end stand-in) |

The in-app budget is per serverless instance; the provider's own limits (Groq free-tier rate limits, or an Anthropic Console spend limit) are the hard ceiling.

`GET /api/chat` returns `{ ok, configured }` for a quick health check (`configured: false` means the selected provider's key is not set for that deployment).

### Turning on AI answers in production (Groq)

1. Create an API key at console.groq.com (no card needed for the free tier).
2. Vercel → project → Settings → Environment Variables → add `GROQ_API_KEY` and `ASK_SREE_PROVIDER` = `groq`, scope **Production** (and Preview if wanted).
3. Redeploy (environment variables only apply to new deployments).
4. Check `GET /api/chat` shows `configured: true`, then ask a question. Provider failures are logged to Vercel function logs as `[ask-sree] groq model error: <type>` (for example `authentication_error (check GROQ_API_KEY)`, `rate_limit_error`, `not_found_error`), never with the key.

## Tests for providers

- `tests/unit/groq-provider.test.ts`: request shape, SSE parsing across chunk boundaries, reasoning never forwarded, stop reasons, HTTP error mapping, retry, truncated streams, and the route end to end with Groq (context, history, citations, redaction, fallbacks, health check).
- `tests/e2e-groq/` (`npm run test:e2e:groq`, also in CI): the production build streams from a local Groq-compatible stand-in through the real UI — Markdown, one email link, sources, follow-ups, multi-turn history, busy fallback, interrupted streams, light theme, desktop and mobile. No real key is used.

## Safety properties

- Never claims to be Sree; refers to him in the third person. The UI calls it his "digital twin" but states it is an AI assistant that can't make commitments on his behalf; the prompt forbids commitments about availability, interviews, offers, rates or start dates.
- Answers only from retrieved context; says when it doesn't know and points to email.
- Separates completed work from planned work; never claims public deployments for local projects.
- Never shares a phone number (not in the knowledge base, forbidden in the prompt, redacted from output).
- Ignores instructions inside retrieved text or user-supplied content; refuses persona changes and prompt disclosure.
- Makes no work-authorization or immigration claims.
- Stores no visitor data: history lives in the visitor's `sessionStorage`; the server keeps only hashed-IP counters in memory.

## Interface

- Opens from the nav ("Ask My AI"), the floating launcher, **⌘K / Ctrl+K** or **/**; Esc closes.
- Greeting: "Hey! I'm Sree's AI assistant. Ask me about his experience, projects, achievements, or what he's building." with four starters (`SUGGESTED_QUESTIONS` in `src/lib/ai/protocol.ts`). The full page (`/ask`) offers more.
- Streaming with a "Thinking…" indicator, cited sources (only pages the answer linked), three follow-up suggestions, copy, retry, stop, new chat.
- Desktop: glass panel anchored above the launcher. Mobile: full-height sheet that tracks the visual viewport so the composer stays above the keyboard; focus is trapped and returned on close.
- The chat bundle (including the Markdown renderer) is lazy-loaded on first open and pre-warmed when the browser is idle.

## Offline behaviour

If the key is missing, the budget is reached or the model errors before streaming, the API returns a `fallback` event with a reason (`unavailable`, `busy`, `budget`) and up to three relevant pages with one-line summaries. The chat says plainly that it couldn't write an answer, lists the pages, offers **Try again** and the email address. Nothing is presented as an AI answer when it isn't one, and no internal error text or stack trace reaches the browser. If a stream breaks after text has arrived, the partial answer stays and an "answer was cut off" error with Try again is shown.

## Tests

`tests/unit/chat-route.test.ts` (validation, origin, fallback, identity context, multi-turn, streaming with redaction and citations, provider overload, interrupted streams, rate limiting with a mocked SDK), `tests/unit/retrieval.test.ts`, `tests/unit/retrieval-eval.test.ts`, `tests/unit/markdown.test.ts`, `tests/unit/guard.test.ts`, `tests/unit/chat-view.test.tsx`, and Playwright flows in `tests/e2e/interactions.spec.ts`.
