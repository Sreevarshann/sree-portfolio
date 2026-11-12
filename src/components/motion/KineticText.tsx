"use client";

import { useEffect, useRef, type ElementType, type ReactNode } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

type Segment = string | { text: string; className?: string };

/**
 * Kinetic headline: characters rise out of a mask with a stagger.
 * Screen readers get the plain sentence via aria-label.
 */
export function KineticText({
  as: Tag = "h1",
  segments,
  className = "",
  trigger = "mount",
  delay = 0,
  stagger = 0.022,
  children,
}: {
  as?: ElementType;
  segments: Segment[];
  className?: string;
  trigger?: "mount" | "scroll" | "css";
  delay?: number;
  stagger?: number;
  children?: ReactNode;
}) {
  const ref = useRef<HTMLElement>(null);
  const label = segments.map((s) => (typeof s === "string" ? s : s.text)).join("");

  useEffect(() => {
    const el = ref.current;
    if (!el || trigger === "css") return;
    const chars = el.querySelectorAll<HTMLElement>(".split-char");
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    el.classList.add("is-armed");
    const ctx = gsap.context(() => {
      const tween = {
        y: 0,
        yPercent: 0,
        rotate: 0,
        duration: 1.1,
        ease: "expo.out",
        stagger,
        delay,
      };
      if (trigger === "scroll") gsap.fromTo(chars, { y: 0, yPercent: 115, rotate: 4 }, { ...tween, scrollTrigger: { trigger: el, start: "top 85%", once: true } });
      else gsap.fromTo(chars, { y: 0, yPercent: 115, rotate: 4 }, tween);
    }, el);
    return () => {
      ctx.revert();
      el.classList.remove("is-armed");
    };
  }, [trigger, delay, stagger]);

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
                  style={trigger === "css" ? { animationDelay: `${(delay + charIndex++ * stagger).toFixed(3)}s` } : undefined}
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
    <Tag ref={ref} className={`${trigger === "css" ? "kinetic-css" : "kinetic"} ${className}`} aria-label={label}>
      <span aria-hidden="true">{render}</span>
      {children}
    </Tag>
  );
}
