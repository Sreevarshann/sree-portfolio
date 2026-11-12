import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { SectionHead } from "@/components/ui/SectionHead";
import { SkillsMap } from "@/components/about/SkillsMap";
import { profile } from "@/content/profile";
import { education } from "@/content/credentials";
import { Portrait } from "@/components/ui/Portrait";
import { getPortrait } from "@/lib/portrait";

export const metadata: Metadata = {
  title: "About",
  description: "Sree's story, engineering values, current focus and a map of skills linked to where each was used.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <>
      <PageHeader index="A" eyebrow="About" title="Engineer across the" accent="whole system." lede={profile.summary} />

      <section className="container-x grid gap-12 pb-24 md:grid-cols-[1fr_1.4fr] md:gap-20">
        <aside className="md:sticky md:top-28 md:self-start" data-reveal>
          <div className="mb-10 max-w-[300px]">
            <Portrait asset={getPortrait()} />
          </div>
          <dl className="space-y-6">
            <div>
              <dt className="eyebrow">Based in</dt>
              <dd className="mt-1 text-lg">{profile.location}</dd>
            </div>
            <div>
              <dt className="eyebrow">Positioning</dt>
              <dd className="mt-1 text-lg">{profile.roles.join(" · ")}</dd>
            </div>
            <div>
              <dt className="eyebrow">Education</dt>
              {education.map((e) => (
                <dd key={e.institution} className="mt-1 text-fg-soft">
                  {e.degree.replace("Master of Science", "M.S.").replace("Bachelor of Engineering", "B.E.")}, {e.field} — {e.institution}
                </dd>
              ))}
            </div>
            <div>
              <dt className="eyebrow">Currently focused on</dt>
              <dd>
                <ul className="mt-2 space-y-1.5 text-fg-soft">
                  {profile.focus.map((f) => (
                    <li key={f} className="flex gap-2">
                      <span className="text-accent" aria-hidden="true">↳</span>
                      {f}
                    </li>
                  ))}
                </ul>
              </dd>
            </div>
          </dl>
        </aside>
        <div className="prose-body text-[1.08rem]">
          {profile.about.map((p, i) => (
            <p key={i} data-reveal className={i === 0 ? "!text-fg text-[1.3rem] leading-relaxed" : ""}>
              {p}
            </p>
          ))}
          <div className="mt-10 flex flex-wrap gap-3" data-reveal>
            <Link href="/experience" className="btn btn-primary">Experience <span className="arrow" aria-hidden="true">→</span></Link>
            <a href={profile.resumePath} target="_blank" rel="noopener" className="btn btn-ghost">Resume (PDF)</a>
          </div>
        </div>
      </section>

      <section className="container-x section border-t border-line" aria-label="Engineering values">
        <SectionHead index="A.1" eyebrow="Values" title="How I" accent="work." />
        <div className="mt-14 grid gap-px overflow-hidden rounded-[22px] border border-line bg-line sm:grid-cols-2">
          {profile.values.map((v, i) => (
            <div key={v.title} className="bg-bg p-7 md:p-10" data-reveal>
              <span className="mono text-xs text-accent">0{i + 1}</span>
              <h3 className="mt-4 text-2xl font-medium tracking-[-0.03em]">{v.title}</h3>
              <p className="mt-3 leading-relaxed text-fg-soft">{v.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="skills" className="container-x section scroll-mt-24 border-t border-line" aria-label="Skills">
        <SectionHead index="A.2" eyebrow="Capability map" title="Skills, with" accent="receipts." />
        <p className="lede mt-6 max-w-2xl" data-reveal>
          No percentage bars. Select a skill to see the roles and projects where it was actually used.
        </p>
        <div className="mt-14">
          <SkillsMap />
        </div>
      </section>
    </>
  );
}
