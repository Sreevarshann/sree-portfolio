import { technologies, techRows, type Tech } from "@/content/technologies";
import { MarqueeMotion } from "./MarqueeMotion";
import { TechLogo as Logo } from "./TechLogo";
import { SkillExplorerLazy } from "./SkillExplorerLazy";

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
 * "Explore My Stack": the Skill Explorer under the marquee. Native <details>
 * (the pill works without JS); the panel's height animates to its content
 * via ::details-content where supported. Inside: a searchable, filterable
 * index of verified skills (see SkillExplorer).
 */
export function TechCatalog() {
  return (
    <details className="tech-index" id="explore-stack">
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
        <SkillExplorerLazy />
      </div>
    </details>
  );
}
