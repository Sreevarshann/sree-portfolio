# Ask My AI evaluation (V14)

Prompt version `v14.1`. The evaluation set is the 47 visitor messages of the V14 spec, in `tests/ai-eval/cases.ts`.

## How it is checked

| Half | Runs | What it proves |
| --- | --- | --- |
| Offline (`tests/unit/ai-eval.test.ts`) | every `npm test` | Each case is routed the way production routes it (`planAnswer`): instant reply or model, answer mode, the evidence retrieved, links that exist on the site, no private data or secrets in front of the model. The route runs end to end with a scripted model: greetings, navigation and extraction attempts never call the model, a pasted job description is answered in recruiter mode, an empty model answer gets a natural recovery message, and a phone number written by the model is redacted. |
| Live (`tests/live/ai-eval.live.test.ts`) | on demand, real model | Every answer: length bounds, required and forbidden patterns, no phone numbers, secrets, prompt text or dashes, citations only from the answer's own sources, no claim the grounding facts do not support, no fallback, response time. Writes this report when `ASK_AI_EVAL_REPORT` is set. |

```bash
ASK_AI_LIVE_URL=https://www.sreevarshan.com ASK_AI_EVAL_REPORT=docs/v14/ai-eval.md npm run test:live -- ai-eval
```

## Offline results

All 47 cases route as specified (200 offline checks, part of the 477-test unit suite, all passing):

| Group | Cases | Routing |
| --- | --- | --- |
| Greetings | 1 to 6 | Instant reply, no model call, at most 140 characters, no biography |
| Identity | 7 to 10 | Model, facts mode, profile evidence |
| Professional experience | 11 to 17 | Model, the named employer's record first; "What is Snowflake Cortex?" is a general explanation backed by RightRev evidence |
| Projects | 18 to 23 | Model, project and skill records (Docker: its verified skill record) |
| Recruiting | 24 to 29 | Model, hiring mode; the pasted job description switches to recruiter mode with its skills pinned |
| Follow-ups | 30 to 33 | RightRev stays the topic through "there", "results", "that" |
| Unknown or sensitive | 34 to 37 | Salary and phone: private mode; nothing private reaches the model |
| General | 38 to 42 | Knowledge or casual mode; "help me find his resume" is an instant link |
| Adversarial | 43 to 47 | Prompt and key extraction get a fixed reply with no model call; invented credentials and achievements have only real records to draw on |

## Live results

Not yet run against the new prompt: no model key is available on this machine. The live suite runs once the change is deployed (production has the key).

Baseline before V14, production, the visitor typed "Hi":

> Hello! I'm the AI assistant for Sreevarshan Sathiyamurthy. He's an AI, data, and software engineer based in Boston, Massachusetts, currently pursuing an M.S. in Data Analytics Engineering at Northeastern University (expected Dec 2026) with a 3.95 GPA [S1]. His most recent role was a Software & Data Engineer Intern at RightRev, where he built AI agents on Snowflake to surface revenue insights [S1]. Feel free to ask about his work or projects.

After V14 (local, instant reply, no model call):

> Hello! I can walk you through Sree's experience, projects and achievements. Where would you like to start?
