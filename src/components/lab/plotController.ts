import type { Config, Data, Layout } from "plotly.js-dist-min";

/** The subset of Plotly this controller uses (kept small so tests can fake it). */
export type PlotlyLike = {
  react: (el: HTMLElement, data: Data[], layout: Partial<Layout>, config?: Partial<Config>) => Promise<unknown>;
  purge: (el: HTMLElement) => void;
  Plots: { resize: (el: HTMLElement) => Promise<unknown> | void };
};

/**
 * Owns one Plotly chart's lifecycle so that no call can reach Plotly after the
 * element is gone, hidden, or not yet plotted.
 *
 * Plotly throws "Resize must be passed a displayed plot div element" when
 * `Plots.resize` runs on a div that was purged, detached, hidden
 * (display:none / zero size) or never finished `react`. In development React
 * Strict Mode mounts → unmounts → remounts effects, which used to purge the div
 * and then let a ResizeObserver resize it. Every entry point below checks a
 * generation token plus the element's state first.
 */
export function createPlotController(el: HTMLElement, load: () => Promise<PlotlyLike>) {
  let disposed = false;
  let plotted = false;
  let generation = 0;
  let frame = 0;
  let plotly: PlotlyLike | null = null;

  const isDisplayed = () => {
    if (!el.isConnected) return false;
    const r = el.getBoundingClientRect();
    if (r.width <= 0 || r.height <= 0) return false;
    // offsetParent is null for display:none ancestors (and for position:fixed, which charts never use).
    return el.offsetParent !== null || getComputedStyle(el).position === "fixed";
  };

  /** Draw or update. Resolves to false when the call became stale. */
  async function render(data: Data[], layout: Partial<Layout>, config: Partial<Config>): Promise<boolean> {
    const gen = ++generation;
    const lib = (plotly ??= await load());
    if (disposed || gen !== generation || !el.isConnected) return false;
    await lib.react(el, data, layout, config);
    if (disposed || gen !== generation) return false;
    plotted = true;
    return true;
  }

  /** Coalesces bursts of resize notifications into one per animation frame. */
  function requestResize() {
    if (disposed || frame) return;
    frame = requestAnimationFrame(() => {
      frame = 0;
      resizeNow();
    });
  }

  function resizeNow(): boolean {
    if (disposed || !plotted || !plotly || !isDisplayed()) return false;
    try {
      const out = plotly.Plots.resize(el);
      if (out && typeof (out as Promise<unknown>).catch === "function") {
        (out as Promise<unknown>).catch((err) => {
          // A resize raced with a teardown; the guards above make this rare. Report, don't crash.
          if (!disposed) console.warn("[lab] chart resize skipped:", (err as Error)?.message);
        });
      }
      return true;
    } catch (err) {
      if (!disposed) console.warn("[lab] chart resize skipped:", (err as Error)?.message);
      return false;
    }
  }

  function dispose() {
    if (disposed) return;
    disposed = true;
    generation++;
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
    if (plotted && plotly) {
      try {
        plotly.purge(el);
      } catch {
        /* element already torn down */
      }
    }
    plotted = false;
  }

  return {
    render,
    requestResize,
    resizeNow,
    dispose,
    get plotted() {
      return plotted;
    },
    get disposed() {
      return disposed;
    },
  };
}

export type PlotController = ReturnType<typeof createPlotController>;
