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
export function ExperienceSnapshot() {
  return (
    <ol className="xp-tiles grid gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
      {experience.map((e, i) => (
        <li key={e.slug} className="flex min-w-0" data-reveal style={{ ["--i" as string]: i } as React.CSSProperties}>
          <article aria-labelledby={`xp-${e.slug}`} className="xp-tile panel group relative flex w-full min-w-0 flex-col p-6 md:p-7">
            {/* Official artwork on a white plate in both themes, like the
                education logos: legible and never recoloured. */}
            <span className="xp-tile-logo logo-plate flex h-16 w-fit items-center">
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
