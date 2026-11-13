"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { arrow, autoUpdate, computePosition, flip, offset, shift } from "@floating-ui/dom";
import { getView, setView, VIEW_EVENT } from "@/lib/viewMode";

export const COACH_KEY = "sree:coach:view";
const COACH_ID = "view-coach";

/**
 * One-time onboarding coach mark pointing at the Quick/Detailed switch.
 *
 * - Appears only on the homepage, in Quick View, for visitors who have not
 *   dismissed it, after first paint once the browser is idle and the switch
 *   has a stable box. It never delays rendering.
 * - Anchored to the real switch with Floating UI (flip/shift/arrow); it
 *   follows the island while it springs between states, on scroll, resize,
 *   zoom and font changes, and never leaves the viewport.
 * - Non-modal: no focus trap, Escape closes it, scrolling past the hero
 *   counts as ignoring it. Any outcome is remembered so it shows only once.
 */
export function ViewCoachMark({ suspended, onOpenChange }: { suspended: boolean; onOpenChange: (open: boolean) => void }) {
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  const arrowRef = useRef<HTMLSpanElement>(null);
  const [side, setSide] = useState<"top" | "bottom">("bottom");

  const finish = useCallback(() => {
    try {
      localStorage.setItem(COACH_KEY, "done");
    } catch {}
    setOpen(false);
  }, []);

  // Decide whether to show, after paint and idle time.
  useEffect(() => {
    let seen = false;
    try {
      seen = localStorage.getItem(COACH_KEY) === "done";
    } catch {}
    if (seen || getView() !== "quick") return;
    let cancelled = false;
    const ric = window.requestIdleCallback ?? ((cb: () => void) => window.setTimeout(cb, 600));
    const id = ric(
      () => {
        void document.fonts?.ready.then(() => {
          window.setTimeout(() => {
            const sw = document.getElementById("view-switch");
            const r = sw?.getBoundingClientRect();
            if (!cancelled && r && r.width > 0 && getView() === "quick") setOpen(true);
          }, 900);
        });
      },
      { timeout: 2500 } as IdleRequestOptions,
    );
    return () => {
      cancelled = true;
      (window.cancelIdleCallback ?? window.clearTimeout)(id as number);
    };
  }, []);

  useEffect(() => onOpenChange(open && !suspended), [open, suspended, onOpenChange]);

  // Position against the switch while open.
  useEffect(() => {
    if (!open || suspended) return;
    const ref = document.getElementById("view-switch");
    const box = boxRef.current;
    const tip = arrowRef.current;
    if (!ref || !box || !tip) return;
    const update = () =>
      computePosition(ref, box, {
        placement: "bottom",
        strategy: "fixed",
        middleware: [offset(14), flip({ fallbackPlacements: ["bottom-end", "left", "top"] }), shift({ padding: 12 }), arrow({ element: tip, padding: 16 })],
      }).then(({ x, y, placement, middlewareData }) => {
        Object.assign(box.style, { left: `${x}px`, top: `${y}px` });
        const s = placement.split("-")[0] as "top" | "bottom" | "left" | "right";
        setSide(s === "top" ? "top" : "bottom");
        const a = middlewareData.arrow;
        const opposite = { top: "bottom", bottom: "top", left: "right", right: "left" }[s];
        Object.assign(tip.style, { left: a?.x != null ? `${a.x}px` : "", top: a?.y != null ? `${a.y}px` : "", right: "", bottom: "", [opposite]: "-6px" });
      });
    // animationFrame: follow the island exactly while its width springs.
    return autoUpdate(ref, box, update, { animationFrame: true });
  }, [open, suspended]);

  // Close on Escape, on switching views, and once the visitor scrolls on.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (document.querySelector('[role="dialog"][aria-modal="true"]:not([hidden])')) return;
      const inside = boxRef.current?.contains(document.activeElement);
      finish();
      if (inside) document.querySelector<HTMLElement>("#view-switch [aria-pressed='true']")?.focus();
    };
    const onView = () => finish();
    const onScroll = () => window.scrollY > window.innerHeight * 0.9 && finish();
    window.addEventListener("keydown", onKey);
    window.addEventListener(VIEW_EVENT, onView);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener(VIEW_EVENT, onView);
      window.removeEventListener("scroll", onScroll);
    };
  }, [open, finish]);

  if (!open) return null;
  return (
    <div
      ref={boxRef}
      id={COACH_ID}
      role="dialog"
      aria-modal="false"
      aria-labelledby={`${COACH_ID}-title`}
      aria-describedby={`${COACH_ID}-body`}
      className="coach pointer-events-auto"
      data-state="open"
      data-side={side}
      hidden={suspended}
    >
      <span ref={arrowRef} className="coach-arrow" aria-hidden="true" />
      <p id={`${COACH_ID}-title`} className="coach-title">Want the full story?</p>
      <p id={`${COACH_ID}-body`} className="coach-body">
        You&apos;re seeing the highlights. Switch to Detailed View to explore the engineering behind my work.
      </p>
      <div className="coach-actions">
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => {
            setView("detailed");
            finish();
            document.querySelector<HTMLElement>("#view-switch [data-view-option='detailed']")?.focus();
          }}
        >
          Explore details
        </button>
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => {
            finish();
            document.querySelector<HTMLElement>("#view-switch [aria-pressed='true']")?.focus();
          }}
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}

export const COACH_BODY_ID = `${COACH_ID}-body`;
