"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getView, setView, VIEW_EVENT } from "@/lib/viewMode";

export const COACH_KEY = "sree:coach:view";
const COACH_ID = "view-coach";
/** How long the hint stays on screen once it is visible. */
export const COACH_VISIBLE_MS = 3000;
const EXIT_MS = 220;

type Phase = "hidden" | "positioning" | "open" | "closing";

/**
 * One-time hint pointing at the Quick/Detailed switch.
 *
 * - Shown once per browser, on the homepage in Quick View, after first paint
 *   and idle time, once the switch has a stable box. It is remembered as seen
 *   the moment it appears, so a refresh never shows it again.
 * - Anchored to the real switch with Floating UI (flip/shift/arrow), loaded on
 *   demand. It stays invisible until positioned, then a 3-second timer starts;
 *   it closes itself when the timer ends.
 * - Closes immediately on the close button, Escape, any press on the switch,
 *   a view change, or scrolling past the hero. The hint text itself switches
 *   to Detailed View. Non-modal: it never takes focus and never traps it.
 * - Every timer, listener and observer is cleared on close and on unmount.
 */
export function ViewCoachMark({ suspended, onOpenChange }: { suspended: boolean; onOpenChange: (open: boolean) => void }) {
  const [phase, setPhase] = useState<Phase>("hidden");
  const boxRef = useRef<HTMLDivElement>(null);
  const arrowRef = useRef<HTMLSpanElement>(null);
  const [side, setSide] = useState<"top" | "bottom">("bottom");

  const close = useCallback(() => {
    setPhase((p) => (p === "open" || p === "positioning" ? "closing" : p));
  }, []);

  // Decide whether to show, after paint and idle time.
  useEffect(() => {
    let seen = false;
    try {
      seen = localStorage.getItem(COACH_KEY) === "done";
    } catch {}
    if (seen || getView() !== "quick") return;
    let cancelled = false;
    let delay = 0;
    const ric = window.requestIdleCallback ?? ((cb: () => void) => window.setTimeout(cb, 600));
    const id = ric(
      () => {
        void document.fonts?.ready.then(() => {
          if (cancelled) return;
          delay = window.setTimeout(() => {
            const r = document.getElementById("view-switch")?.getBoundingClientRect();
            if (!cancelled && r && r.width > 0 && getView() === "quick") setPhase("positioning");
          }, 900);
        });
      },
      { timeout: 2500 } as IdleRequestOptions,
    );
    return () => {
      cancelled = true;
      window.clearTimeout(delay);
      (window.cancelIdleCallback ?? window.clearTimeout)(id as number);
    };
  }, []);

  const visible = phase === "open" && !suspended;
  useEffect(() => onOpenChange(visible), [visible, onOpenChange]);

  // Remember it as seen as soon as it appears.
  useEffect(() => {
    if (phase !== "positioning") return;
    try {
      localStorage.setItem(COACH_KEY, "done");
    } catch {}
  }, [phase]);

  // Position against the switch; reveal once placed.
  useEffect(() => {
    if ((phase !== "positioning" && phase !== "open") || suspended) return;
    const ref = document.getElementById("view-switch");
    const box = boxRef.current;
    const tip = arrowRef.current;
    if (!ref || !box || !tip) return;
    let stop = () => {};
    let cancelled = false;
    void import("@floating-ui/dom").then(({ arrow, autoUpdate, computePosition, flip, offset, shift }) => {
      if (cancelled) return;
      const update = () =>
        computePosition(ref, box, {
          placement: "bottom",
          strategy: "fixed",
          middleware: [
            offset(window.innerWidth < 640 ? 10 : 14),
            flip({ fallbackPlacements: ["bottom-end", "bottom-start", "left"] }),
            shift({ padding: 12 }),
            arrow({ element: tip, padding: 16 }),
          ],
        }).then(({ x, y, placement, middlewareData }) => {
          if (cancelled) return;
          Object.assign(box.style, { left: `${x}px`, top: `${y}px` });
          const s = placement.split("-")[0] as "top" | "bottom" | "left" | "right";
          setSide(s === "top" ? "top" : "bottom");
          const a = middlewareData.arrow;
          const opposite = { top: "bottom", bottom: "top", left: "right", right: "left" }[s];
          Object.assign(tip.style, { left: a?.x != null ? `${a.x}px` : "", top: a?.y != null ? `${a.y}px` : "", right: "", bottom: "", [opposite]: "-6px" });
          setPhase((p) => (p === "positioning" ? "open" : p));
        });
      // animationFrame: follow the island exactly while its width springs.
      stop = autoUpdate(ref, box, update, { animationFrame: true });
    });
    return () => {
      cancelled = true;
      stop();
    };
  }, [phase, suspended]);

  // The 3-second timer starts when the hint is actually visible.
  useEffect(() => {
    if (phase !== "open") return;
    const t = window.setTimeout(close, COACH_VISIBLE_MS);
    return () => window.clearTimeout(t);
  }, [phase, close]);

  // Exit animation, then unmount.
  useEffect(() => {
    if (phase !== "closing") return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const t = window.setTimeout(() => setPhase("hidden"), reduce ? 0 : EXIT_MS);
    return () => window.clearTimeout(t);
  }, [phase]);

  // Close on Escape, on any press on the switch, on a view change, or once the visitor scrolls on.
  useEffect(() => {
    if (phase !== "open" && phase !== "positioning") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (document.querySelector('[role="dialog"][aria-modal="true"]:not([hidden])')) return;
      close();
    };
    const sw = document.getElementById("view-switch");
    const onScroll = () => window.scrollY > window.innerHeight * 0.9 && close();
    window.addEventListener("keydown", onKey);
    window.addEventListener(VIEW_EVENT, close);
    window.addEventListener("scroll", onScroll, { passive: true });
    sw?.addEventListener("pointerdown", close);
    sw?.addEventListener("focusin", close);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener(VIEW_EVENT, close);
      window.removeEventListener("scroll", onScroll);
      sw?.removeEventListener("pointerdown", close);
      sw?.removeEventListener("focusin", close);
    };
  }, [phase, close]);

  if (phase === "hidden") return null;
  return (
    <div
      ref={boxRef}
      id={COACH_ID}
      role="dialog"
      aria-modal="false"
      aria-labelledby={`${COACH_ID}-title`}
      aria-describedby={`${COACH_ID}-body`}
      className="coach pointer-events-auto"
      data-state={phase}
      data-side={side}
      hidden={suspended}
    >
      <span ref={arrowRef} className="coach-arrow" aria-hidden="true" />
      <div className="flex items-start justify-between gap-3">
        <p id={`${COACH_ID}-title`} className="coach-title">Want the full portfolio?</p>
        <button type="button" className="coach-close" aria-label="Dismiss" onClick={close}>
          <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
            <path d="M1.5 1.5l7 7M8.5 1.5l-7 7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
        </button>
      </div>
      <button
        type="button"
        id={`${COACH_ID}-body`}
        className="coach-body coach-action"
        onClick={() => {
          setView("detailed");
          close();
        }}
      >
        Click here to switch to Detailed View and explore my complete experience, projects, and technical work.
      </button>
    </div>
  );
}

export const COACH_BODY_ID = `${COACH_ID}-body`;
