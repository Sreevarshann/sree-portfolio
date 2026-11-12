import Link from "next/link";
import type { Project } from "@/content/projects";
import { ProjectPreview } from "./ProjectPreview";

/** Alternating editorial composition: large preview + narrative column. */
export function ProjectFeature({ project, index, priority = false }: { project: Project; index: number; priority?: boolean }) {
  const flip = index % 2 === 1;
  return (
    <article className="group grid items-center gap-8 lg:grid-cols-12 lg:gap-12" aria-labelledby={`p-${project.slug}`}>
      <Link
        href={`/projects/${project.slug}`}
        className={`relative block lg:col-span-7 ${flip ? "lg:order-2" : ""}`}
        aria-label={`${project.name} case study`}
        data-reveal="clip"
        data-cursor
      >
        <div data-parallax="0.06">
          <ProjectPreview project={project} priority={priority} />
        </div>
      </Link>
      <div className={`lg:col-span-5 ${flip ? "lg:order-1" : ""}`} data-reveal>
        <p className="eyebrow flex items-center gap-3">
          <span className="text-accent">{String(index + 1).padStart(2, "0")}</span>
          <span>{project.categories.join(" · ")}</span>
        </p>
        <h3 id={`p-${project.slug}`} className="mt-4 text-[clamp(2rem,4vw,3.25rem)] font-medium leading-none tracking-[-0.04em]">
          <Link href={`/projects/${project.slug}`} className="transition-colors hover:text-accent-fg">
            {project.name}
          </Link>
        </h3>
        <p className="mt-3 text-lg text-fg-soft">{project.tagline}</p>
        <p className="mt-5 leading-relaxed text-fg-muted">{project.oneLiner}</p>
        <dl className="mt-7 grid grid-cols-3 gap-4 border-t border-line pt-5">
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
