import Link from "next/link";
import { tunelab, aegis } from "@/content/lab";

/** Lightweight SVG preview (no Plotly on the home page). */
export function LabTeaser() {
  const runs = tunelab.runs;
  const max = 100;
  return (
    <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
      <Link href="/lab#tunelab" className="panel group block p-6 transition-colors hover:border-accent md:p-8" data-reveal>
        <p className="eyebrow">TuneLab · held-out accuracy</p>
        <p className="mt-3 text-xl font-medium tracking-[-0.02em]">Did fine-tuning generalize?</p>
        <svg viewBox="0 0 400 180" className="mt-6 h-auto w-full" role="img" aria-label={`Held-out exact match: ${runs.map((r) => `${r.label} ${r.heldout}%`).join(", ")}`}>
          {[0, 25, 50, 75, 100].map((t) => (
            <g key={t}>
              <line x1="40" x2="396" y1={160 - (t / max) * 140} y2={160 - (t / max) * 140} stroke="var(--line)" />
              <text x="32" y={164 - (t / max) * 140} textAnchor="end" fontSize="10" fill="var(--fg-muted)" className="mono">{t}</text>
            </g>
          ))}
          {runs.map((r, i) => {
            const x = 60 + i * 86;
            const h1 = (r.test / max) * 140;
            const h2 = (r.heldout / max) * 140;
            return (
              <g key={r.id}>
                <rect x={x} y={160 - h1} width="26" height={h1} rx="3" fill="var(--line-strong)" />
                <rect x={x + 30} y={160 - h2} width="26" height={h2} rx="3" fill="var(--accent)" className="origin-bottom transition-transform duration-700 group-hover:scale-y-105" style={{ transformBox: "fill-box" }} />
                <text x={x + 28} y="176" textAnchor="middle" fontSize="9.5" fill="var(--fg-muted)" className="mono">{r.id}</text>
              </g>
            );
          })}
        </svg>
        <p className="mt-4 flex items-center gap-4 text-xs text-fg-muted">
          <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-line-strong" />Test split</span>
          <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-accent" />Held-out phrasings</span>
          <span className="ml-auto text-accent-fg transition-transform group-hover:translate-x-1">Explore →</span>
        </p>
      </Link>
      <Link href="/lab#aegis" className="panel group flex flex-col justify-between p-6 transition-colors hover:border-accent md:p-8" data-reveal>
        <div>
          <p className="eyebrow">AEGIS · fraud model</p>
          <p className="mt-3 text-xl font-medium tracking-[-0.02em]">Precision vs. recall on 2.18% fraud</p>
        </div>
        <dl className="mt-8 grid grid-cols-2 gap-6">
          {aegis.models.map((m) => (
            <div key={m.model}>
              <dt className="text-xs text-fg-muted">{m.model}</dt>
              <dd className="mt-2 text-4xl font-medium tracking-[-0.04em]">{m.f1.toFixed(3)}</dd>
              <dd className="text-xs text-fg-muted">F1 · PR-AUC {m.prAuc.toFixed(3)}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-8 text-xs text-fg-muted">
          Synthetic data · numbers from the repository README <span className="float-right text-accent-fg transition-transform group-hover:translate-x-1">Explore →</span>
        </p>
      </Link>
    </div>
  );
}
