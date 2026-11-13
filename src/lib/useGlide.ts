"use client";

import { useCallback, useEffect, useLayoutEffect, useState, type RefObject } from "react";

const useIso = typeof window === "undefined" ? useEffect : useLayoutEffect;

/**
 * Positions a single "glide pill" under the selected child of a group, so the
 * selection slides between options instead of jumping. Children mark
 * themselves with data-glide-key.
 */
export function useGlide(ref: RefObject<HTMLElement | null>, activeKey: string) {
  const [box, setBox] = useState({ x: 0, y: 0, w: 0, h: 0, ready: false });
  const measure = useCallback(() => {
    const root = ref.current;
    const el = root?.querySelector<HTMLElement>(`[data-glide-key="${CSS.escape(activeKey)}"]`);
    if (!root || !el) return;
    setBox({ x: el.offsetLeft, y: el.offsetTop, w: el.offsetWidth, h: el.offsetHeight, ready: true });
  }, [ref, activeKey]);
  useIso(() => {
    measure();
  }, [measure]);
  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const ro = new ResizeObserver(measure);
    ro.observe(root);
    return () => ro.disconnect();
  }, [ref, measure]);
  return {
    style: { width: box.w, height: box.h, transform: `translate3d(${box.x}px, ${box.y}px, 0)`, opacity: box.ready ? 1 : 0 } as React.CSSProperties,
  };
}
