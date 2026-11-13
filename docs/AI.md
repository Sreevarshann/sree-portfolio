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
        6. Anthropic Messages API, streamed; text passes a phone-number redactor
        7. Events: delta… → sources (pages the answer linked) → suggestions → done
           (or fallback → suggestions → done, or error)
```

- **Knowledge base** (`src/lib/ai/knowledge.ts`): ~50 chunks generated from the typed content modules — profile, experience, education, certifications, achievements, every project (overview, features vs. planned, architecture, results) and the skills map. It asserts at load time that no chunk contains a phone-like number.
- **Intent** (`src/lib/ai/intent.ts`): deterministic recognition of the question type (identity, experience, project, achievement, certification, education, skills, contact, fit, assistant) and named entities (RightRev, AEGIS AI, the Singapore AUV Challenge, Charlie, Northeastern…). It also picks the follow-up suggestions.
- **Retrieval** (`src/lib/ai/retrieve.ts`): authoritative records for the intent are pinned first (the profile for "who is", experience records for work questions, the certification list for certificates); BM25 with stemming and synonyms fills the rest, boosted toward the intent's section. Sree's own name is ignored for ranking because it appears in every chunk. A follow-up without a named topic ("what stack did he use there?") inherits the previous question's entity, or the first page the previous answer linked. The corpus is small, so a vector database would add cost and latency without improving answers. Evaluated by `tests/unit/retrieval-eval.test.ts` (40+ questions with required top results and forbidden noise).
- **Markdown** (`src/lib/ai/markdown.ts`): answers are normalised before rendering (one well-formed email link, no repeated URLs, standard bullets, HTML stripped) and rendered with `skipHtml`; links are limited to site paths, http(s) and mailto.
- **Prompt** (`src/lib/ai/prompt.ts`): a stable, cacheable system prompt (identity, grounding, privacy, security, style). Retrieved text is wrapped in `<portfolio_context>` inside the user turn and declared to be data, not instructions.
- **Guards** (`src/lib/ai/guard.ts`): validation, rate limiting, origin check, streaming-safe redaction.

## Provider choice

| Option | Notes |
| --- | --- |
| **Anthropic Claude (chosen)** | Strong instruction-following and refusal to invent facts; streaming; prompt caching for the stable system prompt; server-side refusal fallbacks; official TypeScript SDK. |
| OpenAI / others | Comparable capability; no advantage for this workload and would add a second SDK. |
| Self-hosted small model | Free per call but needs always-on GPU hosting, which doesn't fit Vercel. |

Default model: `claude-opus-5-5` at **low effort** with `max_tokens` 1,200 — accurate, conversational answers at about a few cents per question. For lower cost, set `ASK_SREE_MODEL=claude-haiku-5-5`. The model is configurable without code changes.

Server-side refusal fallbacks (`fallbacks: "default"`) are enabled automatically for Opus 5/5.5, Sonnet 5.5 and Fable models; set `ASK_SREE_FALLBACKS=off` to disable.

## Configuration

| Variable | Default | Purpose |
| --- | --- | --- |
| `ANTHROPIC_API_KEY` | — | Enables AI answers. Server-side only. |
| `ASK_SREE_MODEL` | `claude-opus-5-5` | Model ID |
| `ASK_SREE_MAX_TOKENS` | `1200` | Output cap per answer |
| `ASK_SREE_TIMEOUT_MS` | `45000` | Upstream timeout |
| `ASK_SREE_RATE_PER_MINUTE` | `8` | Per visitor |
| `ASK_SREE_RATE_PER_DAY` | `60` | Per visitor |
| `ASK_SREE_DAILY_BUDGET` | `400` | Model calls per instance per day; after that the fallback is used |

Also set a **monthly spend limit in the Anthropic Console** — the in-app budget is per serverless instance, so the console limit is the hard ceiling.

`GET /api/chat` returns `{ ok, configured }` for a quick health check (`configured: false` means `ANTHROPIC_API_KEY` is not set for that deployment).

### Turning on AI answers in production

1. Create a key in the Anthropic Console (with a monthly spend limit and billing set up).
2. Vercel → project → Settings → Environment Variables → add `ANTHROPIC_API_KEY`, scope **Production** (and Preview if wanted).
3. Redeploy (environment variables only apply to new deployments).
4. Check `GET /api/chat` shows `configured: true`, then ask a question. Provider failures are logged to Vercel function logs as `[ask-sree] model error: <type>` (for example `authentication_error`, `billing_error`, `not_found_error`), never with the key.

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
