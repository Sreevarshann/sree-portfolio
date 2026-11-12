"use client";

import { useEffect, useRef } from "react";

/**
 * Desktop-only cursor companion. The native pointer is never hidden; a soft
 * ring trails it and expands over interactive elements.
 */
export function Cursor() {
  const ring = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const el = ring.current;
    if (!fine || reduce || !el) return;

    let x = -100, y = -100, tx = -100, ty = -100, scale = 1, ts = 1, raf = 0, visible = false;
    const move = (e: PointerEvent) => {
      tx = e.clientX;
      ty = e.clientY;
      if (!visible) {
        visible = true;
        x = tx;
        y = ty;
        el.style.opacity = "1";
      }
      const t = e.target as Element | null;
      const interactive = t?.closest("a, button, [role='button'], input, textarea, select, label, summary, [data-cursor]");
      ts = interactive ? 2.2 : 1;
      el.dataset.mode = interactive ? "hover" : "";
    };
    const leave = () => {
      visible = false;
      el.style.opacity = "0";
    };
    const loop = () => {
      x += (tx - x) * 0.2;
      y += (ty - y) * 0.2;
      scale += (ts - scale) * 0.18;
      el.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%) scale(${scale})`;
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    window.addEventListener("pointermove", move, { passive: true });
    document.addEventListener("pointerleave", leave);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", move);
      document.removeEventListener("pointerleave", leave);
    };
  }, []);

  return (
    <div
      ref={ring}
      aria-hidden="true"
      className="pointer-events-none fixed left-0 top-0 z-[70] hidden h-6 w-6 rounded-full border border-accent opacity-0 mix-blend-difference transition-[opacity,background-color] duration-300 data-[mode=hover]:bg-accent/15 [@media(hover:hover)_and_(pointer:fine)]:block"
    />
  );
}
