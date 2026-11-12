import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/PageHeader";
import { TeamField, Podium } from "@/components/achievements/FieldViz";
import { achievements } from "@/content/credentials";

export const metadata: Metadata = {
  title: "Achievements",
  description: "6th of 320+ teams at the Singapore AUV Challenge, and 3rd place at the Google MLOps Expo with Charlie, an MBTA real-time chatbot.",
  alternates: { canonical: "/achievements" },
};

export default function AchievementsPage() {
  return (
    <>
      <PageHeader index="D" eyebrow="Achievements" title="Competing" accent="in public." lede="Two competitions, two very different systems: an autonomous underwater vehicle and a real-time transit assistant." />
      <div className="container-x space-y-10 pb-16">
        {achievements.map((a, i) => (
          <section key={a.slug} id={a.slug} className="panel scroll-mt-28 overflow-hidden" aria-labelledby={`a-${a.slug}`}>
            <div className="grid lg:grid-cols-[1fr_1.1fr]">
              <div className="flex flex-col justify-between gap-10 border-b border-line p-8 md:p-12 lg:border-b-0 lg:border-r" data-reveal>
                <div>
                  <p className="eyebrow">{a.event}</p>
                  <p className="mt-6 text-[clamp(6rem,16vw,12rem)] font-medium leading-[0.78] tracking-[-0.07em]">
                    {a.rank.place}
                    <span className="serif-accent align-top text-[0.32em] text-accent-fg">{a.rank.suffix}</span>
                  </p>
                  <p className="mt-6 text-xl">{a.result}{a.rank.field ? ` · ${a.rank.field}` : ""}</p>
                </div>
                <div className="max-w-md">
                  {i === 0 ? <TeamField total={320} place={6} /> : <Podium place={3} />}
                  <p className="mt-3 text-xs text-fg-muted">
                    {i === 0 ? "Each dot represents one team in a field of 320+; the highlighted dot is 6th place. Illustrative." : "Podium graphic, illustrative."}
                  </p>
                </div>
              </div>
              <div className="p-8 md:p-12" data-reveal>
                <h2 id={`a-${a.slug}`} className="text-[clamp(1.8rem,3.4vw,2.6rem)] font-medium leading-tight tracking-[-0.035em]">{a.project}</h2>
                <p className="mt-4 leading-relaxed text-fg-soft">{a.summary}</p>
                <ul className="mt-8 space-y-3">
                  {a.details.map((d) => (
                    <li key={d} className="flex gap-3 leading-relaxed text-fg-soft">
                      <span className="mt-[0.6em] h-1 w-3 shrink-0 rounded-full bg-accent" aria-hidden="true" />
                      {d}
                    </li>
                  ))}
                </ul>
                <ul className="mt-8 flex flex-wrap gap-1.5" aria-label="Technologies">
                  {a.stack.map((s) => <li key={s} className="chip">{s}</li>)}
                </ul>
                <div className="mt-10 border-t border-line pt-6">
                  <h3 className="eyebrow">Evidence</h3>
                  <ul className="mt-3 space-y-2 text-sm">
                    {a.evidence.map((e) => (
                      <li key={e.label} className="flex flex-wrap items-baseline gap-x-3">
                        {e.href ? (
                          <a href={e.href} target="_blank" rel="noopener noreferrer" className="link-u text-accent-fg">{e.label} ↗</a>
                        ) : (
                          <span>{e.label}</span>
                        )}
                        <span className="text-fg-muted">{e.note}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </section>
        ))}
      </div>
    </>
  );
}
