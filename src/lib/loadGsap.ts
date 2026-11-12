"use client";

import type { gsap as GsapType } from "gsap";

type Loaded = { gsap: typeof GsapType; ScrollTrigger: typeof import("gsap/ScrollTrigger").ScrollTrigger };
let promise: Promise<Loaded> | null = null;

/**
 * GSAP + ScrollTrigger on demand. Kept out of the initial bundle so first
 * paint never waits on animation code; every caller runs after idle or on
 * scroll, where a few milliseconds of loading are invisible.
 */
export function loadGsap(): Promise<Loaded> {
  promise ??= Promise.all([import("gsap"), import("gsap/ScrollTrigger")]).then(([g, st]) => {
    g.gsap.registerPlugin(st.ScrollTrigger);
    return { gsap: g.gsap, ScrollTrigger: st.ScrollTrigger };
  });
  return promise;
}
