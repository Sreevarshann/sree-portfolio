import type { Metadata } from "next";
import { LogoImage } from "@/components/ui/LogoImage";
import { PageHeader } from "@/components/ui/PageHeader";
import { education } from "@/content/credentials";

export const metadata: Metadata = {
  title: "Education",
  description: "M.S. Data Analytics Engineering, Northeastern University (GPA 3.95, expected Dec 2026). B.E. Electronics and Communication Engineering, Anna University (GPA 3.5, 2024).",
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
                  <a href={e.url} target="_blank" rel="noopener noreferrer" aria-label={`${e.institution} website`} className={`inline-block w-fit ${e.institution === "Anna University" ? "rounded-lg bg-white p-2" : ""}`}>
                    <LogoImage src={e.logo.light} alt={e.logo.alt} width={e.logo.width} height={e.logo.height} fallback={e.institution} variant={e.logo.light !== e.logo.dark ? "light" : "both"} className={e.institution === "Northeastern University" ? "h-14 w-auto" : "h-9 w-auto"} />
                    {e.logo.light !== e.logo.dark && (
                      <LogoImage src={e.logo.dark} alt={e.logo.alt} width={e.logo.width} height={e.logo.height} fallback={e.institution} variant="dark" className={e.institution === "Northeastern University" ? "h-14 w-auto" : "h-9 w-auto"} />
                    )}
                  </a>
                  <div>
                    <p className="mono text-sm text-accent-fg">{String(i + 1).padStart(2, "0")} · {e.status === "in-progress" ? "In progress" : "Completed"}</p>
                    <p className="mt-2 text-[clamp(3rem,7vw,5rem)] font-medium leading-none tracking-[-0.05em]">{e.gpa.split(" ")[0]}<span className="text-[0.4em] text-fg-muted"> / 4.0 GPA</span></p>
                  </div>
                </div>
                <div className="p-8 md:p-10">
                  <h2 className="text-[clamp(1.8rem,3.2vw,2.5rem)] font-medium leading-tight tracking-[-0.035em]">{e.institution}</h2>
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
        <p className="mt-6 text-xs text-fg-muted">Institution logos are the property of their respective universities and are used to identify them.</p>
      </section>
    </>
  );
}
