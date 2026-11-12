"use client";

import { useEffect, useState } from "react";
import { categories, projects, type Category } from "@/content/projects";
import { ProjectFeature } from "./ProjectFeature";

type Filter = "All" | Category;

export function ProjectCatalog() {
  const [filter, setFilter] = useState<Filter>("All");

  // Restore filter from ?category= on load; keep the URL shareable.
  useEffect(() => {
    const c = new URLSearchParams(window.location.search).get("category");
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sync from URL once on mount
    if (c && (categories as string[]).includes(c)) setFilter(c as Category);
  }, []);
  const choose = (f: Filter) => {
    setFilter(f);
    const url = new URL(window.location.href);
    if (f === "All") url.searchParams.delete("category");
    else url.searchParams.set("category", f);
    window.history.replaceState(null, "", url);
  };

  const list = filter === "All" ? projects : projects.filter((p) => p.categories.includes(filter));
  const options: Filter[] = ["All", ...categories];

  return (
    <div>
      <div className="sticky top-16 z-20 -mx-[var(--gutter)] border-y border-line bg-[color-mix(in_oklab,var(--bg)_85%,transparent)] px-[var(--gutter)] py-3 backdrop-blur-xl md:top-[72px]">
        <div role="group" aria-label="Filter projects by category" className="flex flex-wrap items-center gap-2">
          {options.map((o) => {
            const count = o === "All" ? projects.length : projects.filter((p) => p.categories.includes(o)).length;
            const on = filter === o;
            return (
              <button
                key={o}
                type="button"
                aria-pressed={on}
                onClick={() => choose(o)}
                className={`inline-flex h-9 items-center gap-2 rounded-full border px-4 text-sm transition-colors ${
                  on ? "border-accent-solid bg-accent-solid text-white" : "border-line text-fg-soft hover:border-accent hover:text-fg"
                }`}
              >
                {o}
                <span className={`mono text-[0.7rem] ${on ? "text-white/80" : "text-fg-muted"}`}>{count}</span>
              </button>
            );
          })}
          <p className="ml-auto hidden text-xs text-fg-muted md:block" aria-live="polite">
            Showing {list.length} of {projects.length}
          </p>
        </div>
      </div>
      <div className="mt-16 space-y-28 md:space-y-40">
        {list.map((p, i) => (
          <ProjectFeature key={p.slug} project={p} index={i} priority={i === 0} />
        ))}
      </div>
    </div>
  );
}
