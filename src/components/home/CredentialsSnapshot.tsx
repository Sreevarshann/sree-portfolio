import Link from "next/link";
import { education, certifications } from "@/content/credentials";
import { LogoImage } from "@/components/ui/LogoImage";

/**
 * Education and certifications at a glance: institution marks, degree and
 * date, and the three credentials with their verification links. Each half
 * is its own navigation section (Education / Certifications).
 */
export function CredentialsSnapshot() {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <section data-nav-section="education" aria-labelledby="edu-snap" className="panel flex flex-col p-7 md:p-9" data-reveal>
        <div className="flex items-center justify-between gap-4">
          <h3 id="edu-snap" className="eyebrow">Education</h3>
          <Link href="/education" className="link-u text-sm text-fg-soft hover:text-fg">Details <span aria-hidden="true">→</span></Link>
        </div>
        <ul className="mt-6 divide-y divide-line">
          {education.map((ed) => {
            const logo = ed.logos.find((l) => l.show === "compact") ?? ed.logos[0];
            return (
              <li key={ed.institution} className="flex items-center gap-5 py-5 first:pt-0 last:pb-0">
                <span className="logo-plate logo-plate-square flex shrink-0 items-center justify-center">
                  <LogoImage src={logo.light} alt={logo.alt} width={logo.width} height={logo.height} fallback={ed.institution.split(" ")[0]} className="h-full w-full object-contain" />
                </span>
                <span className="min-w-0">
                  <span className="block font-medium text-fg">{ed.institution}</span>
                  <span className="block text-sm text-fg-soft">{ed.degree}, {ed.field}</span>
                  <span className="mono block text-[0.72rem] text-fg-muted">{ed.date}</span>
                </span>
              </li>
            );
          })}
        </ul>
      </section>
      <section data-nav-section="certifications" aria-labelledby="cert-snap" className="panel flex flex-col p-7 md:p-9" data-reveal>
        <div className="flex items-center justify-between gap-4">
          <h3 id="cert-snap" className="eyebrow">Certifications</h3>
          <Link href="/certifications" className="link-u text-sm text-fg-soft hover:text-fg">All credentials <span aria-hidden="true">→</span></Link>
        </div>
        <ul className="mt-6 divide-y divide-line">
          {certifications.map((c) => (
            <li key={c.name} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 py-4 first:pt-0 last:pb-0">
              <span className="min-w-0">
                <span className="block font-medium text-fg">{c.name}</span>
                <span className="block text-sm text-fg-muted">{c.issuer}</span>
              </span>
              <a
                href={c.credentialUrl ?? c.verifyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="chip shrink-0 !py-1.5 hover:!border-accent"
              >
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
