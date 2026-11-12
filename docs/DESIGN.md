# Design

## Brief

Communicate four things immediately — who Sree is, what he does, what he has built, what he can build — with a familiar information architecture and an unmistakably personal execution. Premium, minimal, highly animated, never at the cost of usability.

## Three directions explored

### A. Harbor Contour — **chosen**
A topographic field of contour lines (rendered in WebGL) moves slowly behind oversized editorial type. The lines read as terrain, water and data at once: a quiet reference to the Charles River and Boston Harbor, and to the "surfaces" data pipelines produce. Display type is a tight grotesk (Geist) with a single italic serif accent (Instrument Serif) for emphasis; metadata uses a mono face set in small caps-style tracking.

- Distinctiveness: high — the contour field and the serif accent give a signature that isn't a template.
- Professional fit: strong — reads as engineering + design, not a game.
- Accessibility: decorative layer only; all content is plain HTML text with AA contrast in both themes.
- Performance: one full-screen triangle, ~40 lines of GLSL, capped DPR, paused off-screen and in hidden tabs, static frame under reduced motion.

### B. Signal Editorial
Swiss grid, monochrome, with live monospaced data annotations (latencies, test counts) running in the margins like a newspaper's stock ticker.
- Strong typography, but the annotation layer drifts toward "monitoring dashboard", which the brief explicitly avoids. Rejected.

### C. Blueprint
Drafting-table aesthetic: cyan line drawings, dimension lines, grid paper.
- Coherent, but a well-worn trope for engineering portfolios and hard to make feel warm in light mode. Rejected.

## System

### Color tokens (`src/app/globals.css`)
| Token | Dark | Light |
| --- | --- | --- |
| `--bg` | `#08090c` graphite | `#f5f6f8` cool white |
| `--surface` | `#111620` midnight | `#eef1f5` |
| `--fg` | `#eef1f6` | `#0d1117` |
| `--fg-muted` | `#8b95a7` | `#586273` |
| `--accent` | `#4f8fff` electric blue | `#1f5fe0` |
| `--accent-solid` | `#2659d1` (white text ≥ 4.5:1) | `#1f5fe0` |

The light theme is designed separately (deeper accent, softer shadows, contour alpha retuned), not inverted. Theme choice is stored in `localStorage`; with no stored choice the site follows the OS and reacts to changes. An inline script sets `data-theme` before first paint, so there is no flash.

### Type
- Display: Geist 560, −0.045em tracking, 0.92 line-height.
- Accent: Instrument Serif italic, used once per heading at most.
- Meta: Geist Mono, 0.72rem, 0.14em tracking, uppercase.

### Motion
| Pattern | Implementation | Reduced motion |
| --- | --- | --- |
| Opening sequence | Rule line draws, coordinates count to 42.3601° N, headline characters rise from masks (≈1.4 s, non-blocking) | Static |
| Kinetic headings | `KineticText`: per-character mask reveal, on mount or on scroll | Static |
| Scroll reveals | `MotionRuntime`: IntersectionObserver + GSAP, `clip` wipe variant for media; MutationObserver picks up late content | Shown immediately |
| Scroll-linked | statement words brighten with scroll; timeline progress line; light parallax | Off |
| Project transitions | React `<ViewTransition>` morphs a project's preview into the case-study hero | Off |
| Image sequences | Previews step through real screenshots on hover (touch: while centered) | Off |
| Cursor | Desktop-only trailing ring that grows over interactive elements; native pointer never hidden | Off |
| Avatar | Ask Sree mark rotates and breathes; arms pulse in sequence while thinking | Static |

All motion uses transforms/opacity/clip-path. JS-hidden states are armed only after scripts run, with CSS fallbacks so content can never stay hidden.

### Boston detail
A single restrained element: the footer's line drawing of the skyline meeting the Zakim Bridge cables, drawn on scroll, beside the coordinates and live Boston time.

### Ask Sree mark
Eight rounded capsules of two lengths around an open core, with an orbiting satellite. Blue → silver → white gradient defined by theme tokens. Original artwork; it intentionally avoids the irregular starburst of other AI marks.

### Charts
Categorical palette (blue, orange, aqua) validated for color-vision deficiency in both themes; every chart has a legend or direct labels, hover tooltips, filter controls as real radio groups and a data-table alternative.
