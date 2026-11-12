"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/**
 * Scroll-linked choreography that CSS can't express on its own:
 *  - [data-parallax="0.12"]  gentle scroll-linked translate
 *  - [data-progress]         scaleY driven by its parent's scroll progress
 * Entrance reveals ([data-reveal]) are pure CSS scroll-driven animations
 * (see globals.css), so they never wait for hydration.
 * Initialisation waits for the browser to be idle so it never competes with
 * first paint; everything is skipped under reduced motion.
 */
export function MotionRuntime() {
  const pathname = usePathname();

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let ctx: gsap.Context | undefined;
    const start = () => {
      ctx = gsap.context(() => {
        gsap.utils.toArray<HTMLElement>("[data-parallax]").forEach((el) => {
          const amt = parseFloat(el.dataset.parallax || "0.12");
          gsap.fromTo(
            el,
            { yPercent: -amt * 50 },
            { yPercent: amt * 50, ease: "none", scrollTrigger: { trigger: el.parentElement ?? el, start: "top bottom", end: "bottom top", scrub: true } },
          );
        });
        gsap.utils.toArray<HTMLElement>("[data-progress]").forEach((el) => {
          gsap.fromTo(
            el,
            { scaleY: 0 },
            { scaleY: 1, ease: "none", transformOrigin: "top", scrollTrigger: { trigger: el.parentElement ?? el, start: "top 70%", end: "bottom 60%", scrub: 0.6 } },
          );
        });
      });
    };
    const ric = window.requestIdleCallback ?? ((cb: () => void) => window.setTimeout(cb, 200));
    const cic = window.cancelIdleCallback ?? window.clearTimeout;
    const id = ric(start, { timeout: 1500 } as IdleRequestOptions);
    const refresh = () => ScrollTrigger.refresh();
    window.addEventListener("load", refresh);
    document.fonts?.ready.then(refresh).catch(() => {});
    return () => {
      cic(id as number);
      window.removeEventListener("load", refresh);
      ctx?.revert();
    };
  }, [pathname]);

  return null;
}
