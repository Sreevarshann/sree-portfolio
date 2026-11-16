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

### Color tokens (`src/app/globals.css`, light in `src/app/theme-light.css`)
| Token | Dark | Light |
| --- | --- | --- |
| `--bg` | `#08090c` graphite | `#f6f4ef` porcelain |
| `--surface` | `#111620` midnight | `#efece5` warm stone (wells); cards are `#ffffff` sheets |
| `--fg` | `#eef1f6` | `#0d1526` navy ink |
| `--fg-muted` | `#8b95a7` | `#5d6474` (5.4:1 on porcelain) |
| `--accent` | `#4f8fff` electric blue | `#2149d8` harbor cobalt (6.3:1) |
| `--accent-solid` | `#2659d1` (white text ≥ 4.5:1) | `#2149d8` (white text 7:1) |

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

## V4 — motion system and dynamic island

### Dynamic island
- Two states, `expanded` (top of page) and `compact` (scrolled), with hysteresis (condense past 64px, re-expand under 24px) so scroll jitter and rapid reversals never flicker.
- The capsule is content-sized (`width: max-content`, capped at the viewport). Its `min-width` springs between the full bar (1240px) and a **measured** compact width (`--island-compact`: monogram + link list + icon-only actions), so it lands exactly on its content.
- Labels ("Ask My AI", the full name beside SS) collapse with a `0fr` grid track, which removes their width from layout instead of only fading them. That was the root cause of the old overflow: the faded-out name kept ~80px, pushing the AI launcher and theme toggle outside the fixed 1080px capsule from 1536px up.
- If the links ever stop fitting (long labels, browser zoom), the island switches to its menu layout instead of overflowing. Below 1280px it is always the menu layout; below 360px controls tighten to 34px.
- `tests/e2e/island.spec.ts` asserts every control's bounding box sits inside the capsule at 14 widths, in both states, after rapid scroll reversals, mid-transition resizes, theme switches and reduced motion.

### Motion tokens
`--dur-xs/s/m/l/xl` (160–900ms) and `--ease-out`, `--ease-in-out`, `--ease-emph`, `--ease-spring`, `--ease-spring-soft` in `globals.css`, mirrored for JS in `src/lib/motion.ts`.

### Motion patterns
| Pattern | Where | Mechanism |
| --- | --- | --- |
| Masked rise | Text reveals site-wide | CSS scroll timeline, clip-path (text never at reduced opacity) |
| Stage window | Featured project media | Clip-path window + settle from slight zoom |
| Signature glow | Each project (own hue) and the contact close | Scroll-linked radial light |
| Restrained tilt | Project media, hero portrait | Pointer over the element only, fine pointers, rAF |
| Data path | Featured projects | Documented first-row architecture nodes, travelling pulse |
| Story sequence | Achievements | `InView` once → CSS choreography; static markup is the final state |
| Confirmation sweep | Lab chart updates | Brief accent sweep after each re-render |
| Harbor light | Footer contour line | Single dash travelling a path |

All motion respects `prefers-reduced-motion`. The WebGL hero field only starts on capable devices (no Save-Data, ≥4 GB device memory, and not a ≤4-core touch device); others keep static contours.

## V5 — personal hero, portrait and toolkit

- **Hero:** an availability pill ("Available for full-time opportunities", breathing green dot, static under reduced motion) sits in the hero's top row, never in the navigation island. The name stays the `h1`; the headline is unchanged; a two-sentence first-person intro, a facts row (Boston · AI/Data/Software · Northeastern) and the three employer logos (linking to their experience entries) replace the old stat strip and role ticker.
- **Portrait print:** `PortraitSwap` is a slightly rotated photographic print (mat, blue tape, mono caption, serif annotation). With both assets it starts illustrated and reveals the photograph through a circular `clip-path` that grows from the pointer; touch and keyboard toggle it (`aria-pressed`); reduced motion crossfades. Without assets it shows a pixel-mosaic placeholder — no face, no generated image.
- **Tools & Technologies:** two CSS marquee rows in opposite directions. Each track holds the same group twice and each group carries its trailing gap as padding, so `translateX(-50%)` is exact at any width, zoom or font; nothing is measured. Edges fade with `mask-image`. JS only eases `playbackRate` toward 0.08 on hover and pauses off-screen rows. Duplicates are `aria-hidden`; reduced motion shows one wrapped, still list. Hands-on tools have solid tiles; exploring tools dashed.
- **Scroll-out:** the hero's recede-on-scroll now runs only at ≥1024px; on phones the portrait and facts below the fold stay fully legible.
- **Footer:** "Last updated · Month Year" from the build time.

## V7 — Quick / Detailed experiences and intelligent navigation

- **Two presentations, one content source.** `html[data-view]` is set before paint by `viewScript` (from `?view=`, then `localStorage["sree:view"]`, else Quick). `.v-quick` / `.v-detailed` blocks are both server-rendered and hidden with `display:none` by view, so there is no hydration mismatch or flash, crawlers see everything, hidden blocks leave the accessibility tree, and lazy media inside them never loads. `setView` (src/lib/viewMode.ts) updates the attribute, storage and `?view=` with `history.replaceState` (no history entries), keeps the reader's section in place (`data-view-anchor`), and crossfades with the View Transitions API when motion is allowed.
- **View switch.** A labelled group of two toggle buttons in the island (homepage only), full labels when expanded, "Quick / Detailed" when compact or narrow; its thumb position comes from CSS, not hydration.
- **Coach mark.** `ViewCoachMark` appears once (`localStorage["sree:coach:view"]`), on the homepage in Quick View, after idle time. Floating UI anchors it to the switch (flip/shift/arrow, frame-accurate while the island springs); it is non-modal, closes on Escape, Dismiss, Explore details, switching views or scrolling past the hero, and returns focus to the switch.
- **Navigation registry.** `src/lib/nav.ts` defines the four primary items, the More menu (Education, Certifications, Lab, Contact, Tableau Public), route ownership (`/projects/*` → Projects) and homepage section ownership (`data-nav-section`). `useActiveNav` highlights the owner of the section under a 38% activation line (route matches use `aria-current="page"`, homepage sections `"location"`; More shows `"true"` when one of its items is current).
- **Spacing system.** `--space-chapter` (section owns only its top gap) and `--space-head`; see docs/v7/AUDIT.md for before/after measurements.
- **Tableau Public.** Profile link in contact, footer, More menu and the toolkit; the Lab lists the three public dashboards by their real titles (linked, not embedded).

## V8 — Harbor Daylight: the light theme

The light theme is its own design, not an inversion. Dark is Boston Harbor at night: graphite water, luminous contour lines, glass that glows. Light is the same harbor at first light, printed as a fine nautical chart: warm porcelain paper, navy ink engraving, harbor cobalt as the chart ink, and morning light (apricot sun, pale sky) washing across the page. Depth comes from light and shadow, never from glow.

All of it lives in `src/app/theme-light.css`, loaded after `globals.css`, and every rule is scoped to `:root[data-theme="light"]`. Components only gained inert class hooks (`hero-wash`, `project-preview`, `footer-horizon`, …) and one light-only element (`.footer-sky`, `display: none` in dark).

### Palette
| Role | Value | Use |
| --- | --- | --- |
| Paper | `#f6f4ef` porcelain | page canvas; warm paper tooth instead of grey noise |
| Sheet | `#ffffff` | cards, hairline grids, mats, glass highlights |
| Ink | `#0d1526` / `#2c3446` / `#5d6474` | text, contour lines, skyline drawing |
| Harbor cobalt | `#2149d8`, text `#1a3bb8` | accents, links, pointer lens, focus |
| Morning light | apricot `246 150 92`, sky `120 160 250`, lilac `164 146 255` | decorative washes only, never text |

Selection reads like a highlighter on paper (apricot), not a blue block.

### Depth
Three tinted elevations (`--e1`, `--e2`, `--e3`): a hairline contact ring, a short key shadow and a long ambient shadow tinted toward harbor blue. Cards are white sheets (no grey fades); hairline grids become one sheet ruled into cells; project screenshots sit in a white mat with a shadow tinted by the project's own hue, like prints on a light table.

### Liquid glass in daylight
A clear body (`rgb(255 255 255 / .56)`) with `blur(20px) saturate(180%) brightness(1.08)`, a bright lens rim on top, a faint ink line underneath for thickness, an inner glow, and a prism edge where light refracts: cool blue on the left, warm sun on the right. The current-page marker and the Quick/Detailed thumb are raised white lenses, like a daylight segmented control.

### Signature details
- **Daylight chart (hero WebGL).** The same shader in a light branch (`uLight`): navy ink lines, cobalt where the pointer lifts the terrain, and faint depth bands shading from harbor blue to sunlit sand. Rendered at DPR 1.5 (1.0 on touch) because ink lines show softness that glowing lines hide; it still pauses off screen and drops to 30 fps while the pointer is idle.
- **Sun behind the print.** The portrait is a white gallery print with apricot washi tape; a sun glow is anchored to the print so it stays with it at every width.
- **Inked swash.** Italic accent words in headings get a hand-inked apricot stroke that draws in as the heading arrives (an annotation on the chart). The word keeps its cobalt ink and full contrast.
- **Engraved numerals.** Project index numbers are engraved in the project's hue with a watercolor fill; rank numerals are pressed in ink that deepens toward harbor blue.
- **Dawn footer.** The night skyline becomes Boston at first light: an ink drawing over a warm horizon, a sun that rises behind the Zakim cables as the footer arrives (clipped exactly at the drawing's water line, aligned with the towers at every width), warm water mirroring the sky, and a sunlight glint travelling the water.
- **Morning everywhere else.** A sunrise behind the contact call to action that spills into the footer, a soft aurora on the Sree AI panel, chart paper ruled in cobalt behind interior page headers.

### Motion
| Moment | Light | Reduced motion |
| --- | --- | --- |
| Theme switch (both directions) | The new theme grows as a circle from the toggle (View Transitions API) | Instant change |
| Daybreak | The hero's morning light comes up on arrival | Static |
| Developing print | The placeholder mosaic develops like a photograph | Static |
| Swash | Accent strokes draw in after the heading rises | Shown complete |
| Sunrise | The footer sun rises with scroll (scroll-driven) | Final position |
| Tactile lift | Buttons and toolkit keycaps lift toward the light on hover | Static |

### Keeping dark untouched
A computed-style fingerprint of every element (and its `::before`/`::after`) on 13 routes at desktop and phone sizes, 45 properties each, is compared before and after. Result for this release: no changes in dark apart from Plotly's random clip-path ids and the new light-only element, which is `display: none` in dark. `tests/e2e/light-theme.spec.ts` also pins a sample of dark values (surfaces, glass, buttons, footer) so a future light change cannot leak into dark.

