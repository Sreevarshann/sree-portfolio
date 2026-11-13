"use client";

import { useEffect, useRef, type ElementType, type ReactNode } from "react";

/**
 * Marks its element with data-in once it scrolls into view, so CSS can play a
 * one-time choreography. Server output is the finished state; the attribute
 * only starts animations that end where the static markup already is.
 */
export function InView({
  as: Tag = "div",
  className,
  children,
  threshold = 0.35,
  ...rest
}: { as?: ElementType; className?: string; children: ReactNode; threshold?: number } & Record<string, unknown>) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.setAttribute("data-armed", "");
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        el.setAttribute("data-in", "");
        io.disconnect();
      },
      { threshold },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);
  return (
    <Tag ref={ref} className={className} {...rest}>
      {children}
    </Tag>
  );
}
