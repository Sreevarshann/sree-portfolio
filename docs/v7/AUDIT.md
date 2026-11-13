# V7 audit — Quick / Detailed experiences

Measured with Playwright against production before the change
(`https://sreevarshansathiyamurthy.vercel.app`, commit `e24983c`) and against a
local production build of this branch. Dark theme, reduced motion, 1440×900
(desktop) and Pixel 7 (mobile).

## Homepage size

| | Before | V7 Quick (default) | V7 Detailed |
| --- | --- | --- | --- |
| Page height, desktop | 12,639 px | 7,212 px (−43%) | 11,272 px |
| Page height, mobile | 16,553 px | 10,991 px (−34%) | 16,810 px |
| Words in `<main>` | 1,159 | 631 (−46%) | 1,303 |
| Visible sections | 10 | 8 | 11 (adds Education & certifications) |

## Section spacing

Before, adjacent sections stacked their paddings: 168 px + 168 px = 336 px
between most sections on desktop (80 + 80 = 160 px on mobile); the toolkit
strip sat between a 144 px bottom padding and its own 101 px top padding.

V7: a section owns only the gap above it (`--space-chapter`,
`clamp(64px, 8vw, 120px)`): 115 px at 1440 px, 64 px on phones, identical for
every boundary. Head-to-content spacing is `--space-head`
(`clamp(32px, 3.6vw, 48px)`). Verified by `tests/e2e/v7.spec.ts › spacing`.

## Content moved, not removed

| Quick View | Detailed View / dedicated pages |
| --- | --- |
| One-sentence capability summaries, one proof link each | Full descriptions and all proof links |
| Three project previews (AEGIS AI, NEXUS AI, WorkMesh): name, one line, ≤4 technologies, Explore project | Four full project stages with signal paths, metrics and GitHub links; all seven case studies on /projects |
| Experience snapshot: role, dates, one outcome | Animated timeline; full highlights on /experience |
| — | Approach statement, Lab teaser, Sree AI promo |
| Education & certifications snapshot | Same, plus /education and /certifications |

## Screenshots

`before-home-full.jpg`, `after-quick-full.jpg`, `after-detailed-full.jpg`,
`after-coach-desktop.jpg`, `after-coach-mobile-light.jpg`,
`after-more-menu.jpg`, `after-lab-tableau-light.jpg`.
