"use client";

import { useEffect, useRef, useState } from "react";
import type { Data, Layout } from "plotly.js-dist-min";

export type ChartTheme = {
  mode: "light" | "dark";
  surface: string;
  text: string;
  muted: string;
  grid: string;
  axis: string;
  s1: string;
  s2: string;
  s3: string;
  seq: string[];
  font: string;
  mono: string;
};

/** Validated categorical palette (blue, orange, aqua) stepped per theme. */
export function chartTheme(): ChartTheme {
  const dark = document.documentElement.getAttribute("data-theme") !== "light";
  const css = getComputedStyle(document.documentElement);
  const font = css.getPropertyValue("--font-sans").trim() || "system-ui";
  const mono = css.getPropertyValue("--font-mono").trim() || "monospace";
  return dark
    ? { mode: "dark", surface: "#0d1016", text: "#eef1f6", muted: "#8b95a7", grid: "rgba(148,163,184,0.12)", axis: "rgba(148,163,184,0.28)", s1: "#3987e5", s2: "#d95926", s3: "#199e70", seq: ["#141c2b", "#1b3a6e", "#2a5cb0"], font, mono }
    : { mode: "light", surface: "#ffffff", text: "#0d1117", muted: "#586273", grid: "rgba(15,23,42,0.07)", axis: "rgba(15,23,42,0.22)", s1: "#2a78d6", s2: "#eb6834", s3: "#1baf7a", seq: ["#f1f5fc", "#c9dbf6", "#8fb3ec"], font, mono };
}

export function baseLayout(t: ChartTheme, extra: Partial<Layout> = {}): Partial<Layout> {
  const axis = { gridcolor: t.grid, linecolor: t.axis, zerolinecolor: t.axis, tickfont: { color: t.muted, family: t.mono, size: 11 }, automargin: true };
  const { xaxis, yaxis, ...rest } = extra;
  return {
    paper_bgcolor: "rgba(0,0,0,0)",
    plot_bgcolor: "rgba(0,0,0,0)",
    font: { family: t.font, color: t.text, size: 13 },
    margin: { l: 56, r: 20, t: 16, b: 48 },
    hoverlabel: { bgcolor: t.surface, bordercolor: t.axis, font: { family: t.font, color: t.text, size: 13 } },
    legend: { orientation: "h", x: 0, y: 1.12, font: { color: t.muted, size: 12 }, bgcolor: "rgba(0,0,0,0)" },
    bargap: 0.35,
    bargroupgap: 0.08,
    transition: { duration: 450, easing: "cubic-in-out" },
    ...rest,
    // Merge axis overrides onto the themed defaults instead of replacing them.
    xaxis: { ...axis, ...xaxis, tickfont: { ...axis.tickfont, ...xaxis?.tickfont } },
    yaxis: { ...axis, ...yaxis, tickfont: { ...axis.tickfont, ...yaxis?.tickfont } },
  };
}

type PlotlyLib = typeof import("plotly.js-dist-min");
let plotlyPromise: Promise<PlotlyLib> | null = null;
const loadPlotly = () => (plotlyPromise ??= import("plotly.js-dist-min").then((m) => (m as unknown as { default: PlotlyLib }).default ?? m));

/**
 * Lazy Plotly renderer: the library (~1 MB gz) is fetched only when a chart
 * nears the viewport, re-themed on theme change and resized with its container.
 */
export function PlotlyFigure({
  build,
  deps,
  height = 380,
  label,
}: {
  build: (t: ChartTheme) => { data: Data[]; layout?: Partial<Layout> };
  deps: unknown[];
  height?: number;
  label: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [near, setNear] = useState(false);
  const [themeTick, setThemeTick] = useState(0);
  const buildRef = useRef(build);
  useEffect(() => {
    buildRef.current = build;
  });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => e.isIntersecting && (setNear(true), io.disconnect()), { rootMargin: "150px" });
    io.observe(el);
    const mo = new MutationObserver(() => setThemeTick((n) => n + 1));
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => {
      io.disconnect();
      mo.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!near || !ref.current) return;
    let cancelled = false;
    const el = ref.current;
    setState((s) => (s === "ready" ? s : "loading"));
    loadPlotly()
      .then((Plotly) => {
        if (cancelled) return;
        const t = chartTheme();
        const fig = buildRef.current(t);
        const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        const layout = baseLayout(t, { height, ...fig.layout });
        if (reduce) layout.transition = { duration: 0 };
        return Plotly.react(el, fig.data, layout, {
          responsive: true,
          displayModeBar: false,
          displaylogo: false,
          scrollZoom: false,
        }).then(() => !cancelled && setState("ready"));
      })
      .catch(() => !cancelled && setState("error"));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [near, themeTick, height, ...deps]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      if (state === "ready") loadPlotly().then((P) => P.Plots.resize(el));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [state]);

  useEffect(() => {
    const el = ref.current;
    return () => {
      if (el && plotlyPromise) plotlyPromise.then((P) => P.purge(el)).catch(() => {});
    };
  }, []);

  return (
    <div className="relative" style={{ minHeight: height }}>
      <div ref={ref} role="img" aria-label={label} className="w-full" style={{ height }} />
      {state !== "ready" && (
        <div className="absolute inset-0 flex items-center justify-center text-sm text-fg-muted" aria-hidden={state !== "error"}>
          {state === "error" ? "The chart couldn't load. The data table below has the same numbers." : (
            <span className="inline-flex items-center gap-2"><span className="h-3 w-3 animate-spin rounded-full border border-accent border-t-transparent" /> Loading chart…</span>
          )}
        </div>
      )}
    </div>
  );
}
