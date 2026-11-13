"use client";

import { useSyncExternalStore } from "react";

/**
 * Homepage presentation: "quick" (default first impression) or "detailed".
 * The source of truth is html[data-view], set before paint by viewScript and
 * updated here; CSS gates view-specific content from it. The choice is kept
 * in localStorage (no personal data) and mirrored in ?view= with
 * history.replaceState, so switching adds no history entries.
 */
export type ViewMode = "quick" | "detailed";

const KEY = "sree:view";
const EVENT = "sree:viewchange";
const listeners = new Set<() => void>();

export function getView(): ViewMode {
  if (typeof document === "undefined") return "quick";
  return document.documentElement.getAttribute("data-view") === "detailed" ? "detailed" : "quick";
}

function emit() {
  listeners.forEach((l) => l());
  window.dispatchEvent(new CustomEvent(EVENT, { detail: getView() }));
}

/** Sections present in both views keep their position on screen across a switch. */
function anchorBeforeSwitch() {
  const sections = Array.from(document.querySelectorAll<HTMLElement>("[data-view-anchor]")).filter((el) => el.offsetParent !== null);
  const line = 96;
  const el = sections.find((s) => s.getBoundingClientRect().bottom > line) ?? null;
  return el ? { id: el.dataset.viewAnchor!, offset: el.getBoundingClientRect().top } : null;
}

function restoreAnchor(anchor: { id: string; offset: number } | null) {
  if (!anchor) return;
  const el = Array.from(document.querySelectorAll<HTMLElement>(`[data-view-anchor="${anchor.id}"]`)).find((e) => e.offsetParent !== null);
  if (!el) return;
  const delta = el.getBoundingClientRect().top - anchor.offset;
  if (Math.abs(delta) > 1) window.scrollTo({ top: window.scrollY + delta, behavior: "instant" as ScrollBehavior });
}

export function setView(v: ViewMode, opts: { animate?: boolean } = {}) {
  if (typeof document === "undefined" || v === getView()) return;
  const apply = () => {
    const anchor = anchorBeforeSwitch();
    document.documentElement.setAttribute("data-view", v);
    restoreAnchor(anchor);
    try {
      localStorage.setItem(KEY, v);
    } catch {}
    const url = new URL(window.location.href);
    if (url.pathname === "/") {
      url.searchParams.set("view", v);
      window.history.replaceState(window.history.state, "", url);
    }
    emit();
  };
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const doc = document as Document & { startViewTransition?: (cb: () => void) => unknown };
  if (opts.animate !== false && !reduce && doc.startViewTransition) doc.startViewTransition(apply);
  else apply();
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  // Back/forward restores ?view= in the URL: follow it.
  const onPop = () => {
    const q = new URLSearchParams(window.location.search).get("view");
    if ((q === "quick" || q === "detailed") && q !== getView()) {
      document.documentElement.setAttribute("data-view", q);
      emit();
    }
  };
  window.addEventListener("popstate", onPop);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("popstate", onPop);
  };
}

/** Current view; "quick" during server render and hydration, then the real value. */
export function useViewMode(): ViewMode {
  return useSyncExternalStore(subscribe, getView, () => "quick");
}

export const VIEW_EVENT = EVENT;
