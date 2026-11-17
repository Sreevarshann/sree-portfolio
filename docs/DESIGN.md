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
| `--bg` | `#08090c` graphite | `#f7f9fc` arctic canvas |
| `--surface` | `#111620` midnight | `#eff3f9` cool well; cards are `#ffffff` sheets |
| `--fg` | `#eef1f6` | `#101d33` deep navy (16:1) |
| `--fg-muted` | `#8b95a7` | `#52637b` (5.8:1) |
| `--accent` | `#4f8fff` electric blue | `#2b63df` blue (5.0:1; accent text `#1e4fc0`, 6.8:1) |
| `--accent-solid` | `#2659d1` (white text ≥ 4.5:1) | `#2b63df` (white text 5.3:1) |

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

## V9: Arctic, the light theme

V8 ("Harbor Daylight") gave light mode its own design, but its warm porcelain, apricot sun and sunset footer read as a sunrise. V9 replaces that atmosphere with a cool, architectural identity while keeping every structure, hook and motion from V8. Dark is Boston Harbor at night; light is the same harbor on a clear winter morning, drawn like a survey: cool white canvas, deep navy type, blue-grey contour lines, frosted glass, and one restrained electric blue for what matters. Neutral surfaces carry the page; blue is the accent, never the wallpaper.

Everything lives in `src/app/theme-light.css` (loaded after `globals.css`, every rule scoped to `:root[data-theme="light"]`). The theme-switch animation lives in `globals.css` and `ThemeToggle.tsx` and is deliberately untouched; `tests/unit/theme-transition.test.ts` pins both byte for byte.

### Semantic tokens
| Role | Token | Value |
| --- | --- | --- |
| canvas / canvas-muted | `--bg` / `--surface` | `#f7f9fc` / `#eff3f9` |
| surface-elevated | `--bg-elev` | `#ffffff` |
| text-primary / text-secondary | `--fg` / `--fg-muted` | `#101d33` (16:1) / `#52637b` (5.8:1) |
| accent / accent text | `--accent` / `--accent-fg` | `#2b63df` (5.0:1) / `#1e4fc0` (6.8:1) |
| accent-soft | `--accent-soft` | `rgb(43 99 223 / .08)` |
| border / border-strong | `--line` / `--line-strong` | navy at 10% / 17% |
| shadow tint | `--shade` | `34 58 108` blue-grey |
| ambient (decorative only) | `--electric`, `--ice`, `--glacier`, `--periwinkle` | `74 139 255`, `226 236 253`, `116 200 232`, `140 152 255` |
| glass | `--glass-tint`, `--glass-shadow` | `rgb(251 252 255 / .62)`, cool layered shadow |
| focus-ring | `--focus-ring` | `rgb(43 99 223 / .32)` |
| contour-stroke | `--contour-ink`, `--contour`, `--contour-warm` | `44 64 104` lines, `43 99 223` pointer lens, `116 200 232` height tint |

Status colors, brand logos, Plotly series colors and each project's small category marks keep their own hues.

### Depth
Three elevations (`--e1`, `--e2`, `--e3`): a hairline contact ring, a short key shadow and a long ambient shadow tinted blue-grey. Cards are white sheets; hairline grids are one sheet ruled into cells; project screenshots sit in a white mat over a soft ice bloom with a neutral shadow, so warm-hued projects never wash the canvas.

### Frosted daylight glass
`rgb(251 252 255 / .62)` with `blur(22px) saturate(170%) brightness(1.06)`, a bright lens rim, a faint navy line underneath for thickness, an inner frost and a cold prism edge (electric blue to glacier). The current-page marker is a raised white lens with a fine electric underline of light.

### Signature details
- **Survey contours (hero WebGL).** The light shader branch draws blue-grey survey lines that turn electric where the pointer lifts the terrain, over faint depth bands shading from blue to glacier on the high ground.
- **Cold halo behind the print.** The portrait is a white print with frosted tape; an icy halo is anchored to the print at every width.
- **Dimension line.** Italic accent words get a precise electric double rule that draws in as the heading arrives.
- **Winter morning footer.** Boston as a navy ink drawing over a cold, clear sky; a pale winter sun (white disc, fine blue rim, icy halo) rises behind the Zakim cables with scroll, cut exactly at the water line; ice-blue water and an electric glint travelling the water line.
- **Cold air elsewhere.** Ice light behind the contact call to action, a cold aurora on the Sree AI panel, a survey grid ruled in blue behind interior page headers.

### Motion
| Moment | Light | Reduced motion |
| --- | --- | --- |
| Theme switch | Unchanged: circular reveal from the toggle in Chromium browsers, cross-fade in Safari | Instant |
| First light | The hero haze clears in on arrival | Static |
| Developing print | The placeholder mosaic develops | Static |
| Dimension line | Accent rules draw in after the heading rises | Shown complete |
| Winter sun | The footer sun rises with scroll | Final position |
| Tactile lift | Buttons and keycaps lift on hover | Static |

### Keeping dark untouched
The computed-style fingerprint (every element and `::before`/`::after`, 13 routes, desktop and phone, 45 properties) shows no dark changes apart from Plotly's random clip-path ids and the light-only footer sun inside its `display: none` sky. `tests/e2e/light-theme.spec.ts` pins dark samples, asserts no warm colors anywhere in light, and checks the contour ink is blue-dominant.

## V9: achievements-first homepage

The homepage is a 30-second overview; dedicated pages hold the detail. The order is fixed and identical in Quick and Detailed View:

1. **Hero:** introduction, portrait-first on phones, availability, calls to action.
2. **Achievements:** the two verified results first. Large ranking numerals (the SAUVC numeral counts down from the 320+ team field to 6th), the original field and podium graphics from the Achievements page, the result line, event and project, a card link to the full write-up, the original LinkedIn result post, and "View all achievements". Detailed View adds one sentence per result.
3. **Education:** Northeastern and Anna University as prominent cards with their marks on white plates, degree, GPA and date; certifications follow as one compact row with verification links.
4. **Experience:** the snapshot (Quick) or compact timeline (Detailed), linking to /experience.
5. **Technology stack:** the logo marquee and Explore My Stack, unchanged.
6. **Projects:** a compact gallery (3 cards in Quick, 6 in Detailed; 3 columns on desktop, 2 on tablet, 1 on phone). Each card has real screenshots that step through on hover, the project's categories, name, one line, three technologies, Case study and GitHub; "View all projects" leads to the full set.
7. **Contact:** email, LinkedIn, GitHub and Tableau Public.
8. **Footer:** the Boston skyline.

Removed from the homepage: the My Approach statement (component, styles, animation, nav mapping and view anchor), What I build, the Lab teaser and the Sree AI promo. The Lab and Sree AI remain reachable from the island, the More menu, the floating launcher and their own pages.

Navigation mapping (`HOME_SECTIONS` in `src/lib/nav.ts`): hero → Home (SS), achievements → Achievements, education → Education and certifications → Certifications (More), experience → Experience, tools → About (the stack lives in About › Skills), projects → Projects, contact → Contact (More). `tests/e2e/v7-refine.spec.ts` asserts the exact order in both views, that Achievements follows the hero directly, and that the gallery links every case study and repository.

## V10: aligned achievements, Boston sunrise, conversational Sree AI

**Achievements.** The two cards are one pair: each is a CSS subgrid spanning the same six rows of the parent grid (rank and graphic, result label, title, project, description, actions). Every row is as tall as the taller card's content, so titles, labels, descriptions and actions line up exactly at any width with no per-card offsets; the graphic region shares one height (smaller on phones). `tests/e2e/v7-refine.spec.ts` measures every row in both cards at 1440, 1024 and 820px in both themes and views.

**Light footer: Boston sunrise.** The one warm moment in the light theme, kept inside the footer. A golden sun (warm white core, golden body, slightly deeper limb, soft edge, light falling off through amber into peach) emerging from the harbor behind the Zakim cables; peach and amber horizon light only around the sun, masked before the sky's edges; a pale-blue morning sky; a thin band of haze; the sun's reflection on the water; and the skyline as a pale silhouette (light only) that blocks the glow like real towers. The light breathes on an 11 s cycle (opacity only), paused off screen and off under reduced motion. The rise is scroll-driven and completes once the sun is fully in view. Dark keeps the moon and stars; the theme-switch animation is unchanged.

**Sree AI.** One model call per message. Deterministic intents add `hiring`, `casual`, `private` and `knowledge`, and each question gets an answer mode that the user turn names. The system prompt separates five kinds of statement (verified facts, evidence-based assessments, general knowledge, humour, unknowns), so the assistant can be warm and confident without inventing biography. A sentence gate drops guarantees, commitments on Sree's behalf, money, literal superlatives and immigration claims before they are streamed. A short Groq rate limit is retried once. The published availability line is a shared profile fact. Evaluation method and results: `docs/ai-eval/`.

**Resume.** Every resume link carries the PDF's hash (`?v=`), so a new file is never served from a stale cache; `tests/unit/resume.test.ts` keeps the version in step with the file.

## V11: real media

All photos and video come from one typed manifest, `src/content/media.ts`; components read paths, sizes, alt text and captions from it. Every file is a derivative of the original Sree supplied: WebP or H.264 MP4, auto-oriented, with all metadata (including GPS) stripped. Nothing is generated or retouched; the only edits are pixelated QR codes and a third party's name (the badge's host) for privacy.

**Hero portrait.** The Spider-Man mask photo is the default top layer; the real photograph sits beneath in the same 4:5 frame (both photos share pose and framing, so no warping is needed). Hover, tap, Enter or Space dissolves the masked photo over about 650 ms: an opacity fade with a soft radial opening that grows from the pointer (a registered `--pswap-r`), while the real photo settles from a hair of zoom. The toggle's label names the next action. Reduced motion switches instantly.

**Achievement media.** Each achievement section on `/achievements` shows its own media between the summary and the technical details, so the homepage cards stay compact. SAUVC: the task-pass video (portrait, 1080p or 720p by viewport and Save-Data, attached only near the viewport, muted autoplay when in view, paused when away) beside its three photos. Google MLOps Expo: the Charlie demo featured above three thumbnails, and no video player. Photos open in a native `<dialog>` lightbox with captions, arrow keys, swipe, Escape, scroll lock and focus return.

**Ranking counter.** The 320 to 6 count reserves the widest value in tabular `ch` units, so every frame stays inside the numeral's box (which the scroll-driven rise clips to), and the running overlay carries its own text fill in light mode.

## V12: interaction polish, Skill Explorer, Recruiter Mode

**Portrait.** The reveal hint is a small glass label centred under the print, with a notch pointing straight up at the photograph ("Hover to reveal the real me" on pointer devices at 15 to 16px, "Tap to reveal the real me" on touch at 14px). It never intercepts pointer events. While the real photo shows, hover devices hide the hint (leaving restores Spider-Man) and touch devices read "Tap again for Spider-Man". The dissolve runs 800 ms (was 650 ms); CSS transitions reverse from the current state on rapid hover in and out. Personal photo labels read only "Sree" (hero print and About portrait).

**Onboarding hint.** Shown once per homepage entry: first visit, refresh, new tab, return visits and navigating back (a back/forward cache restore re-arms it via `pageshow`). Nothing is stored. Quick View only (it suggests Detailed View). It closes at an absolute deadline 3 s after it becomes visible, or on Escape, the close button, the switch or scrolling on. Automated test runs may opt out with `sree:e2e:no-coach`, honoured only when `navigator.webdriver` is true.

**SAUVC video.** No native controls and no control bar: the frame is one button (click, tap, Enter, Space). A short glyph confirms each toggle; a small play glyph stays only until the first play (autoplay refused or not attempted). A discreet corner button controls sound (the clip has real pool audio; it never unmutes by itself). Pauses off screen, in hidden tabs and on unmount.

**Mobile launcher.** Under 640px on the homepage the launcher is visible from the start, expanded on the hero and logo-only once the hero's bottom passes 70% of the viewport (one IntersectionObserver; state changes only on transitions). Its accessible name stays "Ask My AI". Desktop is unchanged.

**Skill catalog (`src/content/skillCatalog.ts`).** The single source of truth for verified skills. Each skill lists usage contexts (`evidence` ids: work, project, competition, this site, coursework, course, public work) with one sentence on what was done there. Technologies without documented usage are never skills; some are `relatedTopics` (Databricks, BigQuery, Kubernetes, PyTorch, ...) pointing to verified neighbours with an honest overlap note. The marquee's usage contexts (`technologies.usedIn`) are derived from it, and Sree AI's skill knowledge is built from it.

**Skill Explorer.** Inside Explore My Stack: search (exact, alias, partial word, small typos, employer or project name), category chips, verified result cards with evidence links, related-experience cards that are visibly not direct experience, and an empty state. Search is local and deterministic (`src/lib/skillSearch.ts`), with no network request per keystroke. The explorer mounts at idle or when the pill is approached, so the homepage's first-load JavaScript is unchanged. Deep link: `/?stack=<query>#tools`.

**Ask AI hand-off.** "Ask AI about this" opens the existing assistant with a canonical question and the canonical ids (`context: { skills, topics }`). The server validates the ids (format and catalog membership) and pins the matching records; clients cannot supply evidence. Questions that name a skill or an undocumented technology in free text pin the same records. A "Not documented: X" record tells the model X was never used.

**Recruiter Mode.** A General | Recruiter switch in the chat header changes starter prompts and answer framing (direct, related or transferable, not documented; no scores). "Compare a job description" maps pasted text against the catalog in the browser; the text is not sent or stored, and only canonical names reach the model if the visitor asks for a summary. The commitment gate also drops fit percentages and ATS-style scores.
