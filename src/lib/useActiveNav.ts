"use client";

import { useEffect, useState } from "react";
import { HOME_SECTIONS, navKeyForPath, type HomeSection, type NavKey } from "./nav";
import { VIEW_EVENT } from "./viewMode";

/**
 * The navigation item to highlight. On dedicated routes it is the route's
 * owner. On the homepage it follows the section under an activation line at
 * 38% of the viewport: the last visible `[data-nav-section]` whose top has
 * crossed the line wins. That is deterministic (no observer races, no
 * flicker at boundaries), ignores sections hidden by the current view, and
 * re-evaluates on scroll, resize, view switches and content size changes.
 */
export function useActiveNav(pathname: string): NavKey | null {
  const route = navKeyForPath(pathname);
  const [home, setHome] = useState<NavKey>("home");

  useEffect(() => {
    if (pathname !== "/") return;
    let raf = 0;
    const compute = () => {
      raf = 0;
      const sections = Array.from(document.querySelectorAll<HTMLElement>("[data-nav-section]")).filter((el) => el.offsetParent !== null);
      if (!sections.length || window.scrollY < 40) return setHome("home");
      const line = window.innerHeight * 0.38;
      const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;
      let current: NavKey = "home";
      for (const el of sections) {
        if (atBottom || el.getBoundingClientRect().top <= line) current = HOME_SECTIONS[el.dataset.navSection as HomeSection] ?? current;
      }
      setHome(current);
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(compute);
    };
    compute();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    window.addEventListener(VIEW_EVENT, schedule);
    const ro = new ResizeObserver(schedule);
    const main = document.getElementById("main");
    if (main) ro.observe(main);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      window.removeEventListener(VIEW_EVENT, schedule);
      ro.disconnect();
    };
  }, [pathname]);

  return pathname === "/" ? home : route;
}
