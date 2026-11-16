import { Hero } from "@/components/home/Hero";
import { SectionHead } from "@/components/ui/SectionHead";
import { AchievementShowcase } from "@/components/home/AchievementShowcase";
import { CredentialsSnapshot } from "@/components/home/CredentialsSnapshot";
import { ExperienceTimeline } from "@/components/experience/ExperienceTimeline";
import { ExperienceSnapshot } from "@/components/home/ExperienceSnapshot";
import { TechMarquee, TechCatalog } from "@/components/home/TechMarquee";
import { ProjectGallery } from "@/components/projects/ProjectGallery";
import { projects } from "@/content/projects";
import { profile } from "@/content/profile";
import { getPortraitPair } from "@/lib/portrait";

const pick = (slugs: string[]) => slugs.map((s) => projects.find((p) => p.slug === s)!).filter(Boolean);
/** Quick View: one project per discipline - data/ML, AI agents, full-stack product. */
const quickProjects = pick(["aegis-ai", "nexus-ai", "workmesh"]);
/** Detailed View: six projects in the gallery; the full set lives on /projects. */
const detailedProjects = pick(["aegis-ai", "nexus-ai", "sourceatlas", "tunelab", "workmesh", "reviewpilot"]);

/**
 * Homepage, in a fixed order in both views: Hero, Achievements, Education,
 * Experience, Technology stack, Projects, Contact (the footer is global).
 * `.v-quick` / `.v-detailed` blocks are shown or hidden by html[data-view]
 * (set before paint), so both are server-rendered: no hydration mismatch,
 * nothing hidden from crawlers, and hidden blocks are display:none.
 * `data-nav-section` maps each section to its navigation item (src/lib/nav.ts);
 * `data-view-anchor` keeps the reader's place when the view switches.
 */
export default function Home() {
  return (
    <>
      <Hero portraits={getPortraitPair()} />

      <section className="container-x section" aria-label="Achievements" data-nav-section="achievements" data-view-anchor="achievements">
        <SectionHead eyebrow="Recognition" title="Results under" accent="pressure." href="/achievements" hrefLabel="View all achievements" />
        <AchievementShowcase />
      </section>

      <section className="container-x section" aria-label="Education and certifications" data-view-anchor="credentials">
        <SectionHead eyebrow="Education" title="Education &" accent="credentials." href="/education" hrefLabel="Education details" />
        <CredentialsSnapshot />
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
          <SectionHead eyebrow="Technology stack" title="Tools &" accent="technologies." />
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
        <div className="mt-8">
          <TechMarquee />
        </div>
        <div className="container-x mt-6">
          <TechCatalog />
        </div>
      </section>

      <section className="container-x section" aria-label="Projects" data-nav-section="projects" data-view-anchor="projects">
        <SectionHead eyebrow="Projects" title="Systems built" accent="end to end." href="/projects" hrefLabel="View all projects" />
        <div className="v-quick">
          <ProjectGallery projects={quickProjects} />
        </div>
        <div className="v-detailed">
          <ProjectGallery projects={detailedProjects} />
        </div>
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
            <span className="sr-only">: explore my data visualizations (opens in a new tab)</span>
          </a>
        </div>
      </section>
    </>
  );
}
