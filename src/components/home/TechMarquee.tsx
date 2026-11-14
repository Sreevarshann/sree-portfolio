import Link from "next/link";
import { evidence, technologies, techRows, TECH_CATEGORIES, type Tech } from "@/content/technologies";
import { MarqueeMotion } from "./MarqueeMotion";

function Logo({ tech }: { tech: Tech }) {
  const { logo } = tech;
  if (logo.kind === "sprite") {
    const ink = (c: string | undefined) => (c === "ink" ? "var(--fg)" : c);
    return (
      <svg
        className="tech-logo"
        viewBox="0 0 24 24"
        width="24"
        height="24"
        aria-hidden="true"
        fill="currentColor"
        style={{
          ["--cl" as string]: ink(logo.color),
          ["--cd" as string]: ink(logo.darkColor ?? logo.color),
          // The official JavaScript mark: black letters through a yellow square.
          ...(logo.backdrop ? { background: `linear-gradient(${logo.backdrop}, ${logo.backdrop}) center / 86% 86% no-repeat` } : {}),
        }}
      >
        <use href={`/tech-icons.svg#${logo.id}`} />
      </svg>
    );
  }
  if (logo.kind === "file") {
    // Tiny static SVGs (next/image adds nothing). Eager: lazy loading would
    // wait until a logo slides in from the edge and make it pop in.
    // eslint-disable-next-line @next/next/no-img-element
    return <img className="tech-logo" src={logo.src} alt="" width={24} height={24} decoding="async" />;
  }
  return (
    <span className="tech-logo tech-logo-text" aria-hidden="true">
      {logo.mark}
    </span>
  );
}

function Tile({ tech }: { tech: Tech }) {
  return (
    <li className="tech-tile">
      <Logo tech={tech} />
      <span className="tech-name">{tech.name}</span>
    </li>
  );
}

/**
 * Two infinite logo rows moving in opposite directions.
 *
 * Seamless by construction: each row's track holds the same group twice and
 * every group carries its trailing gap as padding, so the track is exactly two
 * group widths and translating it by -50% lands on an identical frame. That
 * holds at any viewport, zoom, font or theme because nothing is measured.
 * The duplicate is aria-hidden; screen readers hear each list once.
 * Pure CSS motion (works without JS); MarqueeMotion only eases the speed on
 * hover and pauses rows that are off screen. Reduced motion: a static list.
 */
export function TechMarquee() {
  return (
    <div className="tech-marquee">
      {techRows.map((row) => {
        const items = technologies.filter((t) => row.categories.includes(t.category));
        const style = { ["--n" as string]: items.length };
        return (
          <MarqueeMotion key={row.id} className="marquee" direction={row.direction} style={style}>
            <div className="marquee-track">
              <ul className="marquee-group" aria-label={row.label}>
                {items.map((t) => (
                  <Tile key={t.id} tech={t} />
                ))}
              </ul>
              <ul className="marquee-group" aria-hidden="true">
                {items.map((t) => (
                  <Tile key={t.id} tech={t} />
                ))}
              </ul>
            </div>
          </MarqueeMotion>
        );
      })}
    </div>
  );
}

/**
 * "Explore My Stack": a compact technical index (where each tool was used) under the
 * marquee. Native <details> (works without JS); the panel's height animates
 * to its exact content size via ::details-content where supported, and
 * toggles instantly elsewhere. Balanced CSS columns keep short categories from
 * leaving blank space. Tools without a verified usage context are omitted here.
 */
export function TechCatalog() {
  const groups = TECH_CATEGORIES.map((cat) => ({ cat, items: technologies.filter((t) => t.category === cat && t.usedIn.length > 0) })).filter((g) => g.items.length);
  return (
    <details className="tech-index">
      {/* Native <summary>: the browser exposes its expanded state; the label follows it. */}
      <summary className="tech-index-summary stack-pill" aria-controls="tech-index-body">
        <span className="stack-pill-label">
          <span className="stack-pill-closed">Explore My Stack</span>
          <span className="stack-pill-open">Hide My Stack</span>
        </span>
        <span className="stack-pill-chevron" aria-hidden="true">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M2.5 4.5 6 8l3.5-3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </summary>
      <div className="tech-index-body" id="tech-index-body">
        {groups.map(({ cat, items }) => (
          <section key={cat} className="tech-index-group" aria-label={cat}>
            <h3 className="tech-index-heading">{cat}</h3>
            <ul>
              {items.map((t) => (
                <li key={t.id} className="tech-index-row">
                  <span className="tech-index-name">{t.name}</span>
                  <span className="tech-index-where">
                    {/* At most three contexts per row, strongest first, so rows stay one line. */}
                    {t.usedIn.slice(0, 3).map((id, i) => {
                      const ev = evidence[id];
                      if (!ev) return null;
                      return (
                        <span key={id}>
                          {i > 0 && <span className="tech-index-sep" aria-hidden="true"> · </span>}
                          {i > 0 && <span className="sr-only">, </span>}
                          <Link href={ev.href} className="tech-index-link">{ev.label}</Link>
                        </span>
                      );
                    })}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </details>
  );
}
