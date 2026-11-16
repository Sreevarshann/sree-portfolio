import Link from "next/link";
import { education, certifications } from "@/content/credentials";
import { LogoImage } from "@/components/ui/LogoImage";

/**
 * Education first and prominent: one card per university with its official
 * mark on a white plate, degree, GPA and date. Certifications follow as one
 * compact row with their verification links. Each half is its own navigation
 * section (Education / Certifications).
 */
export function CredentialsSnapshot() {
  return (
    <div className="space-y-5 md:space-y-6">
      <section data-nav-section="education" aria-labelledby="edu-snap">
        <h3 id="edu-snap" className="sr-only">Education</h3>
        <ul className="grid gap-5 md:grid-cols-2 md:gap-6">
          {education.map((ed, i) => {
            const logo = ed.logos.find((l) => l.show === "compact") ?? ed.logos[0];
            return (
              <li
                key={ed.institution}
                className="edu-card panel group relative flex items-center gap-5 p-6 transition-[border-color,transform] duration-500 hover:-translate-y-1 hover:border-accent md:gap-7 md:p-8"
                data-reveal
                style={{ ["--i" as string]: i } as React.CSSProperties}
              >
                <span className="logo-plate logo-plate-lg flex shrink-0 items-center justify-center">
                  <LogoImage src={logo.light} alt={logo.alt} width={logo.width} height={logo.height} fallback={ed.institution.split(" ")[0]} className="h-full w-full object-contain" />
                </span>
                <span className="min-w-0">
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
              </li>
            );
          })}
        </ul>
      </section>
      <section data-nav-section="certifications" aria-labelledby="cert-snap" className="panel px-6 py-5 md:px-8 md:py-6" data-reveal>
        <div className="flex items-center justify-between gap-4">
          <h3 id="cert-snap" className="eyebrow">Certifications</h3>
          <Link href="/certifications" className="link-u text-sm text-fg-soft hover:text-fg">
            All credentials <span aria-hidden="true">→</span>
          </Link>
        </div>
        <ul className="mt-4 grid gap-x-8 gap-y-3 md:grid-cols-3">
          {certifications.map((c) => (
            <li key={c.name} className="flex items-center justify-between gap-3 border-t border-line pt-3 md:border-t-0 md:pt-0">
              <span className="min-w-0">
                <span className="block text-[0.92rem] font-medium leading-snug text-fg">{c.name}</span>
                <span className="block text-[0.8rem] text-fg-muted">{c.issuer}</span>
              </span>
              <a href={c.credentialUrl ?? c.verifyUrl} target="_blank" rel="noopener noreferrer" className="chip shrink-0 !py-1.5 hover:!border-accent">
                {c.credentialUrl ? "Verify" : "View"} <span aria-hidden="true">↗</span>
                <span className="sr-only"> {c.name} (opens in a new tab)</span>
              </a>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
