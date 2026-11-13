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

## Portrait

The home hero portrait switches from an illustrated version to the photograph. Add `portrait-illustrated.webp` and `portrait-real.webp` (any of avif/webp/jpg/png, same 4:5 crop) to `public/images/profile/` — see the README there. No code changes; the build detects them. Until both exist the hero shows its placeholder; with one, that image is shown alone. The About page uses the photograph.

## Tools & Technologies

The marquee and its "Where I've used each one" list come from `src/content/technologies.ts`. Each tool is `hands-on` (with `usedIn` evidence ids: roles, projects, `this-site`, `sree-ai`, `lab` or `resume`) or `exploring` (no evidence yet). Moving a tool from exploring to hands-on means adding where it was used. Logos: `public/tech-icons.svg` (sprite), `public/tech/*.svg` (multicolour) — regenerate with `scripts/build-tech-icons.mjs`; sources and licenses in `public/tech/LICENSES.md`.

## Last updated

The footer's "Last updated · Month Year" is the month the production build ran (Boston time), set in `next.config.ts`. Set `SITE_UPDATED_AT` (ISO date) in the build environment to pin a different date.

## Brand icons

Technology and issuer marks come from Simple Icons (CC0) and are stored as one sprite, `public/brand-icons.svg`, with titles and colors in `src/content/brandIcons.ts`. To add one, add a `<symbol id="slug">` to the sprite, an entry to `brandIcons.ts`, and (if the display name differs) an alias in `src/components/ui/BrandIcon.tsx`. Brands without a mark in that sprite (LinkedIn, Flare Innovation, Sri Sairam Techno Incubator, and AWS on credential pages) use typographic treatments or their official logo files — don't approximate logos. The Tools & Technologies marquee has its own sprite (see above), which includes LobeHub's MIT-licensed AWS and OpenAI marks.

## Theme or brand colors

Tokens are at the top of `src/app/globals.css`. Chart colors are in `chartTheme()` in `src/components/lab/PlotlyFigure.tsx`; re-validate any new categorical palette for color-vision deficiency before shipping.
