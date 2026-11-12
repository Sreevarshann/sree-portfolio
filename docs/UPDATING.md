# Updating content

All public facts live in typed modules under `src/content/`. Pages, the sitemap and the Ask Sree knowledge base are generated from them, so one edit updates everything.

| To change | Edit |
| --- | --- |
| Bio, headline, values, focus, links | `src/content/profile.ts` |
| Jobs | `src/content/experience.ts` |
| Degrees, certifications, achievements | `src/content/credentials.ts` |
| Projects and case studies | `src/content/projects.ts` |
| Skills map | `src/content/skills.ts` |
| Lab chart data | `src/content/lab.ts` |

After editing: `npm run check` then `npm run build`.

## Resume PDF

1. Export the new resume.
2. Remove the phone number and anything you don't want public (the sanitizer approach used here: redact the contact-line segment and re-insert email, LinkedIn, GitHub and Scholar links).
3. Save it as `public/Sreevarshan-Sathiyamurthy-Resume.pdf`. Keep the original **outside** this repository.
4. `npm run privacy` checks the PDF for telephone links; also open it and confirm visually.

## Adding a project

1. Add an entry to `projects` in `src/content/projects.ts` (slug, repo, problem, overview, features, planned, stack, architecture nodes/edges, challenges, decisions, tests, metrics, screenshots, run note).
2. Put screenshots in `public/projects/<slug>/` as WebP (≈1440–1600 px wide).
3. Only list numbers that appear in the repository; put unbuilt work in `planned`.
4. The case study page, catalog filters, sitemap and AI knowledge update automatically.

## Certifications

Add to `certifications` in `src/content/credentials.ts`. Use `kind: "Training"` for courses that aren't exam-based credentials and add a `note` explaining the distinction. Only show IDs/dates you can verify.

## AI knowledge

`src/lib/ai/knowledge.ts` builds chunks from the content modules. For facts that don't belong on a page, add a chunk with `add({ id, title, section, href, text })`. Then:

- add a retrieval assertion in `tests/unit/retrieval.test.ts` for the new topic;
- add synonyms in `src/lib/ai/retrieve.ts` if visitors might phrase it differently;
- run `npm test` — the knowledge base refuses to load if any chunk contains a phone-like number.

## Theme or brand colors

Tokens are at the top of `src/app/globals.css`. Chart colors are in `chartTheme()` in `src/components/lab/PlotlyFigure.tsx`; re-validate any new categorical palette for color-vision deficiency before shipping.
