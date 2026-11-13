"use client";

import { useEffect, useRef, type ElementType, type ReactNode } from "react";

type Segment = string | { text: string; className?: string };

/**
 * Kinetic headline: characters rise out of a mask with a stagger.
 * Screen readers get the plain sentence from a visually hidden copy (valid on any element, unlike aria-label on a paragraph).
 */
export function KineticText({
  as: Tag = "h1",
  segments,
  className = "",
  trigger = "scroll",
  delay = 0,
  stagger = 0.022,
  children,
}: {
  as?: ElementType;
  segments: Segment[];
  className?: string;
  trigger?: "scroll" | "css";
  delay?: number;
  stagger?: number;
  children?: ReactNode;
}) {
  const ref = useRef<HTMLElement>(null);
  const label = segments.map((s) => (typeof s === "string" ? s : s.text)).join("");

  useEffect(() => {
    const el = ref.current;
    if (!el || trigger === "css") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    // Arm (hide) only once we know an observer will reveal it again.
    el.classList.add("is-armed");
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        el.classList.add("is-in");
        io.disconnect();
      },
      { rootMargin: "0px 0px -15% 0px" },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      el.classList.remove("is-armed", "is-in");
    };
  }, [trigger]);

  // Split into words (kept together) then characters.
  let key = 0;
  let charIndex = 0;
  const render = segments.map((seg, si) => {
    const text = typeof seg === "string" ? seg : seg.text;
    const cls = typeof seg === "string" ? "" : seg.className ?? "";
    const words = text.split(/(\s+)/);
    return (
      <span key={si} className={cls}>
        {words.map((w) =>
          /^\s+$/.test(w) ? (
            <span key={key++}> </span>
          ) : (
            <span key={key++} className="inline-block overflow-hidden whitespace-nowrap pb-[0.1em] -mb-[0.1em] align-bottom">
              {Array.from(w).map((ch) => (
                <span
                  key={key++}
                  className="split-char"
                  style={{ animationDelay: `${(delay + charIndex++ * (trigger === "css" ? Math.min(stagger, 0.012) : stagger)).toFixed(3)}s` }}
                >
                  {ch}
                </span>
              ))}
            </span>
          ),
        )}
      </span>
    );
  });

  return (
    <Tag ref={ref} className={`${trigger === "css" ? "kinetic-css" : "kinetic"} ${className}`}>
      <span className="sr-only">{label}</span>
      <span aria-hidden="true">{render}</span>
      {children}
    </Tag>
  );
}
