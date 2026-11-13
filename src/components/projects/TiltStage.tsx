"use client";

import { useEffect, useRef, type ReactNode } from "react";

/**
 * A restrained perspective tilt for project media. It reacts only while the
 * pointer is over the media itself (fine pointers, motion allowed), eases back
 * to rest on leave, and writes two CSS variables in a single rAF per frame.
 */
export function TiltStage({ children, className = "" }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    let nx = 0, ny = 0;
    const apply = () => {
      raf = 0;
      el.style.setProperty("--tx", nx.toFixed(3));
      el.style.setProperty("--ty", ny.toFixed(3));
    };
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      nx = (e.clientX - r.left) / r.width - 0.5;
      ny = (e.clientY - r.top) / r.height - 0.5;
      if (!raf) raf = requestAnimationFrame(apply);
    };
    const enter = () => el.setAttribute("data-tilting", "");
    const leave = () => {
      el.removeAttribute("data-tilting");
      nx = ny = 0;
      if (!raf) raf = requestAnimationFrame(apply);
    };
    el.addEventListener("pointerenter", enter);
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerleave", leave);
    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener("pointerenter", enter);
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerleave", leave);
    };
  }, []);
  return (
    <div ref={ref} className={`tilt-stage ${className}`}>
      <div className="tilt-inner">{children}</div>
    </div>
  );
}
