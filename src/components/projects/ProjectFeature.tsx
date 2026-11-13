import Image from "next/image";
import Link from "next/link";
import type { Project } from "@/content/projects";
import { ProjectPreview } from "./ProjectPreview";
import { TechChip } from "@/components/ui/TechChip";
import { iconFor } from "@/components/ui/BrandIcon";

/** Alternating editorial composition: large preview + narrative column. */
export function ProjectFeature({ project, index, priority = false, headingLevel = 3 }: { project: Project; index: number; priority?: boolean; headingLevel?: 2 | 3 }) {
  const Heading = headingLevel === 2 ? "h2" : "h3";
  const flip = index % 2 === 1;
  const secondary = project.screenshots[3] ?? project.screenshots[2];
  return (
    <article className="group grid items-center gap-8 lg:grid-cols-12 lg:gap-12" aria-labelledby={`p-${project.slug}`}>
      <Link
        href={`/projects/${project.slug}`}
        className={`relative block lg:col-span-7 ${flip ? "lg:order-2" : ""}`}
        // Duplicate of the title link for pointer users; hidden from assistive tech and the tab order.
        aria-hidden="true"
        tabIndex={-1}
        data-reveal="media"
      >
        <div data-parallax="0.06">
          <ProjectPreview project={project} priority={priority} />
        </div>
        {secondary && (
          <div
            className={`layer-drift pointer-events-none absolute -bottom-10 hidden w-[34%] overflow-hidden rounded-[14px] border border-line-strong bg-surface shadow-[var(--shadow)] lg:block ${flip ? "-left-8" : "-right-8"}`}
            aria-hidden="true"
          >
            <div className="relative aspect-[16/10]">
              <Image src={secondary.src} alt="" fill sizes="22vw" className="object-cover object-top" />
            </div>
          </div>
        )}
      </Link>
      <div className={`lg:col-span-5 ${flip ? "lg:order-1" : ""}`} data-reveal>
        <p className="eyebrow flex items-center gap-3">
          <span className="text-accent">{String(index + 1).padStart(2, "0")}</span>
          <span>{project.categories.join(" · ")}</span>
        </p>
        <Heading id={`p-${project.slug}`} className="mt-4 text-[clamp(2rem,4vw,3.25rem)] font-medium leading-none tracking-[-0.04em]">
          <Link href={`/projects/${project.slug}`} className="transition-colors hover:text-accent-fg">
            {project.name}
          </Link>
        </Heading>
        <p className="mt-3 text-lg text-fg-soft">{project.tagline}</p>
        <p className="mt-5 leading-relaxed text-fg-muted">{project.oneLiner}</p>
        <ul className="mt-6 flex flex-wrap gap-1.5" aria-label="Key technologies">
          {project.stack.flatMap((g) => g.items).filter((n) => iconFor(n)).slice(0, 5).map((n) => (
            <li key={n}>
              <TechChip name={n} />
            </li>
          ))}
        </ul>
        <dl className="mt-6 grid grid-cols-3 gap-4 border-t border-line pt-5">
          {project.metrics.map((m) => (
            <div key={m.label}>
              <dt className="sr-only">{m.label}</dt>
              <dd className="text-xl font-medium tracking-[-0.02em] text-fg">{m.value}</dd>
              <dd className="mt-1 text-xs leading-snug text-fg-muted">{m.label}</dd>
            </div>
          ))}
        </dl>
        <div className="mt-7 flex flex-wrap gap-3">
          <Link href={`/projects/${project.slug}`} className="btn btn-primary">
            Case study <span className="arrow" aria-hidden="true">→</span>
          </Link>
          <a href={project.repoUrl} target="_blank" rel="noopener noreferrer" className="btn btn-ghost">
            GitHub ↗
          </a>
        </div>
      </div>
    </article>
  );
}
