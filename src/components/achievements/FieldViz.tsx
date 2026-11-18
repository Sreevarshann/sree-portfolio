import { InView } from "@/components/motion/InView";

/** Original competition graphics. Decorative; the facts are stated in text. */
export function TeamField({ total = 320, qualified = 0, shortlisted = 0, place = 6, cols = 32 }: { total?: number; qualified?: number; shortlisted?: number; place?: number; cols?: number }) {
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

/**
 * Google MLOps Expo, 3rd place: a small model pipeline (data, features,
 * training, serving) whose paths converge on a recognition emblem that names
 * the event and the placing. No podium and no empty first or second places.
 * The static markup is the final state; motion plays once when it scrolls in.
 */
const SOURCES = [
  { x: 10, y: 22 },
  { x: 10, y: 65 },
  { x: 10, y: 108 },
];
const HUBS = [
  { x: 62, y: 42 },
  { x: 62, y: 88 },
];
const BADGE = { x: 170, y: 65, r: 56 };
const FLOWS = [
  "M10 22 C 36 22, 38 42, 62 42",
  "M10 65 C 36 65, 38 42, 62 42",
  "M10 65 C 36 65, 38 88, 62 88",
  "M10 108 C 36 108, 38 88, 62 88",
  `M62 42 C 92 42, 100 ${BADGE.y - 12}, ${BADGE.x - BADGE.r} ${BADGE.y - 8}`,
  `M62 88 C 92 88, 100 ${BADGE.y + 12}, ${BADGE.x - BADGE.r} ${BADGE.y + 8}`,
];

export function RecognitionEmblem({ event = "Google MLOps Expo", place = 3, suffix = "rd" }: { event?: string; place?: number; suffix?: string }) {
  const ticks = 36;
  const ring = BADGE.r - 9;
  return (
    <InView as="svg" viewBox="0 0 230 130" className="emblem h-auto w-full" aria-hidden="true">
      <defs>
        <path id="emblem-arc" d={`M ${BADGE.x - ring} ${BADGE.y} A ${ring} ${ring} 0 0 1 ${BADGE.x + ring} ${BADGE.y}`} />
        <radialGradient id="emblem-core" cx="50%" cy="40%" r="65%">
          <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.32" />
          <stop offset="100%" stopColor="var(--accent)" stopOpacity="0.08" />
        </radialGradient>
      </defs>
      {FLOWS.map((d, i) => (
        <g key={i}>
          <path d={d} pathLength={1} className="em-path" fill="none" stroke="var(--line-strong)" strokeWidth="1.2" style={{ ["--d" as string]: `${(i < 4 ? i : 4 + (i - 4)) * 110}ms` }} />
          <path d={d} pathLength={1} className="em-flow" fill="none" stroke="var(--accent)" strokeWidth="1.6" strokeLinecap="round" style={{ ["--d" as string]: `${700 + i * 90}ms` }} />
        </g>
      ))}
      {SOURCES.map((n, i) => (
        <circle key={`s${i}`} cx={n.x} cy={n.y} r="4" className="em-node" fill="var(--bg)" stroke="var(--accent)" strokeWidth="1.4" style={{ ["--d" as string]: `${i * 90}ms` }} />
      ))}
      {HUBS.map((n, i) => (
        <g key={`h${i}`} className="em-node" style={{ ["--d" as string]: `${360 + i * 90}ms` }}>
          <rect x={n.x - 7} y={n.y - 7} width="14" height="14" rx="4" fill="var(--bg)" stroke="var(--accent)" strokeWidth="1.4" />
          <circle cx={n.x} cy={n.y} r="2.2" fill="var(--accent)" />
        </g>
      ))}
      <g className="em-badge">
        <circle cx={BADGE.x} cy={BADGE.y} r={BADGE.r} fill="url(#emblem-core)" stroke="var(--accent)" strokeWidth="1.5" className="em-ring" pathLength={1} />
        <g className="em-ticks">
          {Array.from({ length: ticks }, (_, i) => {
            const a = (i / ticks) * Math.PI * 2;
            // Leave the upper arc clear for the event name.
            if (Math.sin(a) < -0.2) return null;
            const r1 = BADGE.r - 4;
            const r2 = BADGE.r - (i % 3 === 0 ? 9 : 6.5);
            return <line key={i} x1={BADGE.x + Math.cos(a) * r1} y1={BADGE.y + Math.sin(a) * r1} x2={BADGE.x + Math.cos(a) * r2} y2={BADGE.y + Math.sin(a) * r2} stroke="var(--accent)" strokeOpacity="0.55" strokeWidth="1" />;
          })}
        </g>
        <text className="em-arc" fontSize="8.4" fontWeight="600" letterSpacing="1.2" fill="var(--fg-soft)">
          <textPath href="#emblem-arc" startOffset="50%" textAnchor="middle">
            {event.toUpperCase()}
          </textPath>
        </text>
        <text className="em-rank" x={BADGE.x} y={BADGE.y + 10} textAnchor="middle" fontSize="34" fontWeight="600" letterSpacing="-1.2" fill="var(--fg)">
          {place}
          <tspan fontSize="14" dy="-14" fill="var(--accent-fg)">{suffix}</tspan>
        </text>
        <text className="em-rank" x={BADGE.x} y={BADGE.y + 29} textAnchor="middle" fontSize="8.4" fontWeight="600" letterSpacing="2.6" fill="var(--accent-fg)">
          PLACE
        </text>
      </g>
    </InView>
  );
}
