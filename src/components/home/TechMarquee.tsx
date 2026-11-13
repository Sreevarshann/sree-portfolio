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
        style={{ ["--cl" as string]: ink(logo.color), ["--cd" as string]: ink(logo.darkColor ?? logo.color) }}
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
    <li className="tech-tile" data-level={tech.level}>
      <Logo tech={tech} />
      <span className="tech-name">{tech.name}</span>
      {tech.level === "exploring" && <span className="sr-only"> (exploring)</span>}
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

/** The same catalog as a static, linked list: where each tool was used. */
export function TechCatalog() {
  return (
    <details className="tech-catalog group">
      <summary className="tech-catalog-summary">
        <span>Where I&apos;ve used each one</span>
        <span className="tech-catalog-chevron" aria-hidden="true">↓</span>
      </summary>
      <div className="mt-8 grid gap-x-10 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
        {TECH_CATEGORIES.map((cat) => (
          <section key={cat} aria-label={cat}>
            <h3 className="eyebrow">{cat}</h3>
            <ul className="mt-4 space-y-3">
              {technologies
                .filter((t) => t.category === cat)
                .map((t) => (
                  <li key={t.id} className="text-sm leading-relaxed">
                    <span className="font-medium text-fg">{t.name}</span>
                    {t.level === "exploring" ? (
                      <span className="text-fg-muted"> — exploring{t.note ? `; ${t.note.charAt(0).toLowerCase()}${t.note.slice(1)}` : ""}</span>
                    ) : (
                      <span className="text-fg-muted">
                        {" — "}
                        {t.usedIn.map((id, i) => {
                          const ev = evidence[id];
                          if (!ev) return null;
                          const sep = i === 0 ? "" : ", ";
                          return (
                            <span key={id}>
                              {sep}
                              {ev.href.endsWith(".pdf") ? (
                                <a href={ev.href} target="_blank" rel="noopener" className="link-u text-fg-soft hover:text-fg">{ev.label}</a>
                              ) : (
                                <Link href={ev.href} className="link-u text-fg-soft hover:text-fg">{ev.label}</Link>
                              )}
                            </span>
                          );
                        })}
                      </span>
                    )}
                  </li>
                ))}
            </ul>
          </section>
        ))}
      </div>
    </details>
  );
}
