import Link from "next/link";
import { experience } from "@/content/experience";
import { LogoImage } from "@/components/ui/LogoImage";

/** Logo heights tuned by eye so the three marks carry similar visual weight. */
const H: Record<string, number> = { rightrev: 22, "flare-innovation": 40, "sri-sairam-techno-incubator": 44 };

/**
 * Quick View experience: employer, role, dates and one standout outcome per
 * role, read in a glance. Full detail lives on /experience.
 */
export function ExperienceSnapshot() {
  return (
    <ol className="xp-snap grid gap-px overflow-hidden rounded-[22px] border border-line bg-line md:grid-cols-3">
      {experience.map((e, i) => {
        const top = e.outcomes[0];
        return (
          <li key={e.slug} className="xp-snap-card" data-reveal style={{ ["--i" as string]: i } as React.CSSProperties}>
            <Link href={`/experience#${e.slug}`} className="group flex h-full flex-col gap-6 bg-bg p-7 transition-colors duration-500 hover:bg-bg-elev md:p-8">
              <span className="flex h-12 items-center">
                {e.logo ? (
                  <>
                    <LogoImage variant="light" src={e.logo.light} alt={`${e.company} logo`} width={e.logo.width} height={e.logo.height} fallback={e.company} className="w-auto" style={{ height: H[e.slug] ?? 28 }} />
                    <LogoImage variant="dark" src={e.logo.dark} alt={`${e.company} logo`} width={e.logo.width} height={e.logo.height} fallback={e.company} className="w-auto" style={{ height: H[e.slug] ?? 28 }} />
                  </>
                ) : (
                  <span className="text-lg font-semibold">{e.company}</span>
                )}
              </span>
              <span>
                <span className="block text-[1.15rem] font-medium tracking-[-0.02em] text-fg">{e.role}</span>
                <span className="mt-1 block text-sm text-fg-muted">
                  {e.company} · <span className="mono text-[0.8rem]">{e.period}</span>
                </span>
              </span>
              {top && (
                <span className="mt-auto flex items-baseline gap-3 border-t border-line pt-5">
                  <span className="xp-snap-value text-[2rem] font-medium leading-none tracking-[-0.04em] text-fg">{top.value}</span>
                  <span className="text-sm leading-snug text-fg-soft">{top.label}</span>
                </span>
              )}
              <span className="sr-only">Read more about this role</span>
            </Link>
          </li>
        );
      })}
    </ol>
  );
}
