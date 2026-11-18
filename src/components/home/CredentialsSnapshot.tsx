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
    </div>
  );
}
