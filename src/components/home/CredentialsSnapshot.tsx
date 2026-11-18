import Link from "next/link";
import { education } from "@/content/credentials";
import { LogoImage } from "@/components/ui/LogoImage";

/**
 * Education: one card per university with its official mark on a white
 * plate, degree, GPA and date. Certifications have their own section.
 */
export function CredentialsSnapshot() {
  return (
    <div>
        <ul className="grid gap-5 md:grid-cols-2 md:gap-6">
          {education.map((ed, i) => {
            const logo = ed.logos.find((l) => l.show === "compact") ?? ed.logos[0];
            return (
              <li
                key={ed.institution}
                className="edu-card lux lux-edu panel group relative flex items-center gap-5 p-6 md:gap-7 md:p-8"
                data-reveal
                style={{ ["--i" as string]: i } as React.CSSProperties}
              >
                {/* Decorative academic linework: fine concentric arcs. */}
                <svg className="edu-geo" viewBox="0 0 200 200" aria-hidden="true">
                  {[92, 74, 56, 38].map((r, k) => (
                    <circle key={r} cx="200" cy="0" r={r * 1.6} style={{ ["--k" as string]: k }} />
                  ))}
                  <path d="M40 0 L200 160" />
                  <path d="M90 0 L200 110" />
                </svg>
                <span className="edu-emblem relative flex shrink-0">
                  <span className="logo-plate logo-plate-lg relative z-[1] flex items-center justify-center">
                    <LogoImage src={logo.light} alt={logo.alt} width={logo.width} height={logo.height} fallback={ed.institution.split(" ")[0]} className="h-full w-full object-contain" />
                  </span>
                </span>
                <span className="relative min-w-0 flex-1">
                  <span className="block text-[1.3rem] font-medium leading-tight tracking-[-0.025em] text-fg">
                    <Link href="/education" className="after:absolute after:inset-0 hover:text-accent-fg">
                      {ed.institution}
                    </Link>
                  </span>
                  <span className="mt-1 block text-[0.95rem] leading-snug text-fg-soft">
                    {ed.degree}, {ed.field}
                  </span>
                  <span className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5">
                    <span className="chip !py-1 text-[0.72rem]">
                      {ed.gpaLabel} {ed.gpa}
                    </span>
                    <span className="mono text-[0.72rem] text-fg-muted">{ed.date}</span>
                  </span>
                </span>
                <span className="lux-arrow" aria-hidden="true">→</span>
              </li>
            );
          })}
        </ul>
    </div>
  );
}
