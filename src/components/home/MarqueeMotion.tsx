"use client";

import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";

/**
 * Progressive enhancement for a CSS marquee row: eases the playback rate down
 * while a pointer is over the row (so a logo can be read) and back up on
 * leave, and pauses rows that are off screen. The animation itself is CSS.
 */
export function MarqueeMotion({ children, className, direction, style }: { children: ReactNode; className?: string; direction: "left" | "right"; style?: CSSProperties }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const track = el.querySelector<HTMLElement>(".marquee-track");
    const anim = track?.getAnimations?.()[0];
    if (!anim) return;

    let raf = 0;
    let rate = 1;
    let target = 1;
    const step = () => {
      rate += (target - rate) * 0.08;
      if (Math.abs(target - rate) < 0.004) rate = target;
      anim.playbackRate = rate;
      raf = rate === target ? 0 : requestAnimationFrame(step);
    };
    const ease = (to: number) => {
      target = to;
      if (!raf) raf = requestAnimationFrame(step);
    };
    const enter = (e: PointerEvent) => e.pointerType === "mouse" && ease(0.08);
    const leave = () => ease(1);
    el.addEventListener("pointerenter", enter);
    el.addEventListener("pointerleave", leave);

    const io = new IntersectionObserver(([entry]) => (entry.isIntersecting ? anim.play() : anim.pause()), { rootMargin: "120px" });
    io.observe(el);
    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener("pointerenter", enter);
      el.removeEventListener("pointerleave", leave);
      io.disconnect();
    };
  }, []);

  return (
    <div ref={ref} className={className} data-direction={direction} style={style}>
      {children}
    </div>
  );
}
