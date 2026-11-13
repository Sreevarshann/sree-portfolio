"use client";

import { useState } from "react";
import type { Data } from "plotly.js-dist-min";
import { PlotlyFigure } from "./PlotlyFigure";
import { LabCard, Segmented } from "./LabShell";
import { aegis, sourceatlas, tunelab, workmesh } from "@/content/lab";

const pct = (v: number) => `${v.toFixed(1)}%`;
const BAR_END = { cornerradius: 4 } as const;

/* ---------------------------------------------------------------- TuneLab */
export function TuneLabExperience() {
  const [mode, setMode] = useState<"split" | "priority" | "time">("split");
  const [hideBase, setHideBase] = useState(false);
  const runs = tunelab.runs.filter((r) => !(hideBase && r.id === "base"));
  const x = runs.map((r) => r.label);

  return (
    <LabCard
      id="tunelab"
      index="L.1"
      project={{ name: "TuneLab", href: "/projects/tunelab" }}
      title="Did fine-tuning actually generalize?"
      question="Every LoRA run is scored against the frozen base model on the same prompts. The gap between the test split and the held-out phrasings shows how much was memorized versus learned."
      controls={
        <>
          <Segmented
            label="Metric"
            value={mode}
            onChange={setMode}
            options={[
              { value: "split", label: "Exact match: test vs held-out" },
              { value: "priority", label: "Held-out priority field" },
              { value: "time", label: "Training minutes" },
            ]}
          />
          <label className="ml-auto inline-flex cursor-pointer items-center gap-2 text-sm text-fg-soft">
            <input type="checkbox" className="accent-[var(--accent)]" checked={hideBase} onChange={(e) => setHideBase(e.target.checked)} />
            Hide base model
          </label>
        </>
      }
      chart={
        <PlotlyFigure
          label={`TuneLab ${mode} comparison across ${runs.length} runs`}
          deps={[mode, hideBase]}
          build={(t) => {
            let data: Data[];
            if (mode === "split") {
              data = [
                { type: "bar", name: "Test split", x, y: runs.map((r) => r.test), marker: { color: t.s1, ...BAR_END }, text: runs.map((r) => pct(r.test)), textposition: "outside", textfont: { color: t.text, size: 11 }, hovertemplate: "%{x}<br>Test split: %{y:.1f}%<extra></extra>" },
                { type: "bar", name: "Held-out phrasings", x, y: runs.map((r) => r.heldout), marker: { color: t.s2, ...BAR_END }, text: runs.map((r) => pct(r.heldout)), textposition: "outside", textfont: { color: t.text, size: 11 }, hovertemplate: "%{x}<br>Held-out: %{y:.1f}%<extra></extra>" },
              ];
              return { data, layout: { barmode: "group", yaxis: { ...{ range: [0, 112], ticksuffix: "%" }, title: { text: "All 5 fields correct", font: { size: 12, color: t.muted } } } } };
            }
            if (mode === "priority") {
              data = [{ type: "bar", name: "Priority accuracy", x, y: runs.map((r) => r.priority), marker: { color: t.s1, ...BAR_END }, text: runs.map((r) => pct(r.priority)), textposition: "outside", textfont: { color: t.text, size: 11 }, hovertemplate: "%{x}<br>Priority accuracy (held-out): %{y:.1f}%<extra></extra>" }];
              return { data, layout: { showlegend: false, yaxis: { range: [0, 100], ticksuffix: "%", title: { text: "Held-out priority accuracy", font: { size: 12, color: t.muted } } } } };
            }
            const timed = runs.filter((r) => r.minutes != null);
            data = [{ type: "bar", name: "Minutes", x: timed.map((r) => r.label), y: timed.map((r) => r.minutes as number), marker: { color: t.s1, ...BAR_END }, text: timed.map((r) => `${r.minutes} min`), textposition: "outside", textfont: { color: t.text, size: 11 }, hovertemplate: "%{x}<br>%{y} minutes on an M4<extra></extra>" }];
            return { data, layout: { showlegend: false, yaxis: { range: [0, 12], title: { text: "Minutes (Apple M4)", font: { size: 12, color: t.muted } } } } };
          }}
        />
      }
      table={{
        head: ["Run", "Test exact match", "Held-out exact match", "Held-out priority", "Train minutes", "Trainable params (M)"],
        rows: tunelab.runs.map((r) => [r.label, pct(r.test), pct(r.heldout), pct(r.priority), r.minutes ?? "-", r.params || "-"]),
      }}
      note={tunelab.note}
      source={tunelab.source}
    />
  );
}

/* ---------------------------------------------------------------- AEGIS */
export function AegisExperience() {
  const [mode, setMode] = useState<"scenarios" | "models" | "confusion">("scenarios");
  const [kind, setKind] = useState<"all" | "fraud" | "legit">("all");
  const [log, setLog] = useState(false);
  const sc = aegis.scenarios.filter((s) => kind === "all" || s.kind === kind);

  return (
    <LabCard
      id="aegis"
      index="L.2"
      project={{ name: "AEGIS AI", href: "/projects/aegis-ai" }}
      title="Catching fraud without flooding analysts"
      question="A good fraud model alerts on almost every attack pattern while staying quiet on legitimate edge cases like travel or new devices. Compare alert rates by scenario, the two candidate models and the final confusion matrix."
      controls={
        <>
          <Segmented
            label="View"
            value={mode}
            onChange={setMode}
            options={[
              { value: "scenarios", label: "Alert rate by scenario" },
              { value: "models", label: "Model comparison" },
              { value: "confusion", label: "Confusion matrix" },
            ]}
          />
          {mode === "scenarios" && (
            <>
              <Segmented
                label="Scenario type"
                value={kind}
                onChange={setKind}
                options={[
                  { value: "all", label: "All" },
                  { value: "fraud", label: "Fraud" },
                  { value: "legit", label: "Legitimate" },
                ]}
              />
              <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-fg-soft">
                <input type="checkbox" className="accent-[var(--accent)]" checked={log} onChange={(e) => setLog(e.target.checked)} />
                Log scale
              </label>
            </>
          )}
        </>
      }
      chart={
        <PlotlyFigure
          label={`AEGIS ${mode}`}
          deps={[mode, kind, log]}
          height={mode === "scenarios" ? 420 : 380}
          build={(t) => {
            if (mode === "scenarios") {
              const sorted = [...sc].sort((a, b) => a.rate - b.rate);
              const series = (k: "fraud" | "legit", name: string, color: string): Data => {
                const s = sorted.filter((d) => d.kind === k);
                return { type: "bar", orientation: "h", name, y: s.map((d) => d.name), x: s.map((d) => d.rate), marker: { color, ...BAR_END }, text: s.map((d) => `${d.rate}%`), textposition: "outside", textfont: { color: t.text, size: 11 }, hovertemplate: "%{y}<br>Alerted: %{x}%<extra></extra>" };
              };
              const data: Data[] = [];
              if (kind !== "legit") data.push(series("fraud", "Fraud scenario", t.s2));
              if (kind !== "fraud") data.push(series("legit", "Legitimate traffic", t.s1));
              return {
                data,
                layout: {
                  barmode: "overlay",
                  margin: { l: 150, r: 40, t: 16, b: 40 },
                  xaxis: { type: log ? "log" : "linear", range: log ? [-0.7, 2.15] : [0, 112], ticksuffix: "%", title: { text: "Share of transactions alerted", font: { size: 12, color: t.muted } } },
                  yaxis: { categoryorder: "array", categoryarray: sorted.map((d) => d.name), tickfont: { color: t.text, size: 12, family: t.font } },
                },
              };
            }
            if (mode === "models") {
              const metrics = ["precision", "recall", "f1", "prAuc", "rocAuc"] as const;
              const labels = ["Precision", "Recall", "F1", "PR-AUC", "ROC-AUC"];
              const colors = [t.s1, t.s2];
              return {
                data: aegis.models.map((m, i) => ({
                  type: "bar",
                  name: m.model,
                  x: labels,
                  y: metrics.map((k) => m[k]),
                  marker: { color: colors[i], ...BAR_END },
                  text: metrics.map((k) => m[k].toFixed(3)),
                  textposition: "outside",
                  textfont: { color: t.text, size: 10 },
                  hovertemplate: `${m.model}<br>%{x}: %{y:.3f}<extra></extra>`,
                })) as Data[],
                layout: { barmode: "group", yaxis: { range: [0, 1.1], title: { text: "Score (0-1)", font: { size: 12, color: t.muted } } } },
              };
            }
            const c = aegis.confusion;
            const z = [[c.fn, c.tp], [c.tn, c.fp]];
            const text = [[`FN ${c.fn}`, `TP ${c.tp}`], [`TN ${c.tn.toLocaleString()}`, `FP ${c.fp}`]];
            return {
              data: [
                {
                  type: "heatmap",
                  z: z.map((r) => r.map((v) => Math.log10(v))),
                  x: ["Predicted legit", "Predicted fraud"],
                  y: ["Actual fraud", "Actual legit"],
                  text: text as unknown as string[],
                  texttemplate: "%{text}",
                  textfont: { size: 15, color: t.text },
                  customdata: z as unknown as number[],
                  hovertemplate: "%{y} · %{x}<br>%{customdata:,} transactions<extra></extra>",
                  colorscale: t.seq.map((col, i) => [i / (t.seq.length - 1), col]) as [number, string][],
                  showscale: false,
                  xgap: 3,
                  ygap: 3,
                } as Data,
              ],
              layout: { margin: { l: 110, r: 20, t: 16, b: 48 }, xaxis: { side: "bottom", tickfont: { color: t.text, size: 12, family: t.font } }, yaxis: { tickfont: { color: t.text, size: 12, family: t.font } } },
            };
          }}
        />
      }
      table={{
        head: ["Scenario", "Type", "Alert rate"],
        rows: [
          ...aegis.scenarios.map((s) => [s.name, s.kind === "fraud" ? "Fraud" : "Legitimate", `${s.rate}%`]),
          ...aegis.models.map((m) => [m.model, "Model", `P ${m.precision} · R ${m.recall} · F1 ${m.f1} · PR-AUC ${m.prAuc} · ROC-AUC ${m.rocAuc}`]),
          ["Confusion matrix", "HGB @ 0.432", `TN ${aegis.confusion.tn} · FP ${aegis.confusion.fp} · FN ${aegis.confusion.fn} · TP ${aegis.confusion.tp}`],
        ],
      }}
      note={aegis.note}
      source={aegis.source}
    />
  );
}

/* ---------------------------------------------------------------- WorkMesh */
export function WorkMeshExperience() {
  const [sort, setSort] = useState<"p99" | "p50" | "rps">("p99");
  const eps = [...workmesh.endpoints].sort((a, b) => (sort === "rps" ? a.rps - b.rps : a[sort] - b[sort]));
  const names = eps.map((e) => e.name);

  return (
    <LabCard
      id="workmesh"
      index="L.3"
      project={{ name: "WorkMesh", href: "/projects/workmesh" }}
      title="Where does permission-aware latency go?"
      question="Every WorkMesh read applies authorization in SQL under row-level security. This benchmark shows the spread from median to tail latency per endpoint. The dashboards that aggregate across teams have the longest tails."
      controls={
        <Segmented
          label="Sort endpoints by"
          value={sort}
          onChange={setSort}
          options={[
            { value: "p99", label: "Sort by p99" },
            { value: "p50", label: "Sort by p50" },
            { value: "rps", label: "Sort by throughput" },
          ]}
        />
      }
      chart={
        <PlotlyFigure
          label="WorkMesh endpoint latency percentiles"
          deps={[sort]}
          height={440}
          build={(t) => {
            const range: Data = {
              type: "scatter",
              mode: "lines",
              showlegend: false,
              hoverinfo: "skip",
              x: eps.flatMap((e) => [e.p50, e.p99, null]),
              y: eps.flatMap((e) => [e.name, e.name, null]),
              line: { color: t.axis, width: 2 },
            };
            const dot = (key: "p50" | "p95" | "p99", name: string, color: string): Data => ({
              type: "scatter",
              mode: "markers",
              name,
              x: eps.map((e) => e[key]),
              y: names,
              marker: { color, size: 11, line: { color: t.surface, width: 2 } },
              customdata: eps.map((e) => e.rps),
              hovertemplate: `%{y}<br>${name}: %{x} ms<br>%{customdata} req/s<extra></extra>`,
            });
            return {
              data: [range, dot("p50", "p50", t.s1), dot("p95", "p95", t.s3), dot("p99", "p99", t.s2)],
              layout: {
                margin: { l: 150, r: 24, t: 16, b: 48 },
                xaxis: { title: { text: "Latency (ms)", font: { size: 12, color: t.muted } }, rangemode: "tozero" },
                yaxis: { categoryorder: "array", categoryarray: names, tickfont: { color: t.text, size: 12, family: t.font } },
              },
            };
          }}
        />
      }
      table={{ head: ["Endpoint", "p50 (ms)", "p95 (ms)", "p99 (ms)", "req/s"], rows: workmesh.endpoints.map((e) => [e.name, e.p50, e.p95, e.p99, e.rps]) }}
      note={workmesh.note}
      source={workmesh.source}
    />
  );
}

/* ---------------------------------------------------------------- SourceAtlas */
export function SourceAtlasExperience() {
  const [mode, setMode] = useState<"compare" | "progress">("compare");
  return (
    <LabCard
      id="sourceatlas"
      index="L.4"
      project={{ name: "SourceAtlas", href: "/projects/sourceatlas" }}
      title="Does verified RAG hold up with a real model?"
      question="SourceAtlas is evaluated twice: with deterministic fixtures and with a live local model. Live answer correctness climbed across three evaluation runs as the pipeline was fixed."
      controls={
        <Segmented
          label="View"
          value={mode}
          onChange={setMode}
          options={[
            { value: "compare", label: "Live vs fixture" },
            { value: "progress", label: "Answer correctness across runs" },
          ]}
        />
      }
      chart={
        <PlotlyFigure
          label={`SourceAtlas ${mode}`}
          deps={[mode]}
          build={(t) => {
            if (mode === "compare") {
              const m = sourceatlas.metrics;
              return {
                data: [
                  { type: "bar", name: "Live (qwen3:4b)", x: m.map((d) => d.metric), y: m.map((d) => d.live), marker: { color: t.s1, ...BAR_END }, text: m.map((d) => pct(d.live)), textposition: "outside", textfont: { color: t.text, size: 10 }, hovertemplate: "%{x}<br>Live: %{y:.1f}%<extra></extra>" },
                  { type: "bar", name: "Fixture", x: m.map((d) => d.metric), y: m.map((d) => d.fixture), marker: { color: t.s2, ...BAR_END }, text: m.map((d) => pct(d.fixture)), textposition: "outside", textfont: { color: t.text, size: 10 }, hovertemplate: "%{x}<br>Fixture: %{y:.1f}%<extra></extra>" },
                ] as Data[],
                layout: { barmode: "group", yaxis: { range: [0, 112], ticksuffix: "%" } },
              };
            }
            const p = sourceatlas.progression;
            return {
              data: [
                {
                  type: "scatter",
                  mode: "text+lines+markers",
                  name: "Answer correctness (live)",
                  x: p.map((d) => d.run),
                  y: p.map((d) => d.answer),
                  line: { color: t.s1, width: 2 },
                  marker: { color: t.s1, size: 10, line: { color: t.surface, width: 2 } },
                  text: p.map((d) => pct(d.answer)),
                  textposition: "top center",
                  textfont: { color: t.text, size: 12 },
                  hovertemplate: "%{x}<br>Answer correct: %{y:.1f}%<extra></extra>",
                } as Data,
              ],
              layout: { showlegend: false, yaxis: { range: [0, 105], ticksuffix: "%", title: { text: "Answer correct (live)", font: { size: 12, color: t.muted } } }, xaxis: { tickfont: { color: t.text, size: 12, family: t.font } } },
            };
          }}
        />
      }
      table={{
        head: ["Metric", "Live", "Fixture"],
        rows: [
          ...sourceatlas.metrics.map((d) => [d.metric, pct(d.live), pct(d.fixture)]),
          ...sourceatlas.progression.map((d) => [`${d.run}: answer correct`, pct(d.answer), "-"]),
        ],
      }}
      note={sourceatlas.note}
      source={sourceatlas.source}
    />
  );
}
