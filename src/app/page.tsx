import Link from "next/link";
import { Hero } from "@/components/home/Hero";
import { ScrollStatement } from "@/components/home/ScrollStatement";
import { Capabilities } from "@/components/home/Capabilities";
import { SectionHead } from "@/components/ui/SectionHead";
import { ProjectFeature } from "@/components/projects/ProjectFeature";
import { ExperienceTimeline } from "@/components/experience/ExperienceTimeline";
import { ExperienceSnapshot } from "@/components/home/ExperienceSnapshot";
import { CredentialsSnapshot } from "@/components/home/CredentialsSnapshot";
import { AskSreePromo } from "@/components/ask/AskSreePromo";
import { LabTeaser } from "@/components/lab/LabTeaser";
import { LinkedInProof } from "@/components/ui/LinkedInProof";
import { TechMarquee, TechCatalog } from "@/components/home/TechMarquee";
import { projects } from "@/content/projects";
import { achievements } from "@/content/credentials";
import { profile } from "@/content/profile";
import { getPortraitPair } from "@/lib/portrait";

const pick = (slugs: string[]) => slugs.map((s) => projects.find((p) => p.slug === s)!).filter(Boolean);
/** Quick View: one project per discipline — data/ML, AI agents, full-stack product. */
const quickProjects = pick(["aegis-ai", "nexus-ai", "workmesh"]);
/** Detailed View: the four full cinematic stages. */
const detailedProjects = pick(["aegis-ai", "nexus-ai", "sourceatlas", "tunelab"]);

/**
 * Homepage with two presentations from the same content records.
 * `.v-quick` / `.v-detailed` blocks are shown or hidden by html[data-view]
 * (set before paint), so both are server-rendered: no hydration mismatch,
 * nothing hidden from crawlers, and hidden blocks are display:none (out of
 * the accessibility tree; lazy media inside them never loads).
 * `data-nav-section` maps each section to its navigation item (src/lib/nav.ts);
 * `data-view-anchor` keeps the reader's place when the view switches.
 */
export default function Home() {
  return (
    <>
      <Hero portraits={getPortraitPair()} />

      <section className="container-x section" aria-label="What I build" data-nav-section="build" data-view-anchor="build">
        <SectionHead eyebrow="What I build" title="Three disciplines," accent="one system." />
        <Capabilities />
      </section>

      <section className="container-x section v-detailed" aria-label="Approach" data-nav-section="approach">
        <p className="eyebrow mb-8" data-reveal>Approach</p>
        <ScrollStatement
          text="An AI feature is only as good as the data it reads, the checks around it and the interface that explains it. I work across all three — the pipeline, the model and the product — and I measure the result before I call it done."
          highlight={["data", "checks", "interface", "measure"]}
        />
      </section>

      <section className="container-x section" aria-label="Selected work" data-nav-section="work" data-view-anchor="work">
        <SectionHead eyebrow="Selected work" title="Systems built" accent="end to end." href="/projects" hrefLabel="All projects" />
        <div className="v-quick space-y-20 md:space-y-28">
          {quickProjects.map((p, i) => (
            <ProjectFeature key={p.slug} project={p} index={i} variant="quick" />
          ))}
        </div>
        <div className="v-detailed space-y-28 md:space-y-36">
          {detailedProjects.map((p, i) => (
            <ProjectFeature key={p.slug} project={p} index={i} />
          ))}
        </div>
      </section>

      <section className="container-x section" aria-label="Experience" data-nav-section="experience" data-view-anchor="experience">
        <SectionHead eyebrow="Experience" title="Where I've" accent="shipped." href="/experience" hrefLabel="Full experience" />
        <div className="v-quick">
          <ExperienceSnapshot />
        </div>
        <div className="v-detailed">
          <ExperienceTimeline compact />
        </div>
      </section>

      <section id="tools" className="tools-section" aria-label="Tools and technologies" data-nav-section="tools" data-view-anchor="tools">
        <div className="container-x">
          <SectionHead eyebrow="Toolkit" title="Tools &" accent="technologies." />
          <p className="flex max-w-2xl flex-wrap items-center gap-x-4 gap-y-2 text-fg-soft" data-reveal>
            <span>The technologies I use to build, experiment and ship.</span>
            <a href={profile.links.tableau} target="_blank" rel="noopener noreferrer" className="tableau-inline link-u inline-flex items-center gap-2 text-sm text-fg-soft hover:text-fg">
              {/* eslint-disable-next-line @next/next/no-img-element -- 1 KB static brand SVG */}
              <img src="/tech/tableau.svg" alt="" width={14} height={14} className="h-3.5 w-3.5" />
              View my Tableau work <span aria-hidden="true">↗</span>
              <span className="sr-only"> on Tableau Public (opens in a new tab)</span>
            </a>
          </p>
        </div>
        <div className="mt-10">
          <TechMarquee />
        </div>
        <div className="container-x mt-8">
          <TechCatalog />
        </div>
      </section>

      <section className="container-x section" aria-label="Achievements" data-nav-section="achievements" data-view-anchor="achievements">
        <SectionHead eyebrow="Recognition" title="Results under" accent="pressure." href="/achievements" hrefLabel="View achievements" />
        <div className="grid gap-6 md:grid-cols-2">
          {achievements.map((a) => (
            <div
              key={a.slug}
              className="panel group relative overflow-hidden p-8 transition-[border-color,transform] duration-500 hover:-translate-y-1 hover:border-accent md:p-10"
              data-reveal
            >
              <div className="flex items-start justify-between gap-6">
                <p className="rank-reveal text-[clamp(5rem,12vw,9rem)] font-medium leading-[0.8] tracking-[-0.06em]">
                  {a.rank.place}
                  <span className="serif-accent align-top text-[0.35em] text-accent-fg">{a.rank.suffix}</span>
                </p>
                {a.rank.field && <span className="chip">of {a.rank.field}</span>}
              </div>
              <h3 className="mt-8 text-2xl font-medium tracking-[-0.03em]">
                <Link href={`/achievements#${a.slug}`} className="after:absolute after:inset-0 hover:text-accent-fg">
                  {a.event}
                </Link>
              </h3>
              <p className="mt-2 text-fg-muted">{a.project}</p>
              <p className="v-detailed mt-4 max-w-md leading-relaxed text-fg-soft">{a.summary}</p>
              <div className="relative z-[1] mt-6 flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-2 text-sm text-accent-fg">
                  Details <span className="transition-transform group-hover:translate-x-1" aria-hidden="true">→</span>
                </span>
                {a.proof && <LinkedInProof href={a.proof.href} label={a.proof.label} compact />}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="container-x section" aria-label="Education and certifications" data-view-anchor="credentials">
        <SectionHead eyebrow="Credentials" title="Education &" accent="certifications." />
        <CredentialsSnapshot />
      </section>

      <section className="container-x section v-detailed" aria-label="Lab" data-nav-section="lab">
        <SectionHead eyebrow="Lab" title="Results you can" accent="explore." href="/lab" hrefLabel="Open the Lab" />
        <LabTeaser />
      </section>

      <section className="container-x section v-detailed" aria-label="Sree AI" data-nav-section="ai">
        <AskSreePromo />
      </section>

      <section className="contact-close container-x section relative" aria-label="Contact" data-nav-section="contact" data-view-anchor="contact">
        <div className="contact-glow" aria-hidden="true" />
        <p className="eyebrow" data-reveal>Contact</p>
        <h2 className="display mt-6 max-w-[14ch] text-[clamp(2.6rem,7vw,6rem)]" data-reveal>
          Let&apos;s build something <span className="serif-accent text-accent-fg">worth trusting.</span>
        </h2>
        <div className="mt-10 flex flex-wrap gap-3" data-reveal>
          <a href={`mailto:${profile.email}`} className="btn btn-primary">
            {profile.email} <span className="arrow" aria-hidden="true">→</span>
          </a>
          <a href={profile.links.linkedin} target="_blank" rel="noopener noreferrer" className="btn btn-ghost">LinkedIn ↗</a>
          <a href={profile.links.github} target="_blank" rel="noopener noreferrer" className="btn btn-ghost">GitHub ↗</a>
          <a href={profile.links.tableau} target="_blank" rel="noopener noreferrer" className="btn btn-ghost tableau-link">
            {/* eslint-disable-next-line @next/next/no-img-element -- 1 KB static brand SVG */}
            <img src="/tech/tableau.svg" alt="" width={18} height={18} className="h-[18px] w-[18px]" />
            Tableau Public <span aria-hidden="true">↗</span>
            <span className="sr-only"> — explore my data visualizations (opens in a new tab)</span>
          </a>
        </div>
      </section>
    </>
  );
}
