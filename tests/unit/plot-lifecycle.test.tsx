import { StrictMode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, render } from "@testing-library/react";
import { createPlotController, type PlotlyLike } from "@/components/lab/plotController";

/* ------------------------------------------------------------- fakes */
function fakePlotly() {
  const purged = new Set<HTMLElement>();
  const lib = {
    react: vi.fn(async () => undefined),
    purge: vi.fn((el: HTMLElement) => purged.add(el)),
    Plots: {
      // Mirrors Plotly: resizing a purged/undisplayed div rejects.
      resize: vi.fn((el: HTMLElement) => {
        if (purged.has(el) || !el.isConnected) return Promise.reject(new Error("Resize must be passed a displayed plot div element."));
        return Promise.resolve();
      }),
    },
  };
  return lib as typeof lib & PlotlyLike;
}

function displayed(el: HTMLElement, w = 600, h = 380) {
  el.getBoundingClientRect = () => ({ width: w, height: h, x: 0, y: 0, top: 0, left: 0, right: w, bottom: h, toJSON: () => ({}) });
  Object.defineProperty(el, "offsetParent", { configurable: true, get: () => (el.isConnected ? document.body : null) });
}

const flush = () => new Promise((r) => setTimeout(r, 0));

/* ------------------------------------------------------------- controller */
describe("plot controller", () => {
  let el: HTMLDivElement;
  beforeEach(() => {
    el = document.createElement("div");
    document.body.appendChild(el);
    displayed(el);
    vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => setTimeout(() => cb(0), 0) as unknown as number);
    vi.stubGlobal("cancelAnimationFrame", (id: number) => clearTimeout(id));
  });
  afterEach(() => el.remove());

  it("does not resize before the first plot has finished", async () => {
    const P = fakePlotly();
    let release!: () => void;
    P.react.mockImplementationOnce(() => new Promise<void>((r) => (release = r)));
    const c = createPlotController(el, async () => P);
    const pending = c.render([], {}, {});
    await flush();
    expect(c.resizeNow()).toBe(false);
    release();
    await pending;
    expect(c.resizeNow()).toBe(true);
    expect(P.Plots.resize).toHaveBeenCalledTimes(1);
  });

  it("never resizes a hidden (display:none / zero-size) element", async () => {
    const P = fakePlotly();
    const c = createPlotController(el, async () => P);
    await c.render([], {}, {});
    displayed(el, 0, 0);
    expect(c.resizeNow()).toBe(false);
    Object.defineProperty(el, "offsetParent", { configurable: true, get: () => null });
    displayed(el, 600, 380);
    Object.defineProperty(el, "offsetParent", { configurable: true, get: () => null });
    expect(c.resizeNow()).toBe(false);
    expect(P.Plots.resize).not.toHaveBeenCalled();
  });

  it("ignores resize and render after dispose (unmount)", async () => {
    const P = fakePlotly();
    const c = createPlotController(el, async () => P);
    await c.render([], {}, {});
    c.dispose();
    expect(P.purge).toHaveBeenCalledWith(el);
    expect(c.resizeNow()).toBe(false);
    c.requestResize();
    await flush();
    expect(P.Plots.resize).not.toHaveBeenCalled();
    expect(await c.render([], {}, {})).toBe(false);
  });

  it("drops a render that was superseded or whose element was detached", async () => {
    const P = fakePlotly();
    const c = createPlotController(el, async () => P);
    const first = c.render([], { title: { text: "a" } }, {});
    const second = c.render([], { title: { text: "b" } }, {});
    expect(await first).toBe(false);
    expect(await second).toBe(true);
    el.remove();
    expect(await c.render([], {}, {})).toBe(false);
  });

  it("coalesces bursts of resize notifications into one frame", async () => {
    const P = fakePlotly();
    const c = createPlotController(el, async () => P);
    await c.render([], {}, {});
    for (let i = 0; i < 20; i++) c.requestResize();
    await flush();
    expect(P.Plots.resize).toHaveBeenCalledTimes(1);
  });

  it("cancels a pending resize frame on dispose (rapid navigation)", async () => {
    const P = fakePlotly();
    const c = createPlotController(el, async () => P);
    await c.render([], {}, {});
    c.requestResize();
    c.dispose();
    el.remove();
    await flush();
    expect(P.Plots.resize).not.toHaveBeenCalled();
  });

  it("reports (does not throw) if Plotly still rejects a resize", async () => {
    const P = fakePlotly();
    P.Plots.resize.mockImplementationOnce(() => Promise.reject(new Error("Resize must be passed a displayed plot div element.")));
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const c = createPlotController(el, async () => P);
    await c.render([], {}, {});
    expect(() => c.resizeNow()).not.toThrow();
    await flush();
    expect(warn).toHaveBeenCalled();
  });
});

/* ------------------------------------------------------------- component under Strict Mode */
const plotly = fakePlotly();
vi.mock("plotly.js-dist-min", () => ({ default: plotly }));

type RO = { cb: ResizeObserverCallback; disconnected: boolean };
const observers: RO[] = [];

describe("PlotlyFigure component", () => {
  beforeEach(() => {
    observers.length = 0;
    plotly.react.mockClear();
    plotly.purge.mockClear();
    plotly.Plots.resize.mockClear();
    vi.stubGlobal(
      "ResizeObserver",
      class {
        rec: RO;
        constructor(cb: ResizeObserverCallback) {
          this.rec = { cb, disconnected: false };
          observers.push(this.rec);
        }
        observe() {}
        disconnect() {
          this.rec.disconnected = true;
        }
      },
    );
    vi.stubGlobal(
      "IntersectionObserver",
      class {
        cb: IntersectionObserverCallback;
        constructor(cb: IntersectionObserverCallback) {
          this.cb = cb;
        }
        observe() {
          this.cb([{ isIntersecting: true } as IntersectionObserverEntry], this as unknown as IntersectionObserver);
        }
        disconnect() {}
      },
    );
    vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => setTimeout(() => cb(0), 0) as unknown as number);
    vi.stubGlobal("cancelAnimationFrame", (id: number) => clearTimeout(id));
    vi.stubGlobal("matchMedia", () => ({ matches: false, addEventListener() {}, removeEventListener() {} }));
    Object.defineProperty(HTMLElement.prototype, "offsetParent", { configurable: true, get() { return this.isConnected ? document.body : null; } });
    HTMLElement.prototype.getBoundingClientRect = function () {
      return { width: 600, height: 380, x: 0, y: 0, top: 0, left: 0, right: 600, bottom: 380, toJSON: () => ({}) };
    };
  });

  it("survives Strict Mode double-mount, resizes, and stops after unmount", async () => {
    const { PlotlyFigure } = await import("@/components/lab/PlotlyFigure");
    const errors: unknown[] = [];
    const onRejection = (e: PromiseRejectionEvent) => errors.push(e.reason);
    window.addEventListener("unhandledrejection", onRejection);

    const view = render(
      <StrictMode>
        <PlotlyFigure label="test chart" deps={[]} build={() => ({ data: [{ type: "bar", x: [1], y: [1] }] })} />
      </StrictMode>,
    );
    await act(async () => {
      await flush();
      await flush();
    });
    // The Strict Mode "fake unmount" disposed the first controller's observer.
    expect(observers.length).toBe(2);
    expect(observers[0].disconnected).toBe(true);
    expect(plotly.react).toHaveBeenCalled();

    // A resize notification on the live observer resizes the live, plotted div.
    await act(async () => {
      observers[1].cb([], {} as ResizeObserver);
      observers[0].cb([], {} as ResizeObserver); // stale observer: must be a no-op
      await flush();
    });
    expect(plotly.Plots.resize).toHaveBeenCalledTimes(1);

    view.unmount();
    expect(observers[1].disconnected).toBe(true);
    await act(async () => {
      observers[1].cb([], {} as ResizeObserver);
      await flush();
    });
    expect(plotly.Plots.resize).toHaveBeenCalledTimes(1);
    expect(plotly.purge).toHaveBeenCalled();
    window.removeEventListener("unhandledrejection", onRejection);
    expect(errors).toEqual([]);
  });
});
