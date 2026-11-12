import Link from "next/link";
import { Hero } from "@/components/home/Hero";
import { ScrollStatement } from "@/components/home/ScrollStatement";
import { Capabilities } from "@/components/home/Capabilities";
import { SectionHead } from "@/components/ui/SectionHead";
import { ProjectFeature } from "@/components/projects/ProjectFeature";
import { ExperienceTimeline } from "@/components/experience/ExperienceTimeline";
import { AskSreePromo } from "@/components/ask/AskSreePromo";
import { LabTeaser } from "@/components/lab/LabTeaser";
import { projects } from "@/content/projects";
import { achievements } from "@/content/credentials";
import { profile } from "@/content/profile";

const featured = ["aegis-ai", "nexus-ai", "sourceatlas", "tunelab"]
  .map((s) => projects.find((p) => p.slug === s)!)
  .filter(Boolean);

export default function Home() {
  return (
    <>
      <Hero />

      <section className="container-x section" aria-label="Approach">
        <p className="eyebrow mb-10" data-reveal>
          <span className="text-accent">00</span> — Approach
        </p>
        <ScrollStatement
          text="An AI feature is only as good as the data it reads, the checks around it and the interface that explains it. I work across all three — the pipeline, the model and the product — and I measure the result before I call it done."
          highlight={["data", "checks", "interface", "measure"]}
        />
      </section>

      <section className="container-x pb-24 md:pb-36" aria-labelledby="what-i-build">
        <h2 id="what-i-build" className="sr-only">What I build</h2>
        <Capabilities />
      </section>

      <section className="container-x section border-t border-line" aria-label="Selected work">
        <SectionHead index="01" eyebrow="Selected work" title="Systems built" accent="end to end." href="/projects" hrefLabel="All projects" />
        <div className="mt-20 space-y-28 md:space-y-40">
          {featured.map((p, i) => (
            <ProjectFeature key={p.slug} project={p} index={i} />
          ))}
        </div>
      </section>

      <section className="container-x section border-t border-line" aria-label="Experience">
        <SectionHead index="02" eyebrow="Experience" title="Where I've" accent="shipped." href="/experience" hrefLabel="Full experience" />
        <div className="mt-16">
          <ExperienceTimeline compact />
        </div>
      </section>

      <section className="container-x section border-t border-line" aria-label="Achievements">
        <SectionHead index="03" eyebrow="Recognition" title="Results under" accent="pressure." href="/achievements" hrefLabel="Achievements" />
        <div className="mt-16 grid gap-6 md:grid-cols-2">
          {achievements.map((a) => (
            <Link
              key={a.slug}
              href={`/achievements#${a.slug}`}
              className="panel group relative overflow-hidden p-8 transition-[border-color,transform] duration-500 hover:-translate-y-1 hover:border-accent md:p-10"
              data-reveal
            >
              <div className="flex items-start justify-between gap-6">
                <p className="text-[clamp(5rem,12vw,9rem)] font-medium leading-[0.8] tracking-[-0.06em]">
                  {a.rank.place}
                  <span className="serif-accent align-top text-[0.35em] text-accent-fg">{a.rank.suffix}</span>
                </p>
                <span className="chip">{a.rank.field ?? "Competition"}</span>
              </div>
              <h3 className="mt-8 text-2xl font-medium tracking-[-0.03em]">{a.event}</h3>
              <p className="mt-2 text-fg-muted">{a.project}</p>
              <span className="mt-6 inline-flex items-center gap-2 text-sm text-accent-fg">
                Details <span className="transition-transform group-hover:translate-x-1" aria-hidden="true">→</span>
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="container-x section border-t border-line" aria-label="Lab">
        <SectionHead index="04" eyebrow="Lab" title="Results you can" accent="explore." href="/lab" hrefLabel="Open the Lab" />
        <div className="mt-16">
          <LabTeaser />
        </div>
      </section>

      <section className="container-x section border-t border-line" aria-label="Sree AI">
        <AskSreePromo />
      </section>

      <section className="container-x section border-t border-line" aria-label="Contact">
        <p className="eyebrow" data-reveal><span className="text-accent">05</span> — Contact</p>
        <h2 className="display mt-8 max-w-[14ch] text-[clamp(2.8rem,8vw,7rem)]" data-reveal>
          Let&apos;s build something <span className="serif-accent text-accent-fg">worth trusting.</span>
        </h2>
        <div className="mt-12 flex flex-wrap gap-3" data-reveal>
          <a href={`mailto:${profile.email}`} className="btn btn-primary">
            {profile.email} <span className="arrow" aria-hidden="true">→</span>
          </a>
          <a href={profile.links.linkedin} target="_blank" rel="noopener noreferrer" className="btn btn-ghost">LinkedIn ↗</a>
          <a href={profile.links.github} target="_blank" rel="noopener noreferrer" className="btn btn-ghost">GitHub ↗</a>
        </div>
      </section>
    </>
  );
}
