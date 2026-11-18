import { Hero } from "@/components/home/Hero";
import { SectionHead } from "@/components/ui/SectionHead";
import { AchievementShowcase } from "@/components/home/AchievementShowcase";
import { CredentialsSnapshot } from "@/components/home/CredentialsSnapshot";
import { ExperienceSnapshot } from "@/components/home/ExperienceSnapshot";
import { TechMarquee, TechCatalog } from "@/components/home/TechMarquee";
import { ProjectGallery } from "@/components/projects/ProjectGallery";
import { CertificationsSnapshot } from "@/components/home/CertificationsSnapshot";
import { SectionAction } from "@/components/ui/SectionAction";
import { CardLight } from "@/components/home/CardLight";
import { projects } from "@/content/projects";
import { profile } from "@/content/profile";
import { getPortraitPair } from "@/lib/portrait";

const pick = (slugs: string[]) => slugs.map((s) => projects.find((p) => p.slug === s)!).filter(Boolean);
/**
 * Three featured projects, one per discipline: AEGIS AI (streaming data
 * platform with ML and agents), Nexus AI (multi-agent AI workspace) and
 * WorkMesh (full-stack product). Every project stays on /projects.
 */
const featured = pick(["aegis-ai", "nexus-ai", "workmesh"]);

/**
 * Homepage, in this fixed order: About (the hero), Achievements, Education,
 * Experience, Technology stack, Projects, Certifications, Contact (the footer
 * is global). Each section's `id` and `data-nav-section` match its item in
 * the navigation (src/lib/nav.ts), so `/#id` links land on it.
 */
export default function Home() {
  return (
    <>
      <Hero portraits={getPortraitPair()} />
      <CardLight />

      <section id="achievements" className="container-x section" aria-label="Achievements" data-nav-section="achievements">
        <SectionHead eyebrow="Recognition" title="Results under" accent="pressure." href="/achievements" hrefLabel="Explore achievement details" />
        <AchievementShowcase />
      </section>

      <section id="education" className="container-x section" aria-label="Education" data-nav-section="education">
        <SectionHead eyebrow="Education" title="Where I" accent="studied." href="/education" hrefLabel="Education details" />
        <CredentialsSnapshot />
      </section>

      <section id="experience" className="container-x section" aria-label="Experience" data-nav-section="experience">
        <SectionHead eyebrow="Experience" title="Where I've" accent="shipped." />
        <ExperienceSnapshot />
        <SectionAction href="/experience">Explore experience</SectionAction>
      </section>

      <section id="tools" className="tools-section" aria-label="Tools and technologies" data-nav-section="tools">
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

      <section id="projects" className="container-x section" aria-label="Projects" data-nav-section="projects">
        <SectionHead eyebrow="Projects" title="Systems built" accent="end to end." />
        <ProjectGallery projects={featured} />
        <SectionAction href="/projects">View all projects</SectionAction>
      </section>

      <section id="certifications" className="container-x section" aria-label="Certifications" data-nav-section="certifications">
        <SectionHead eyebrow="Certifications" title="Verified" accent="credentials." href="/certifications" hrefLabel="Certification details" />
        <CertificationsSnapshot />
      </section>

      <section id="contact" className="contact-close container-x section relative" aria-label="Contact" data-nav-section="contact">
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
