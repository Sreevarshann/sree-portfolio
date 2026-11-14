"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

/**
 * Looping decorations (contour echoes, capability diagrams, the hero
 * atmosphere, the Sree mark) are SVG/CSS animations that run on the main
 * thread: each running one costs a style recalc every frame, even when it is
 * scrolled far out of view. This pauses them while they are off screen and
 * resumes them just before they scroll back in, so nothing visible changes.
 * Elements opt in by class (below) or with [data-anim-pause].
 */
const SELECTOR = [
  "[data-anim-pause]",
  ".hero-atmos",
  ".sree-mark",
  ".availability-dot",
  ".signal-pulse",
  ".team-field",
  ".podium",
  "svg:has(.echo-line)",
  "svg:has(.cap-node)",
  "svg:has(.cap-flow)",
  "svg:has(.cap-packet)",
].join(",");

export function AnimationGovernor() {
  const pathname = usePathname();

  useEffect(() => {
    if (!("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.target.toggleAttribute("data-offscreen", !e.isIntersecting)),
      { rootMargin: "160px 0px" },
    );
    const seen = new WeakSet<Element>();
    const scan = () => {
      let found: NodeListOf<Element>;
      try {
        found = document.querySelectorAll(SELECTOR);
      } catch {
        return; // very old engines without :has()
      }
      found.forEach((el) => {
        if (seen.has(el)) return;
        seen.add(el);
        io.observe(el);
      });
    };
    scan();
    // Late mounts (client-only islands, the chat panel): rescan, debounced.
    let t = 0;
    const mo = new MutationObserver(() => {
      window.clearTimeout(t);
      t = window.setTimeout(scan, 400);
    });
    mo.observe(document.body, { childList: true, subtree: true });
    return () => {
      window.clearTimeout(t);
      mo.disconnect();
      io.disconnect();
      document.querySelectorAll("[data-offscreen]").forEach((el) => el.removeAttribute("data-offscreen"));
    };
  }, [pathname]);

  return null;
}
