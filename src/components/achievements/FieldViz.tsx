import { InView } from "@/components/motion/InView";

/** Original competition graphics. Decorative; the facts are stated in text. */
export function TeamField({ total = 320, qualified = 0, shortlisted = 0, place = 6 }: { total?: number; qualified?: number; shortlisted?: number; place?: number }) {
  const cols = 32;
  return (
    <InView as="svg" viewBox={`0 0 ${cols * 12} ${Math.ceil(total / cols) * 12}`} className="team-field h-auto w-full" aria-hidden="true">
      {Array.from({ length: total }, (_, i) => {
        const x = (i % cols) * 12 + 6;
        const y = Math.floor(i / cols) * 12 + 6;
        const isPlace = i === place - 1;
        const short = i < shortlisted;
        const qual = i < qualified;
        const cls = isPlace ? "tf-me" : short ? "tf-dot tf-short" : qual ? "tf-dot tf-qual" : "tf-dot tf-out";
        return (
          <circle
            key={i}
            cx={x}
            cy={y}
            r={isPlace ? 4.6 : short ? 2.8 : 2.2}
            fill={isPlace ? "var(--accent)" : short ? "var(--accent-fg)" : qual ? "var(--accent)" : "var(--line-strong)"}
            opacity={isPlace ? 1 : short ? 0.95 : qual ? 0.45 : 0.5}
            className={cls}
            style={{ ["--d" as string]: `${(i % cols) * 9 + Math.floor(i / cols) * 22}ms` }}
          />
        );
      })}
    </InView>
  );
}

export function Podium({ place = 3 }: { place?: number }) {
  const bars = [
    { p: 2, h: 70, x: 20 },
    { p: 1, h: 100, x: 110 },
    { p: 3, h: 48, x: 200 },
  ];
  return (
    <InView as="svg" viewBox="0 0 290 130" className="podium h-auto w-full" aria-hidden="true">
      {bars.map((b) => {
        const me = b.p === place;
        return (
          <g key={b.p}>
            <rect x={b.x} y={120 - b.h} width="70" height={b.h} rx="6" fill={me ? "var(--accent)" : "transparent"} stroke={me ? "var(--accent)" : "var(--line-strong)"} className={me ? "pd-bar pd-me" : "pd-bar"} style={{ transformOrigin: `${b.x + 35}px 120px`, ["--d" as string]: `${[0, 1, 2][b.p - 1] * 140}ms` }} />
            <text x={b.x + 35} y={120 - b.h + 26} textAnchor="middle" fontSize="18" fontWeight="600" fill={me ? "#fff" : "var(--fg-muted)"}>
              {b.p}
            </text>
          </g>
        );
      })}
      <line x1="0" x2="290" y1="120.5" y2="120.5" stroke="var(--line-strong)" />
    </InView>
  );
}
