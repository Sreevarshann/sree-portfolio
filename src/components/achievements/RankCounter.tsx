"use client";

import { useEffect, useRef } from "react";

/**
 * Counts down from the size of the field to the final placing when the
 * numeral scrolls into view. The final placing is always in normal flow
 * (so nothing shifts); the running count is an overlay shown only while
 * counting. Screen readers get the final value from hidden text.
 */
export function RankCounter({ from, to, suffix, className = "" }: { from: number; to: number; suffix: string; className?: string }) {
  const run = useRef<HTMLSpanElement>(null);
  const wrap = useRef<HTMLParagraphElement>(null);
  useEffect(() => {
    const el = run.current;
    const box = wrap.current;
    if (!el || !box || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        io.disconnect();
        const start = performance.now();
        const D = 1700;
        box.setAttribute("data-counting", "");
        const tick = (now: number) => {
          const t = Math.min(1, (now - start) / D);
          const k = t === 1 ? 1 : 1 - Math.pow(2, -10 * t); // expo out
          el.textContent = String(Math.round(from + (to - from) * k));
          if (t < 1) raf = requestAnimationFrame(tick);
          else {
            box.removeAttribute("data-counting");
            box.setAttribute("data-landed", "");
          }
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
    <p ref={wrap} className={`rank-counter relative ${className}`}>
      <span className="sr-only">{`${to}${suffix} place`}</span>
      <span aria-hidden="true" className="rank-final tabular-nums">{to}</span>
      <span aria-hidden="true" className="rank-final serif-accent align-top text-[0.32em] text-accent-fg">{suffix}</span>
      <span ref={run} aria-hidden="true" className="rank-run pointer-events-none absolute left-0 top-0 tabular-nums" />
    </p>
  );
}
