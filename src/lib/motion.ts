/**
 * Motion tokens shared by JavaScript-driven animation (GSAP, rAF loops).
 * They mirror the CSS custom properties in globals.css so CSS and JS motion
 * use the same timing and easing.
 */
export const ease = {
  out: "cubic-bezier(0.22, 1, 0.36, 1)",
  inOut: "cubic-bezier(0.65, 0, 0.35, 1)",
  emph: "cubic-bezier(0.2, 0, 0, 1)",
  spring: "cubic-bezier(0.34, 1.32, 0.64, 1)",
  springSoft: "cubic-bezier(0.3, 1.16, 0.55, 1)",
  /** GSAP equivalents. */
  gsapOut: "expo.out",
  gsapInOut: "power3.inOut",
} as const;

export const dur = { xs: 0.16, s: 0.26, m: 0.42, l: 0.64, xl: 0.9 } as const;

export function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
