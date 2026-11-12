import type { Project } from "@/content/projects";

const W = 168;
const H = 60;
const GX = 92;
const GY = 46;

const kindStyle: Record<string, { stroke: string; dash?: string; label: string }> = {
  client: { stroke: "var(--silver)", label: "client" },
  service: { stroke: "var(--accent)", label: "service" },
  store: { stroke: "var(--accent-fg)", dash: "0", label: "store" },
  model: { stroke: "var(--accent)", dash: "4 3", label: "model" },
  queue: { stroke: "var(--fg-muted)", dash: "2 3", label: "queue" },
};

/** Truthful architecture diagram generated from the project's documented components. */
export function ArchitectureDiagram({ arch, name }: { arch: Project["architecture"]; name: string }) {
  const width = arch.cols * W + (arch.cols - 1) * GX + 40;
  const height = arch.rows * H + (arch.rows - 1) * GY + 40;
  const pos = new Map(arch.nodes.map((n) => [n.id, { x: 20 + n.col * (W + GX), y: 20 + n.row * (H + GY), n }]));

  const path = (a: string, b: string) => {
    const A = pos.get(a)!;
    const B = pos.get(b)!;
    const ax = A.x + W / 2, ay = A.y + H / 2, bx = B.x + W / 2, by = B.y + H / 2;
    if (A.n.col === B.n.col) {
      const down = by > ay;
      const y1 = down ? A.y + H : A.y, y2 = down ? B.y : B.y + H;
      return { d: `M${ax} ${y1} C${ax} ${(y1 + y2) / 2} ${bx} ${(y1 + y2) / 2} ${bx} ${y2}`, mx: ax + 6, my: (y1 + y2) / 2 };
    }
    const right = bx > ax;
    const x1 = right ? A.x + W : A.x, x2 = right ? B.x : B.x + W;
    const mid = (x1 + x2) / 2;
    return { d: `M${x1} ${ay} C${mid} ${ay} ${mid} ${by} ${x2} ${by}`, mx: mid, my: (ay + by) / 2 - 6 };
  };

  return (
    <figure className="panel overflow-hidden">
      <div className="thin-scroll overflow-x-auto" tabIndex={0} role="region" aria-label={`${name} architecture diagram (scrollable)`}>
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="arch block h-auto w-full min-w-[640px]"
          role="img"
          aria-label={`${name} architecture: ${arch.nodes.map((n) => n.label).join(", ")}`}
        >
          <defs>
            <marker id={`arrow-${name.replace(/\W/g, "")}`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M0 0 L10 5 L0 10 z" fill="var(--fg-muted)" />
            </marker>
          </defs>
          {arch.edges.map(([a, b, label], i) => {
            const p = path(a, b);
            return (
              <g key={i}>
                <path d={p.d} fill="none" stroke="var(--line-strong)" strokeWidth="1.2" markerEnd={`url(#arrow-${name.replace(/\W/g, "")})`} />
                <path d={p.d} fill="none" stroke="var(--accent)" strokeWidth="1.4" strokeDasharray="3 14" className="arch-flow" style={{ animationDelay: `${i * 0.25}s` }} />
                {label && (
                  <g>
                    <rect x={p.mx - label.length * 3.3 - 5} y={p.my - 10} width={label.length * 6.6 + 10} height="15" rx="4" fill="var(--bg-elev)" />
                    <text x={p.mx} y={p.my + 1} textAnchor="middle" className="mono" fontSize="10.5" fill="var(--fg-muted)">
                      {label}
                    </text>
                  </g>
                )}
              </g>
            );
          })}
          {arch.nodes.map((n) => {
            const p = pos.get(n.id)!;
            const k = kindStyle[n.kind ?? "service"];
            return (
              <g key={n.id}>
                <rect x={p.x} y={p.y} width={W} height={H} rx="12" fill="var(--bg-elev)" stroke={k.stroke} strokeOpacity="0.7" strokeDasharray={k.dash} />
                <text x={p.x + 14} y={p.y + 25} fontSize="14" fontWeight="600" fill="var(--fg)">
                  {n.label}
                </text>
                {n.sub && (
                  <text x={p.x + 14} y={p.y + 43} fontSize="11" className="mono" fill="var(--fg-muted)">
                    {n.sub}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>
      <figcaption className="flex flex-col gap-3 border-t border-line px-5 py-4 text-sm text-fg-muted md:flex-row md:items-center md:justify-between">
        <span>{arch.caption}</span>
        <span className="mono flex shrink-0 flex-wrap gap-3 text-[0.68rem]">
          {Object.entries(kindStyle).map(([key, v]) => (
            <span key={key} className="inline-flex items-center gap-1.5">
              <svg width="14" height="10" aria-hidden="true"><rect x="1" y="1" width="12" height="8" rx="2" fill="none" stroke={v.stroke} strokeDasharray={v.dash} /></svg>
              {v.label}
            </span>
          ))}
        </span>
      </figcaption>
      <style>{`@media (prefers-reduced-motion: no-preference){.arch-flow{animation:archFlow 1.8s linear infinite}}@keyframes archFlow{to{stroke-dashoffset:-34}}`}</style>
    </figure>
  );
}
