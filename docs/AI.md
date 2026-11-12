# Ask Sree

A personal AI assistant that answers questions about Sree's work using only verified portfolio content.

## Request flow

```
Browser (ChatView)
  └─ POST /api/chat  { messages: [{ role, content }] }        NDJSON stream back
        1. Same-origin check, body size limit, Zod validation
        2. History normalisation (last 12 turns, per-turn caps)
        3. BM25 retrieval over the knowledge base (+ previous turn for follow-ups)
        4. Rate limit (per hashed IP: 8/min, 60/day) and daily budget
        5. No key / budget reached → labelled search fallback
        6. Anthropic Messages API, streamed; text passes a phone-number redactor
        7. Events: sources → delta… → done   (or fallback / error)
```

- **Knowledge base** (`src/lib/ai/knowledge.ts`): ~50 chunks generated from the typed content modules — profile, experience, education, certifications, achievements, every project (overview, features vs. planned, architecture, results) and the skills map. It asserts at load time that no chunk contains a phone-like number.
- **Retrieval** (`src/lib/ai/retrieve.ts`): in-memory BM25 with light stemming and a synonym map. The corpus is small, so a vector database would add cost and latency without improving answers. The profile chunk is always included.
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

`GET /api/chat` returns `{ ok, model, configured }` for a quick health check.

## Safety properties

- Never claims to be Sree; refers to him in the third person.
- Answers only from retrieved context; says when it doesn't know and points to email.
- Separates completed work from planned work; never claims public deployments for local projects.
- Never shares a phone number (not in the knowledge base, forbidden in the prompt, redacted from output).
- Ignores instructions inside retrieved text or user-supplied content; refuses persona changes and prompt disclosure.
- Makes no work-authorization or immigration claims.
- Stores no visitor data: history lives in the visitor's `sessionStorage`; the server keeps only hashed-IP counters in memory.

## Offline behaviour

If the key is missing, the budget is reached or the model errors before streaming, the API returns a `fallback` event: the top portfolio sections for the question, linked, under a visible "Search results · AI model offline" label. Nothing is presented as an AI answer when it isn't one.

## Tests

`tests/unit/chat-route.test.ts` (validation, origin, fallback, streaming with redaction, upstream failure, rate limiting with a mocked SDK), `tests/unit/retrieval.test.ts`, `tests/unit/guard.test.ts`, `tests/unit/chat-view.test.tsx`, and Playwright flows in `tests/e2e/interactions.spec.ts`.
