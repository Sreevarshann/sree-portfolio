import { LogoImage } from "@/components/ui/LogoImage";
import { experience } from "@/content/experience";
import { RoleArt } from "./RoleArt";
import { TechChip } from "@/components/ui/TechChip";

function CompanyMark({ e }: { e: (typeof experience)[number] }) {
  if (e.logo)
    return (
      <span className="inline-flex items-center" style={{ height: Math.max(32, e.logo.display) }}>
        <LogoImage variant="light" src={e.logo.light} alt={`${e.company} logo`} width={e.logo.width} height={e.logo.height} fallback={e.company} className="w-auto" style={{ height: e.logo.display }} />
        <LogoImage variant="dark" src={e.logo.dark} alt={`${e.company} logo`} width={e.logo.width} height={e.logo.height} fallback={e.company} className="w-auto" style={{ height: e.logo.display }} />
      </span>
    );
  // Typographic identifier - deliberately not an imitation of any official logo.
  return (
    <span className="type-mark inline-flex items-center gap-3">
      <span className="relative inline-flex h-9 w-9 items-center justify-center overflow-hidden rounded-[10px] bg-gradient-to-br from-[var(--surface-2)] to-[var(--bg)] text-[0.78rem] font-semibold tracking-[-0.02em] text-fg ring-1 ring-line-strong">
        {e.monogram}
        <span className="absolute inset-x-0 bottom-0 h-[2px] bg-gradient-to-r from-transparent via-accent to-transparent" aria-hidden="true" />
      </span>
      <span className="flex flex-col leading-tight">
        <span className="text-[0.98rem] font-semibold tracking-[-0.02em] text-fg">{e.company}</span>
        <span className="mono text-[0.62rem] uppercase tracking-[0.14em] text-fg-muted">{e.location}</span>
      </span>
    </span>
  );
}

export function ExperienceTimeline({ compact = false, headingLevel = 3 }: { compact?: boolean; headingLevel?: 2 | 3 }) {
  const Heading = headingLevel === 2 ? "h2" : "h3";
  return (
    <ol className="relative">
      <span className="absolute bottom-0 left-[7px] top-2 w-px bg-line md:left-[calc(25%+7px)]" aria-hidden="true">
        <span data-progress className="absolute inset-0 origin-top bg-gradient-to-b from-accent to-accent/30" />
      </span>
      {experience.map((e) => (
        <li key={e.slug} id={compact ? undefined : e.slug} className="relative grid scroll-mt-28 gap-6 pb-16 pl-8 last:pb-0 md:grid-cols-[25%_1fr] md:gap-10 md:pl-0">
          <span className="absolute left-0 top-2 h-[15px] w-[15px] rounded-full border-2 border-accent bg-bg md:left-[25%]" aria-hidden="true" />
          <div className="md:pr-10 md:text-right" data-reveal>
            <p className="mono text-sm text-fg">{e.period}</p>
            <p className="mt-1 text-sm text-fg-muted">{e.location}</p>
          </div>
          <div className="md:pl-10" data-reveal>
            <div className="panel overflow-hidden">
              <div className="grid gap-6 p-6 md:grid-cols-[1fr_180px] md:p-8">
                <div>
                  {e.url ? (
                    <a href={e.url} target="_blank" rel="noopener noreferrer" className="inline-block" aria-label={`${e.company} website`}>
                      <CompanyMark e={e} />
                    </a>
                  ) : (
                    <CompanyMark e={e} />
                  )}
                  <Heading className="mt-5 text-2xl font-medium tracking-[-0.03em] md:text-[1.75rem]">{e.role}</Heading>
                  <p className="mt-1 text-fg-muted">{e.company}</p>
                  <p className="mt-4 leading-relaxed text-fg-soft">{e.summary}</p>
                </div>
                <div className="hidden h-[110px] rounded-xl border border-line bg-bg p-2 md:block">
                  <RoleArt motif={e.motif} />
                </div>
              </div>
              <dl className="grid grid-cols-1 gap-px border-t border-line bg-line sm:grid-cols-3">
                {e.outcomes.map((o) => (
                  <div key={o.label} className="bg-bg-elev px-6 py-4">
                    <dt className="sr-only">{o.label}</dt>
                    <dd className="text-2xl font-medium tracking-[-0.03em] text-accent-fg">{o.value}</dd>
                    <dd className="text-xs text-fg-muted">{o.label}</dd>
                  </div>
                ))}
              </dl>
              {!compact && (
                <div className="border-t border-line p-6 md:p-8">
                  <ul className="space-y-3">
                    {e.highlights.map((h) => (
                      <li key={h} className="flex gap-3 leading-relaxed text-fg-soft">
                        <span className="mt-[0.6em] h-1 w-3 shrink-0 rounded-full bg-accent" aria-hidden="true" />
                        <span>{h}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <ul className="flex flex-wrap gap-1.5 border-t border-line px-6 py-4 md:px-8" aria-label="Technologies">
                {e.stack.map((s) => (
                  <li key={s}>
                    <TechChip name={s} />
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </li>
      ))}
    </ol>
  );
}
