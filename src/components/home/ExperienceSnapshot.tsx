import Link from "next/link";
import { experience } from "@/content/experience";
import { LogoImage } from "@/components/ui/LogoImage";

/** Logo heights tuned by eye so the three marks carry similar visual weight. */
const H: Record<string, number> = { rightrev: 18, "flare-innovation": 36, "sri-sairam-techno-incubator": 44 };

/**
 * Homepage experience overview: one near-square tile per employer with the
 * logo, company, role, dates, one sentence and a "View details" link to the
 * full record on /experience. Everything else lives on that page.
 */
/**
 * Decorative engineering metaphors (not architecture diagrams): connected
 * agents for RightRev, a data pipeline for Flare, a sonar sweep for the AUV
 * work. On hover a light travels along the highlighted path once.
 */
function Motif({ kind }: { kind: "agents" | "pipeline" | "sonar" }) {
  return (
    <svg className="xp-motif" viewBox="0 0 160 120" aria-hidden="true" preserveAspectRatio="xMaxYMin meet">
      {kind === "agents" && (
        <>
          <path className="xp-wire" d="M24 30 L80 58 L136 26 M80 58 L80 104 M24 30 L40 92 L80 104 L132 88 L136 26" />
          <path className="xp-signal" pathLength={1} d="M24 30 L80 58 L136 26" />
          {[[24, 30], [80, 58], [136, 26], [80, 104], [40, 92], [132, 88]].map(([x, y]) => (
            <circle key={`${x}-${y}`} className="xp-node" cx={x} cy={y} r="3.4" />
          ))}
        </>
      )}
      {kind === "pipeline" && (
        <>
          <path className="xp-wire" d="M10 40 H58 C74 40 74 70 90 70 H150 M10 70 H58 M10 100 H58 C74 100 74 70 90 70" />
          <path className="xp-signal" pathLength={1} d="M10 40 H58 C74 40 74 70 90 70 H150" />
          {[[58, 40], [58, 70], [58, 100], [90, 70], [150, 70]].map(([x, y]) => (
            <rect key={`${x}-${y}`} className="xp-node" x={x - 4} y={y - 4} width="8" height="8" rx="2" />
          ))}
        </>
      )}
      {kind === "sonar" && (
        <>
          {[22, 40, 58, 76].map((r) => (
            <path key={r} className="xp-wire" d={`M${110 - r} 96 A ${r} ${r} 0 0 1 ${110 + r} 96`} />
          ))}
          <path className="xp-wire" d="M110 96 L54 34" />
          <path className="xp-signal" pathLength={1} d="M34 96 A 76 76 0 0 1 110 20" />
          <circle className="xp-node" cx="110" cy="96" r="3.6" />
          <circle className="xp-node" cx="72" cy="56" r="2.8" />
        </>
      )}
    </svg>
  );
}

export function ExperienceSnapshot() {
  return (
    <ol className="xp-tiles grid gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
      {experience.map((e, i) => (
        <li key={e.slug} className="flex min-w-0" data-reveal style={{ ["--i" as string]: i } as React.CSSProperties}>
          <article aria-labelledby={`xp-${e.slug}`} className={`xp-tile lux lux-xp panel group relative flex w-full min-w-0 flex-col p-6 md:p-7`} data-motif={e.motif}>
            <Motif kind={e.motif} />
            {/* Official artwork on a white plate in both themes, like the
                education logos: legible and never recoloured. */}
            <span className="xp-tile-logo logo-plate relative z-[1] flex h-16 w-fit items-center">
              {e.logo ? (
                <LogoImage src={e.logo.light} alt={`${e.company} logo`} width={e.logo.width} height={e.logo.height} fallback={e.company} className="w-auto" style={{ height: H[e.slug] ?? 28 }} />
              ) : (
                <span className="text-lg font-semibold text-[#101d33]">{e.company}</span>
              )}
            </span>
            <p className="eyebrow mt-6 truncate">{e.company}</p>
            <h3 id={`xp-${e.slug}`} className="mt-2 text-[1.25rem] font-medium leading-tight tracking-[-0.025em] text-fg">
              {e.role}
            </h3>
            <p className="mono mt-2 text-[0.78rem] text-fg-muted">{e.period}</p>
            <p className="mt-4 text-[0.95rem] leading-relaxed text-fg-soft">{e.brief}</p>
            <Link href={`/experience#${e.slug}`} className="xp-tile-link mt-auto inline-flex items-center gap-1.5 pt-6 text-sm font-medium text-accent-fg after:absolute after:inset-0 after:rounded-[inherit]">
              View details <span className="arrow" aria-hidden="true">→</span>
              <span className="sr-only">: {e.company}</span>
            </Link>
          </article>
        </li>
      ))}
    </ol>
  );
}
