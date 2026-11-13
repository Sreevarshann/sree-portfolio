import type { Metadata } from "next";
import { LogoImage } from "@/components/ui/LogoImage";
import { PageHeader } from "@/components/ui/PageHeader";
import { education, type InstitutionLogo } from "@/content/credentials";

const SHOW: Record<InstitutionLogo["show"], string> = { all: "", wide: "hidden sm:block", compact: "sm:hidden" };

function InstitutionMark({ logo, fallback }: { logo: InstitutionLogo; fallback: string }) {
  const img = (src: string, variant: "light" | "dark" | "both") => (
    <LogoImage src={src} alt={logo.alt} width={logo.width} height={logo.height} fallback={fallback} variant={variant} className="w-auto max-w-full" style={{ height: logo.h }} />
  );
  return (
    <div className={SHOW[logo.show]}>
      {logo.label && <p className="eyebrow mb-2">{logo.label}</p>}
      <a
        href={logo.url}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`${logo.alt.replace(/ (logo|seal)$/i, "")} website`}
        className={`inline-block max-w-full transition-transform duration-500 ease-[var(--ease-spring)] hover:-translate-y-0.5 ${logo.plate ? "rounded-xl bg-white p-2.5 ring-1 ring-line shadow-[var(--shadow)]" : ""}`}
      >
        {logo.light === logo.dark ? img(logo.light, "both") : <>{img(logo.light, "light")}{img(logo.dark, "dark")}</>}
      </a>
    </div>
  );
}

export const metadata: Metadata = {
  title: "Education",
  description: "M.S. Data Analytics Engineering, Northeastern University (GPA 3.95, expected Dec 2026). B.E. Electronics and Communication Engineering, Sri Sairam Engineering College, affiliated to Anna University (CGPA 8.7/10, 2024).",
  alternates: { canonical: "/education" },
};

export default function EducationPage() {
  return (
    <>
      <PageHeader index="E" eyebrow="Education" title="Foundations in" accent="signals & data." lede="From electronics and communication engineering in Chennai to data analytics engineering in Boston." />
      <section className="container-x pb-16" aria-label="Degrees">
        <ol className="relative space-y-8">
          {education.map((e, i) => (
            <li key={e.institution} className="panel overflow-hidden" data-reveal style={{ ["--i" as string]: i } as React.CSSProperties}>
              <div className="grid md:grid-cols-[1fr_1.3fr]">
                <div className="flex flex-col justify-between gap-10 border-b border-line p-8 md:border-b-0 md:border-r md:p-10">
                  <div className="flex flex-col gap-6">
                    {e.logos.map((l) => (
                      <InstitutionMark key={l.light + l.show} logo={l} fallback={l.label ? (e.affiliation ?? e.institution) : e.institution} />
                    ))}
                  </div>
                  <div>
                    <p className="mono text-sm text-accent-fg">{String(i + 1).padStart(2, "0")} · {e.status === "in-progress" ? "In progress" : "Completed"}</p>
                    <p className="mt-2 text-[clamp(3rem,7vw,5rem)] font-medium leading-none tracking-[-0.05em]">{e.gpa.split(" / ")[0]}<span className="text-[0.4em] text-fg-muted"> / {e.gpa.split(" / ")[1]} {e.gpaLabel}</span></p>
                  </div>
                </div>
                <div className="p-8 md:p-10">
                  <h2 className="text-[clamp(1.8rem,3.2vw,2.5rem)] font-medium leading-tight tracking-[-0.035em]">{e.institution}</h2>
                  {e.affiliation && <p className="mt-1 text-sm text-fg-muted">Affiliated to {e.affiliation}</p>}
                  <p className="mt-2 text-lg text-fg-soft">{e.degree} — {e.field}</p>
                  <dl className="mt-8 grid grid-cols-2 gap-6 text-sm">
                    <div><dt className="eyebrow">Dates</dt><dd className="mt-1">{e.date}</dd></div>
                    <div><dt className="eyebrow">Location</dt><dd className="mt-1">{e.location}</dd></div>
                  </dl>
                  <ul className="mt-8 space-y-3 border-t border-line pt-6">
                    {e.notes.map((n) => (
                      <li key={n} className="flex gap-3 leading-relaxed text-fg-soft">
                        <span className="mt-[0.6em] h-1 w-3 shrink-0 rounded-full bg-accent" aria-hidden="true" />{n}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </li>
          ))}
        </ol>
        <p className="mt-6 text-xs text-fg-muted">Institution logos are the property of their respective institutions and are used to identify them.</p>
      </section>
    </>
  );
}
