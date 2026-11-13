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
| Avatar | Ask Sree mark rotates and breathes; arms pulse in sequence while thinking | Static |

All motion uses transforms/opacity/clip-path. JS-hidden states are armed only after scripts run, with CSS fallbacks so content can never stay hidden.

### Boston detail
A single restrained element: the footer's line drawing of the skyline meeting the Zakim Bridge cables, drawn on scroll, beside the coordinates and live Boston time.

### Ask Sree mark
Eight rounded capsules of two lengths around an open core, with an orbiting satellite. Blue → silver → white gradient defined by theme tokens. Original artwork; it intentionally avoids the irregular starburst of other AI marks.

### Charts
Categorical palette (blue, orange, aqua) validated for color-vision deficiency in both themes; every chart has a legend or direct labels, hover tooltips, filter controls as real radio groups and a data-table alternative.

## V2 refinements

### Liquid-glass navigation
A floating capsule (`.glass` in `globals.css`): backdrop blur with saturation, a tinted body, a pointer-following specular sheen, hairline top rim and a faint blue/rose chromatic edge that reads as refraction. It condenses on scroll (height, width, density) with a spring easing; a single indicator glides between links, following hover and resting on the current page. Below `xl` it becomes a compact capsule whose menu unfolds from it (focus-trapped, Esc and outside-tap close). Fallbacks: solid surface without `backdrop-filter`, under `prefers-reduced-transparency`, and a system border in forced-colors mode.

### Sree AI
Renamed from Ask Sree; CTA "Ask My AI". The mark was redrawn in deep ocean → electric blue → silver-white with a soft glow; while answering, its arms morph in a staggered wave and the glow pulses. The chat uses glass surfaces, a gradient user bubble, a typing indicator and spring-in messages.

### Portrait
A 4:5 editorial frame with an offset back plate, mask reveal, slow zoom-out and a single sheen, gentle scroll drift and a subtle pointer tilt (desktop, motion allowed). Placed asymmetrically beside the headline on large screens and as a small tile in the name row on phones, so it never competes with the headline. Until a real photo is added it shows a clearly labelled abstract placeholder — no generated face.

### Motion V2
- Project media arrive tilted back in space and settle flat; a second screenshot drifts at its own speed for depth (large screens).
- Section rules draw across as sections arrive; competition ranks rise out of a mask; lists stagger.
- Filters and Lab controls share the nav's gliding selection pill.
- The browser's own cursor is used everywhere; there is no cursor-following effect. The hero recedes as you scroll away; the footer skyline sits on a slow contour "echo" of the hero's field, so the page opens and closes on the same water lines.
- Everything entrance-related is CSS (scroll-driven where supported); GSAP is lazy-loaded only for scroll-linked parallax. Reduced motion shows final states.

### Root causes fixed in V2
- **White hero in dark mode (development):** React Strict Mode remounted the WebGL field; the cleanup had released the context and the remount reused the same canvas, which Chrome paints opaque white. Now each mount creates its own canvas.
- **Unstyled page in Safari on localhost:** the CSP's `upgrade-insecure-requests` made Safari fetch `http://localhost` CSS/JS over HTTPS. Removed (production is HTTPS-only via redirects + HSTS).
- **Plotly "Resize must be passed a displayed plot div element":** a resize observer could call Plotly after Strict Mode's fake unmount purged the chart, or while it was hidden. A lifecycle controller now guards every call (connected, displayed, plotted, not disposed), coalesces resizes per frame and disables Plotly's own responsive handler.

## V3 — personal branding

- **Identity.** The full name, Sreevarshan Sathiyamurthy, is the home page `h1`, the About heading and the basis of every title, Open Graph and manifest entry. "Sree" appears where a nickname is natural (the hero intro, the About lede, Sree AI).
- **SS monogram.** Two capitals in the site sans with slight positive tracking, set in a hairline ring that matches the glass navbar. On hover or focus the letters open up and a short accent rule draws in underneath. It links home with the label "Sreevarshan Sathiyamurthy — Home" and is also the favicon (`src/app/icon.tsx`) and portrait placeholder.
- **About.** First person, about 70 words: one statement with highlighted phrases, a "Now" line, two short cards (what I do, what I'm working toward), then focus-area chips. On phones the statement comes first, then the portrait and facts.
- **Cursor.** No custom cursor or cursor-following effect; the browser's own pointer is used everywhere.
