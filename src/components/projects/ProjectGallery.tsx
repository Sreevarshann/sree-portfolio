import Link from "next/link";
import type { Project } from "@/content/projects";
import { ProjectPreview } from "./ProjectPreview";
import { TechChip } from "@/components/ui/TechChip";
import { iconFor } from "@/components/ui/BrandIcon";

/**
 * Compact homepage gallery: one card per project with its real screenshots
 * (which step through on hover), name, one line, three technologies and one
 * action: the project's case study (which links its repository).
 */
export function ProjectGallery({ projects }: { projects: Project[] }) {
  return (
    <ul className="project-gallery grid gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
      {projects.map((p, i) => (
        <li key={p.slug} className="flex min-w-0" data-reveal style={{ ["--i" as string]: i } as React.CSSProperties}>
          <article
            aria-labelledby={`pg-${p.slug}`}
            className="project-card lux lux-proj panel group relative flex w-full min-w-0 flex-col overflow-hidden"
            style={{ ["--p" as string]: p.accent } as React.CSSProperties}
          >
            {/* Pointer shortcut to the case study; the title link is the accessible one. */}
            <Link href={`/projects/${p.slug}`} aria-hidden="true" tabIndex={-1} className="block p-2.5 pb-0">
              <ProjectPreview project={p} sizes="(min-width: 1024px) 30vw, (min-width: 640px) 46vw, 92vw" />
            </Link>
            <div className="flex flex-1 flex-col p-6 pt-5">
              <p className="eyebrow flex items-center gap-2.5 text-[0.66rem]">
                <span className="stage-dot" aria-hidden="true" />
                <span className="truncate">{p.categories.join(" · ")}</span>
              </p>
              <h3 id={`pg-${p.slug}`} className="mt-3 text-[1.45rem] font-medium leading-tight tracking-[-0.03em]">
                <Link href={`/projects/${p.slug}`} className="transition-colors hover:text-accent-fg">
                  {p.name}
                </Link>
              </h3>
              <p className="mt-1.5 line-clamp-2 text-[0.95rem] leading-snug text-fg-soft">{p.tagline}</p>
              <ul className="mt-4 flex flex-wrap gap-1.5" aria-label="Key technologies">
                {p.stack.flatMap((g) => g.items).filter((n) => iconFor(n)).slice(0, 3).map((n) => (
                  <li key={n}>
                    <TechChip name={n} />
                  </li>
                ))}
              </ul>
              <div className="mt-auto pt-6">
                <Link href={`/projects/${p.slug}`} className="btn btn-primary !px-4 !py-2 text-sm">
                  View project <span className="arrow" aria-hidden="true">→</span>
                  <span className="sr-only">: {p.name}</span>
                </Link>
              </div>
            </div>
          </article>
        </li>
      ))}
    </ul>
  );
}
