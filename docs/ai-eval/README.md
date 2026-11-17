# Ask My AI evaluation

`scripts/ai-eval.mjs <baseUrl> <label> [trials]` sends the same 20 questions (two trials each) and three multi-turn conversations to a deployed site's `/api/chat`, paced under the per-minute limit, and writes `docs/ai-eval/<label>.json` with each answer, the cited sources, any fallback, first-token latency and total time. Calls hit the real model (Groq, `openai/gpt-oss-120b`, low reasoning effort, temperature 0.2).

Previews are behind Vercel Authentication, so runs target production: `baseline` is the configuration before V10, `v10` the configuration after it.

## Rubric

Each answer is scored 0, 1 or 2 on every dimension (2 = good, 1 = acceptable with a flaw, 0 = wrong or missing). A fallback (no answer) scores 0 everywhere except latency.

| Dimension | 2 means |
| --- | --- |
| Factual accuracy | Every claim about Sree is in the grounding facts; no upgraded contributions, invented numbers, roles or dates |
| Relevance | Answers what was asked |
| Naturalness | Reads like a person; no robotic disclaimers, no repeating the question |
| Personality | Warm and confident; playful where the question is light |
| Calibrated confidence | Enthusiasm tied to evidence; no guarantees, superlatives as fact, or commitments |
| Unknown handling | Unknown or private facts stay unknown, without a flat refusal; never a false yes or no |
| Citations | Facts about Sree are cited with valid ids; jokes and general knowledge are not |
| Conciseness | Short for simple or casual questions; detail only when asked |
| Continuity | Follow-ups resolve "there", "the agents", "that project" correctly (conversations only) |
| Latency | First token under 1.5 s |

Repeated trials expose inconsistent behaviour: a question scores the lower of its two trials.
