"use client";

import { useEffect, useRef } from "react";
import { loadGsap } from "@/lib/loadGsap";

/** A statement whose words light up as the reader scrolls through it. */
export function ScrollStatement({ text, highlight = [] }: { text: string; highlight?: string[] }) {
  const ref = useRef<HTMLParagraphElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const words = el.querySelectorAll<HTMLElement>("[data-w]");
    let ctx: { revert: () => void } | undefined;
    let cancelled = false;
    void loadGsap().then(({ gsap }) => {
      if (cancelled) return;
      ctx = gsap.context(() => {
      gsap.fromTo(
        words,
        { opacity: 0.56 },
        { opacity: 1, stagger: 0.05, ease: "none", scrollTrigger: { trigger: el, start: "top 80%", end: "bottom 45%", scrub: 0.4 } },
      );
      }, el);
    });
    return () => {
      cancelled = true;
      ctx?.revert();
    };
  }, []);
  const hl = new Set(highlight.map((h) => h.toLowerCase()));
  return (
    <p ref={ref} className="text-[clamp(1.7rem,4.2vw,3.6rem)] font-medium leading-[1.12] tracking-[-0.035em]">
      {text.split(" ").map((w, i) => {
        const clean = w.replace(/[^a-z-]/gi, "").toLowerCase();
        return (
          <span key={i} data-w className={hl.has(clean) ? "serif-accent text-accent-fg" : ""}>
            {w}{" "}
          </span>
        );
      })}
    </p>
  );
}
