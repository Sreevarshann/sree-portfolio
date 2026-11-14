"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { loadGsap } from "@/lib/loadGsap";
import { VIEW_EVENT } from "@/lib/viewMode";

const WIDE = "(min-width: 1024px)";

/**
 * Scroll-linked choreography that CSS can't express on its own:
 *  - [data-parallax="0.12"]  gentle scroll-linked translate
 *    ([data-parallax-min="1024"] limits it to viewports at least that wide)
 *  - [data-progress]         scaleY driven by its parent's scroll progress
 *  - [data-scroll-out]       the hero recedes on wide screens
 * Entrance reveals ([data-reveal]) are pure CSS scroll-driven animations
 * (see globals.css), so they never wait for hydration.
 *
 * Only elements that are actually rendered get a ScrollTrigger: the content
 * hidden by the current Quick/Detailed view is skipped, and the set is rebuilt
 * (never duplicated) when the view or the breakpoint changes. Trigger positions
 * are refreshed when the page height changes (a view switch, an expanded
 * <details>, late images), not only on window resize.
 * Initialisation waits for idle time and is skipped under reduced motion.
 */
export function MotionRuntime() {
  const pathname = usePathname();

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let ctx: { revert: () => void } | undefined;
    let cancelled = false;
    let refresh = () => {};
    let rebuild = () => {};
    let ro: ResizeObserver | undefined;
    let refreshTimer = 0;
    const wideMq = window.matchMedia(WIDE);

    const start = async () => {
      if (!document.querySelector("[data-parallax], [data-progress], [data-scroll-out]")) return;
      const { gsap, ScrollTrigger } = await loadGsap();
      if (cancelled) return;
      refresh = () => ScrollTrigger.refresh();
      const shown = (el: HTMLElement) => el.offsetParent !== null || getComputedStyle(el).position === "fixed";

      const build = () => {
        ctx?.revert();
        const wide = wideMq.matches;
        ctx = gsap.context(() => {
          gsap.utils.toArray<HTMLElement>("[data-parallax]").forEach((el) => {
            const min = Number(el.dataset.parallaxMin || 0);
            if (window.innerWidth < min || !shown(el)) return;
            const amt = parseFloat(el.dataset.parallax || "0.12");
            gsap.fromTo(
              el,
              { yPercent: -amt * 50 },
              { yPercent: amt * 50, ease: "none", scrollTrigger: { trigger: el.parentElement ?? el, start: "top bottom", end: "bottom top", scrub: true } },
            );
          });
          // On phones the hero's lower half is still being read while scrolling,
          // so it only recedes where it fits one view.
          if (wide) {
            gsap.utils.toArray<HTMLElement>("[data-scroll-out]").filter(shown).forEach((el) => {
              gsap.to(el, {
                yPercent: -8,
                opacity: 0.25,
                scale: 0.97,
                ease: "none",
                transformOrigin: "50% 0%",
                scrollTrigger: { trigger: el.closest("section") ?? el, start: "top top", end: "bottom top", scrub: true },
              });
            });
          }
          gsap.utils.toArray<HTMLElement>("[data-progress]").filter(shown).forEach((el) => {
            gsap.fromTo(
              el,
              { scaleY: 0 },
              { scaleY: 1, ease: "none", transformOrigin: "top", scrollTrigger: { trigger: el.parentElement ?? el, start: "top 70%", end: "bottom 60%", scrub: 0.6 } },
            );
          });
        });
        // Exposed for diagnostics and tests: the live trigger count.
        document.documentElement.dataset.motionTriggers = String(ScrollTrigger.getAll().length);
      };
      rebuild = () => {
        if (cancelled) return;
        // Wait a frame so the new view's display rules have applied.
        requestAnimationFrame(() => !cancelled && build());
      };

      build();
      window.addEventListener("load", refresh);
      document.fonts?.ready.then(refresh).catch(() => {});
      window.addEventListener(VIEW_EVENT, rebuild);
      wideMq.addEventListener("change", rebuild);
      // Height changes without a window resize (view switch, <details>, images).
      let lastH = document.body.scrollHeight;
      ro = new ResizeObserver(() => {
        const h = document.body.scrollHeight;
        if (Math.abs(h - lastH) < 2) return;
        lastH = h;
        window.clearTimeout(refreshTimer);
        refreshTimer = window.setTimeout(refresh, 150);
      });
      ro.observe(document.body);
    };
    const ric = window.requestIdleCallback ?? ((cb: () => void) => window.setTimeout(cb, 200));
    const cic = window.cancelIdleCallback ?? window.clearTimeout;
    const id = ric(() => void start(), { timeout: 1500 } as IdleRequestOptions);
    return () => {
      cancelled = true;
      cic(id as number);
      window.clearTimeout(refreshTimer);
      ro?.disconnect();
      window.removeEventListener("load", refresh);
      window.removeEventListener(VIEW_EVENT, rebuild);
      wideMq.removeEventListener("change", rebuild);
      ctx?.revert();
      delete document.documentElement.dataset.motionTriggers;
    };
  }, [pathname]);

  return null;
}
