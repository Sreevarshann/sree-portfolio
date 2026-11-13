"use client";

import { setView, useViewMode, type ViewMode } from "@/lib/viewMode";

/**
 * Quick / Detailed segmented control in the island. Two toggle buttons in a
 * labelled group; the pressed one is the current view. A sliding thumb shows
 * the selection. Full labels on wide screens, short ones when space is tight.
 */
export function ViewSwitch({ describedBy }: { describedBy?: string }) {
  const view = useViewMode();
  const opt = (v: ViewMode, long: string, short: string) => (
    <button
      type="button"
      aria-pressed={view === v}
      aria-label={long}
      data-view-option={v}
      onClick={() => setView(v)}
      className="view-switch-opt"
    >
      <span className="view-switch-long">{long}</span>
      <span className="view-switch-short">{short}</span>
    </button>
  );
  return (
    <div id="view-switch" role="group" aria-label="Portfolio view" aria-describedby={describedBy} className="view-switch" data-island-part="view" data-current={view}>
      <span className="view-switch-thumb" aria-hidden="true" />
      {opt("quick", "Quick View", "Quick")}
      {opt("detailed", "Detailed View", "Detailed")}
    </div>
  );
}
