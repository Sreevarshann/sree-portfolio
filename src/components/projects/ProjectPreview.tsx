"use client";

import Image from "next/image";
import { ViewTransition, useEffect, useRef, useState } from "react";
import type { Project } from "@/content/projects";

/**
 * Cinematic preview: on hover (or while in view on touch screens) it steps
 * through the project's real screenshots. The first frame morphs into the
 * case-study hero through a shared view transition.
 */
export function ProjectPreview({ project, priority = false, sizes }: { project: Project; priority?: boolean; sizes?: string }) {
  const [frame, setFrame] = useState(0);
  const [active, setActive] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const shots = project.screenshots.slice(0, 3);

  useEffect(() => {
    if (!active || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setInterval(() => setFrame((f) => (f + 1) % shots.length), 1400);
    return () => window.clearInterval(id);
  }, [active, shots.length]);

  // Touch devices: animate while the preview is centered in the viewport.
  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(hover: hover)").matches) return;
    const io = new IntersectionObserver(([e]) => setActive(e.isIntersecting), { rootMargin: "-35% 0px -35% 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      onMouseEnter={() => setActive(true)}
      onMouseLeave={() => {
        setActive(false);
        setFrame(0);
      }}
      className="relative aspect-[16/10] overflow-hidden rounded-[18px] border border-line bg-surface"
    >
      <ViewTransition name={`project-${project.slug}`} share="morph" default="none">
        <div className="absolute inset-0">
          {shots.map((s, i) => (
            <Image
              key={s.src}
              src={s.src}
              alt={i === 0 ? s.alt : ""}
              aria-hidden={i === 0 ? undefined : true}
              fill
              priority={priority && i === 0}
              loading={priority && i === 0 ? undefined : "lazy"}
              sizes={sizes ?? "(min-width: 1024px) 58vw, 100vw"}
              className={`object-cover object-top transition-[opacity,transform] duration-[900ms] ease-[cubic-bezier(.22,1,.36,1)] ${
                i === frame ? "opacity-100" : "opacity-0"
              } ${active ? "scale-[1.03]" : "scale-100"}`}
            />
          ))}
        </div>
      </ViewTransition>
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[color-mix(in_oklab,var(--bg)_55%,transparent)] via-transparent to-transparent" />
      <div className="pointer-events-none absolute inset-x-4 bottom-4 flex items-center justify-between gap-3">
        <span className="chip !bg-[color-mix(in_oklab,var(--bg)_70%,transparent)] backdrop-blur">{shots[frame]?.caption}</span>
        <span className="flex gap-1" aria-hidden="true">
          {shots.map((s, i) => (
            <span key={s.src} className={`h-1 rounded-full transition-all duration-500 ${i === frame ? "w-5 bg-accent" : "w-1.5 bg-fg-muted/50"}`} />
          ))}
        </span>
      </div>
    </div>
  );
}
