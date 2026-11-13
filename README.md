# sree-portfolio

Personal site of **Sreevarshan (Sree) Sathiyamurthy** — AI Engineer, Data Engineer and Software Engineer in Boston.

The site is an engineering product in its own right: an editorial, motion-driven frontend; a retrieval-grounded AI assistant ("Sree AI") with streaming, abuse controls and an honest offline mode; interactive Plotly views of real project results; and a test suite that checks accessibility, privacy, responsive layout and every interactive control.

## Highlights

| Area | What's there |
| --- | --- |
| Pages | Home, About (with interactive skills map), Experience, Projects + 7 case studies, Achievements, Education, Certifications, Lab, Contact, Sree AI (full page) |
| Visual system | "Harbor Contour" design language: floating liquid-glass navigation, WebGL contour field, kinetic typography, scroll-driven reveals, editorial portrait, Boston skyline with a contour echo, designed dark *and* light themes with no-flash theme bootstrapping — see [docs/DESIGN.md](docs/DESIGN.md) |
| Sree AI | Server-side streaming LLM with BM25 retrieval over a typed knowledge base, cited sources, prompt-injection hardening, phone-number redaction, rate limits and a daily budget — see [docs/AI.md](docs/AI.md) |
| Lab | Four Plotly experiences built from numbers published in the project repositories, each with filters, provenance and an accessible data table |
| Quality | Vitest (unit, route, component, chart lifecycle, WebGL Strict Mode), Playwright on Chromium, Android emulation and WebKit (functional, axe in both themes, overflow at 10 widths, links, images, privacy, theme regressions), CI on GitHub Actions |

## Stack

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS 4 · GSAP + ScrollTrigger · raw WebGL2 · Plotly.js (lazy-loaded) · Anthropic Messages API · Zod · Vitest · Playwright · axe-core · Vercel

## Getting started

```bash
npm install
cp .env.example .env.local   # add GROQ_API_KEY to enable AI answers
npm run dev
```

Without an API key the site is fully functional; Sree AI returns clearly labelled search results from the portfolio instead of AI answers.

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Local development |
| `npm run build` / `npm start` | Production build / server |
| `npm run lint` · `npm run typecheck` | ESLint · TypeScript |
| `npm test` | Vitest unit, API route and component tests |
| `npm run test:e2e` | Playwright end-to-end suite (builds must exist; starts `next start`) |
| `npm run privacy` | Fails if a phone-like number, telephone link, secret or private file is tracked |
| `npm run check` | Lint + typecheck + unit tests + privacy |

## Project layout

```
src/
  app/                 routes, metadata, /api/chat
  content/             typed source of truth: profile, experience, credentials, projects, skills, lab data
  lib/ai/              knowledge base, retrieval, prompt, guards (validation, rate limits, redaction)
  components/          layout, motion, home, projects, experience, lab, ask, ui
public/                sanitized resume PDF, logos, project screenshots
tests/unit, tests/e2e  Vitest and Playwright suites
docs/                  design, AI, content inventory, deployment, updating
```

## Documentation

- [docs/DESIGN.md](docs/DESIGN.md) — creative directions explored and the chosen system
- [docs/AI.md](docs/AI.md) — Sree AI architecture, provider choice and configuration
- [docs/PERFORMANCE.md](docs/PERFORMANCE.md) — measured Lighthouse results and what keeps the site fast
- [docs/CONTENT_INVENTORY.md](docs/CONTENT_INVENTORY.md) — evidence behind every claim on the site
- [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) — Vercel, environment variables and custom domain
- [docs/UPDATING.md](docs/UPDATING.md) — how to update resume, projects, certifications and AI knowledge

## Your photo

Drop an approved portrait into `public/portrait/` as `sree.webp` (or `.avif`, `.jpg`, `.png`). It replaces the placeholder in the hero and on About at the next build — no code changes. See `public/portrait/README.md`.

## Privacy

The site never publishes a phone number. The public resume is a sanitized copy; the original is not part of this repository. `npm run privacy` and the end-to-end suite enforce this.

## License

Code: MIT. Content, resume, screenshots and personal information: © Sreevarshan Sathiyamurthy, all rights reserved. Institution and company logos belong to their owners.
