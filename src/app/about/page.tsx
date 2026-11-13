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
  description: "About Sreevarshan Sathiyamurthy: what I build, how I work, what I'm working toward, and a map of skills linked to where each was used.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  const intro = profile.intro;
  return (
    <>
      <PageHeader
        index="A"
        eyebrow="About"
        title="Sreevarshan"
        accent="Sathiyamurthy."
        titleClassName="text-[clamp(2.5rem,9vw,7.5rem)]"
        lede="Most people call me Sree."
      />

      <section className="container-x grid gap-14 pb-24 md:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)] md:gap-20" aria-label="Introduction">
        <div>
          <p className="about-statement text-[clamp(1.7rem,3.4vw,2.75rem)] font-medium leading-[1.14] tracking-[-0.035em]" data-reveal>
            {intro.statement.before}
            {intro.statement.highlights.map((h, i) => (
              <span key={h}>
                <span className="about-hl">{h}</span>
                {i < intro.statement.highlights.length - 2 ? ", " : i === intro.statement.highlights.length - 2 ? " and " : ""}
              </span>
            ))}
            {intro.statement.after}
          </p>

          <p className="mt-8 inline-flex max-w-full items-center gap-3 rounded-2xl border sm:rounded-full border-line bg-bg-elev px-4 py-2 text-sm text-fg-soft" data-reveal>
            <span className="relative flex h-2 w-2 shrink-0" aria-hidden="true">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--success)] opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--success)]" />
            </span>
            <span><span className="mono mr-2 text-xs uppercase tracking-[0.14em] text-fg-muted">Now</span>{intro.now}</span>
          </p>

          <div className="mt-14 grid gap-px overflow-hidden rounded-[22px] border border-line bg-line sm:grid-cols-2">
            {intro.blocks.map((b, i) => (
              <div key={b.label} className="bg-bg p-7 md:p-8" data-reveal style={{ ["--i" as string]: i } as React.CSSProperties}>
                <p className="eyebrow"><span className="text-accent">0{i + 1}</span> · {b.label}</p>
                <h2 className="mt-5 text-[1.45rem] font-medium leading-snug tracking-[-0.03em]">{b.title}</h2>
                <p className="mt-3 max-w-[40ch] leading-relaxed text-fg-soft">{b.body}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-[22px] border border-line p-7 md:p-8" data-reveal>
            <p className="eyebrow">Focus areas</p>
            <ul className="mt-4 flex flex-wrap gap-2">
              {profile.focus.map((f) => (
                <li key={f} className="chip">{f}</li>
              ))}
            </ul>
          </div>

          <div className="mt-10 flex flex-wrap gap-3" data-reveal>
            <Link href="/experience" className="btn btn-primary">My experience <span className="arrow" aria-hidden="true">→</span></Link>
            <a href={profile.resumePath} target="_blank" rel="noopener" className="btn btn-ghost">Resume (PDF)</a>
          </div>
        </div>
        <aside className="md:sticky md:top-28 md:order-first md:self-start" data-reveal>
          <div className="mb-10 max-w-[300px]">
            <Portrait asset={getPortrait()} />
          </div>
          <dl className="space-y-6">
            <div>
              <dt className="eyebrow">Based in</dt>
              <dd className="mt-1 text-lg">{profile.location}</dd>
            </div>
            <div>
              <dt className="eyebrow">Roles</dt>
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
          </dl>
        </aside>
      </section>

      <section className="container-x section" aria-label="Engineering values">
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

      <section id="skills" className="container-x section scroll-mt-24" aria-label="Skills">
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
