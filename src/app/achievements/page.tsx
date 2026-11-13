import type { Metadata } from "next";
import Image from "next/image";
import { PageHeader } from "@/components/ui/PageHeader";
import { TeamField, Podium } from "@/components/achievements/FieldViz";
import { achievements } from "@/content/credentials";
import { TechChip } from "@/components/ui/TechChip";
import { LinkedInProof } from "@/components/ui/LinkedInProof";
import { RankCounter } from "@/components/achievements/RankCounter";
import { InView } from "@/components/motion/InView";

/** Bar width for a funnel stage: square-root scale so 6 of 320 stays visible. */
const barWidth = (value: string, top: number) => `${Math.max(6, Math.sqrt(parseInt(value, 10) / top) * 100)}%`;

export const metadata: Metadata = {
  title: "Achievements",
  description: "6th of 320+ teams (130+ qualified, 20 shortlisted) at the Singapore AUV Challenge, and 3rd place at the Google MLOps Expo with Charlie, an MBTA real-time chatbot.",
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
                  {a.stages ? (
                    <RankCounter
                      from={parseInt(a.stages[0].value, 10)}
                      to={a.rank.place}
                      suffix={a.rank.suffix}
                      className="rank-reveal mt-6 text-[clamp(6rem,16vw,12rem)] font-medium leading-[0.78] tracking-[-0.07em]"
                    />
                  ) : (
                    <p className="rank-reveal mt-6 text-[clamp(6rem,16vw,12rem)] font-medium leading-[0.78] tracking-[-0.07em]">
                      {a.rank.place}
                      <span className="serif-accent align-top text-[0.32em] text-accent-fg">{a.rank.suffix}</span>
                    </p>
                  )}
                  <p className="mt-6 text-xl">{a.result}{a.rank.field ? ` · ${a.rank.field}` : ""}</p>
                  {a.stages && (
                    <InView as="dl" className="funnel mt-8 space-y-2.5">
                      {a.stages.map((st, k) => {
                        const last = k === a.stages!.length - 1;
                        const top = parseInt(a.stages![0].value, 10);
                        return (
                          <div key={st.label} className="funnel-row" style={{ ["--k" as string]: k } as React.CSSProperties}>
                            <div className="flex items-baseline justify-between gap-3 text-sm">
                              <dt className="text-fg-muted">{st.label}</dt>
                              <dd className={`font-medium tabular-nums tracking-[-0.01em] ${last ? "text-accent-fg" : ""}`}>{st.value}</dd>
                            </div>
                            <div className="mt-1.5 h-1.5 rounded-full bg-[var(--line)]" aria-hidden="true">
                              <div
                                className={`funnel-bar h-full rounded-full ${last ? "bg-accent" : "bg-[color-mix(in_oklab,var(--accent)_45%,var(--line-strong))]"}`}
                                style={{ width: last ? "6%" : barWidth(st.value, top) }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </InView>
                  )}
                  {a.proof && (
                    <div className="mt-6">
                      <LinkedInProof href={a.proof.href} label={a.proof.label} />
                    </div>
                  )}
                </div>
                <div className="max-w-md">
                  {i === 0 ? <TeamField total={320} qualified={130} shortlisted={20} place={6} /> : <Podium place={3} />}
                  <p className="mt-3 text-xs text-fg-muted">
                    {i === 0 ? "Each dot is one team in a field of 320+: tinted dots mark the 130+ that qualified, bright dots the 20 shortlisted, and the large dot 6th place. Funnel bars use a square-root scale. Illustrative." : "Podium graphic, illustrative."}
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
                  {a.stack.map((s) => <li key={s}><TechChip name={s} /></li>)}
                </ul>
                <div className="mt-10 border-t border-line pt-6">
                  <h3 className="eyebrow">Evidence</h3>
                  <ul className="mt-3 space-y-2 text-sm">
                    {a.evidence.map((e) => (
                      <li key={e.label} className="flex flex-wrap items-baseline gap-x-3">
                        {e.href ? (
                          <a href={e.href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-accent-fg">
                            {e.kind === "linkedin" && <Image src="/logos/linkedin-in.png" alt="" width={96} height={82} style={{ height: 14, width: "auto" }} aria-hidden="true" />}
                            <span className="link-u">{e.label} ↗</span>
                          </a>
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
