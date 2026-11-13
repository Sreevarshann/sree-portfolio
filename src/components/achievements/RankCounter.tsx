"use client";

import { useEffect, useRef } from "react";

/**
 * Counts down from the size of the field to the final placing when the
 * numeral scrolls into view. The server renders the final placing, and the
 * accessible name is always the final value.
 */
export function RankCounter({ from, to, suffix, className = "" }: { from: number; to: number; suffix: string; className?: string }) {
  const num = useRef<HTMLSpanElement>(null);
  const wrap = useRef<HTMLParagraphElement>(null);
  useEffect(() => {
    const el = num.current;
    const box = wrap.current;
    if (!el || !box || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        io.disconnect();
        const start = performance.now();
        const D = 1700;
        const tick = (now: number) => {
          const t = Math.min(1, (now - start) / D);
          const k = t === 1 ? 1 : 1 - Math.pow(2, -10 * t); // expo out
          el.textContent = String(Math.round(from + (to - from) * k));
          if (t < 1) raf = requestAnimationFrame(tick);
          else box.setAttribute("data-landed", "");
        };
        el.textContent = String(from);
        raf = requestAnimationFrame(tick);
      },
      { threshold: 0.6 },
    );
    io.observe(box);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [from, to]);
  return (
    <p ref={wrap} className={`rank-counter ${className}`}>
      <span className="sr-only">{`${to}${suffix} place`}</span>
      <span ref={num} aria-hidden="true" className="tabular-nums">{to}</span>
      <span aria-hidden="true" className="serif-accent align-top text-[0.32em] text-accent-fg">{suffix}</span>
    </p>
  );
}
