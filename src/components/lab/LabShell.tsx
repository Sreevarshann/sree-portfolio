"use client";

import type { ReactNode } from "react";

export function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex flex-wrap gap-1 rounded-full border border-line p-1">
      {options.map((o) => {
        const on = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onChange(o.value)}
            onKeyDown={(e) => {
              const i = options.findIndex((x) => x.value === value);
              if (e.key === "ArrowRight" || e.key === "ArrowDown") {
                e.preventDefault();
                onChange(options[(i + 1) % options.length].value);
              } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
                e.preventDefault();
                onChange(options[(i - 1 + options.length) % options.length].value);
              }
            }}
            tabIndex={on ? 0 : -1}
            className={`rounded-full px-3.5 py-1.5 text-[0.82rem] transition-colors ${on ? "bg-fg text-bg" : "text-fg-soft hover:text-fg"}`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

export function LabCard({
  id,
  index,
  project,
  title,
  question,
  controls,
  chart,
  table,
  note,
  source,
}: {
  id: string;
  index: string;
  project: { name: string; href: string };
  title: string;
  question: string;
  controls: ReactNode;
  chart: ReactNode;
  table: { head: string[]; rows: (string | number)[][] };
  note: string;
  source: { label: string; href: string };
}) {
  return (
    <section id={id} className="scroll-mt-28 border-t border-line py-16 md:py-24" aria-labelledby={`${id}-title`}>
      <div className="grid gap-8 lg:grid-cols-[0.8fr_1.6fr] lg:gap-14">
        <div data-reveal>
          <p className="eyebrow"><span className="text-accent">{index}</span> · <a href={project.href} className="link-u hover:text-fg">{project.name}</a></p>
          <h2 id={`${id}-title`} className="mt-4 text-[clamp(1.8rem,3.4vw,2.6rem)] font-medium leading-tight tracking-[-0.035em]">{title}</h2>
          <p className="mt-4 leading-relaxed text-fg-soft">{question}</p>
          <p className="mt-6 rounded-xl border border-line px-4 py-3 text-xs leading-relaxed text-fg-muted">
            <span className="font-medium text-fg-soft">Data provenance.</span> {note} Source:{" "}
            <a href={source.href} target="_blank" rel="noopener noreferrer" className="link-u text-accent-fg">{source.label} ↗</a>
          </p>
        </div>
        <div className="panel min-w-0 p-4 md:p-6" data-reveal>
          <div className="mb-4 flex flex-wrap items-center gap-2">{controls}</div>
          {chart}
          <details className="group mt-4 border-t border-line pt-3">
            <summary className="cursor-pointer list-none text-sm text-fg-soft hover:text-fg">
              <span className="inline-block transition-transform group-open:rotate-90" aria-hidden="true">›</span> View data table
            </summary>
            <div className="thin-scroll mt-3 overflow-x-auto">
              <table className="data-table">
                <caption className="sr-only">{title}</caption>
                <thead>
                  <tr>{table.head.map((h) => <th key={h} scope="col">{h}</th>)}</tr>
                </thead>
                <tbody>
                  {table.rows.map((r, i) => (
                    <tr key={i}>
                      {r.map((c, j) => (j === 0 ? <th key={j} scope="row" className="!normal-case !tracking-normal !text-[0.85rem] !font-normal !text-fg">{c}</th> : <td key={j}>{c}</td>))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        </div>
      </div>
    </section>
  );
}
