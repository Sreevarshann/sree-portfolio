"use client";

import { useEffect } from "react";

/**
 * Cursor light for the homepage cards. One delegated listener: while a fine
 * pointer moves over a `.lux` card, the card's --mx / --my custom properties
 * follow it (once per frame), and CSS draws the light from them. No React
 * state, no re-renders, nothing on touch screens.
 */
export function CardLight() {
  useEffect(() => {
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    let raf = 0;
    let card: HTMLElement | null = null;
    let x = 0;
    let y = 0;
    const paint = () => {
      raf = 0;
      if (!card) return;
      const r = card.getBoundingClientRect();
      card.style.setProperty("--mx", `${(x - r.left).toFixed(1)}px`);
      card.style.setProperty("--my", `${(y - r.top).toFixed(1)}px`);
    };
    const move = (e: PointerEvent) => {
      card = (e.target as Element | null)?.closest?.<HTMLElement>(".lux") ?? null;
      if (!card) return;
      x = e.clientX;
      y = e.clientY;
      if (!raf) raf = requestAnimationFrame(paint);
    };
    document.addEventListener("pointermove", move, { passive: true });
    return () => {
      document.removeEventListener("pointermove", move);
      cancelAnimationFrame(raf);
    };
  }, []);
  return null;
}
