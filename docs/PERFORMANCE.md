# Performance

Measured with Lighthouse 12 against a local production build (`next build && next start`), Chromium headless, default throttling (mobile: simulated slow 4G + 4× CPU; desktop preset). Scores vary by a few points between runs; the table is one full run taken on 2026-11-12 after the V2 refinements.

| Route | Form factor | Performance | Accessibility | Best practices | SEO | LCP | TBT | CLS |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `/` | mobile | 91 | 100 | 100 | 100 | 3.5 s | 40 ms | 0 |
| `/` | desktop | 100 | 100 | 100 | 100 | 0.8 s | 0 ms | 0 |
| `/projects` | mobile | 90 | 100 | 100 | 100 | 3.7 s | 30 ms | 0 |
| `/projects` | desktop | 100 | 100 | 100 | 100 | 0.7 s | 0 ms | 0 |
| `/projects/aegis-ai` | mobile | 94 | 100 | 100 | 100 | 3.0 s | 10 ms | 0 |
| `/projects/aegis-ai` | desktop | 100 | 100 | 100 | 100 | 0.7 s | 0 ms | 0 |
| `/lab` | mobile | 95 | 100 | 100 | 100 | 2.9 s | 10 ms | 0 |
| `/lab` | desktop | 100 | 100 | 100 | 100 | 0.7 s | 50 ms | 0 |
| `/about` | mobile | 95 | 100 | 100 | 100 | 2.9 s | 10 ms | 0 |
| `/about` | desktop | 100 | 100 | 100 | 100 | 0.7 s | 0 ms | 0 |
| `/experience` | mobile | 93 | 98 | 100 | 100 | 3.2 s | 20 ms | 0.003 |
| `/experience` | desktop | 100 | 98 | 100 | 100 | 0.7 s | 0 ms | 0.001 |

`/experience` accessibility was 98 in this run because of a heading-order issue; it has since been fixed (role titles are `h2` on that page) but not re-measured in this table.

## V7 scroll smoothness audit (2026-11-13)

Method: production builds of `main` (0f8cd86) and this branch served locally; a
Playwright + Chrome DevTools Protocol harness scrolls the whole homepage
(Quick View) over 9 s with `requestAnimationFrame`, recording frame deltas,
long tasks and the renderer's script, layout and style time. Runs alternate
between builds to share machine conditions. Mobile = Pixel 7 emulation with
4x CPU throttling. Averages of 3 runs (mobile) and 4 runs (desktop).

| Main-thread work during the scroll | main | branch | change |
| --- | --- | --- | --- |
| Mobile 4x: total task time | 4537 ms | 3060 ms | -33% |
| Mobile 4x: layout | 392 ms | 158 ms | -60% |
| Mobile 4x: style recalculation | 813 ms | 383 ms | -53% |
| Mobile 4x: script | 460 ms | 350 ms | -24% |
| Desktop: layout | ~105 ms | ~61 ms | -42% |
| Desktop: style recalculation | ~235 ms | ~170 ms | -28% |

Frame pacing was already 60 fps (p50 16.7 ms) on both builds; dropped frames
appeared sporadically on both and track host load, not the build. No long
tasks were observed during a stepped scroll on either build.

What the audit found and what changed:

- About 35 looping SVG/CSS decorations kept animating while far off screen,
  forcing a style recalculation every frame. `AnimationGovernor` pauses them
  only while out of view (resuming 160px early), so nothing visible changes.
- Parallax ScrollTriggers were built for elements hidden by the current view.
  `MotionRuntime` now builds only for rendered elements, honours
  `data-parallax-min`, rebuilds on view/breakpoint change without duplicating
  and refreshes when page height changes. The live count is exposed as
  `html[data-motion-triggers]` for tests.
- The WebGL contour field already paused off screen (verified: renderer task
  time at the page bottom matches a page without WebGL) with DPR capped at
  1.25 (0.75 on touch). It now draws at 30 fps while the pointer is idle and
  at full rate while it moves.
- Measured and left as is: removing every `backdrop-filter` and stopping the
  marquee made no measurable difference; GSAP's own idle rAF loop is vendor
  code; Plotly never loads on the homepage (covered by a test).

## What keeps it fast

- **Above-the-fold text never waits for JavaScript.** Headline reveals are pure CSS and start visible (rising and sharpening), so first paint is the largest paint.
- **Scroll reveals are CSS scroll-driven animations** (`animation-timeline: view()`) using a clip mask, not opacity, so nothing is hidden before hydration and text is never rendered at reduced contrast.
- **Heavy code loads on demand:** the Sree AI chat and its Markdown renderer (first open or idle), GSAP (idle, only on pages with scroll-linked effects), Plotly (when a chart nears the viewport), the WebGL contour field (idle, fresh canvas per mount, paused off-screen).
- **Brand icons come from one cached SVG sprite** (`public/brand-icons.svg`) referenced with `<use>`, instead of inline paths repeated in HTML and the RSC payload.
- Only the fonts in use are shipped (Instrument Serif italic only).

## Earlier measurements

| Version | `/` mobile performance | Note |
| --- | --- | --- |
| V1 initial | 54 | Hero headline hidden until hydration; 2.2 s blocking task |
| V1 after fix | 92 | CSS-only above-the-fold motion |
| V2 before tuning | 88 | New nav, portrait, chat and motion added ~100 KB of eager JS |
| V2 final | 91 | Lazy chat + GSAP, icon sprite |
