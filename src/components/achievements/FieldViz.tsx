/** Original competition graphics. Decorative; the facts are stated in text. */
export function TeamField({ total = 320, place = 6 }: { total?: number; place?: number }) {
  const cols = 32;
  return (
    <svg viewBox={`0 0 ${cols * 12} ${Math.ceil(total / cols) * 12}`} className="h-auto w-full" aria-hidden="true">
      {Array.from({ length: total }, (_, i) => {
        const x = (i % cols) * 12 + 6;
        const y = Math.floor(i / cols) * 12 + 6;
        const isPlace = i === place - 1;
        const ahead = i < place - 1;
        return (
          <circle
            key={i}
            cx={x}
            cy={y}
            r={isPlace ? 4.6 : 2.2}
            fill={isPlace ? "var(--accent)" : ahead ? "var(--accent-fg)" : "var(--line-strong)"}
            opacity={isPlace ? 1 : ahead ? 0.7 : 0.9}
            className={isPlace ? "tf-me" : "tf-dot"}
            style={{ animationDelay: `${(i % cols) * 12 + Math.floor(i / cols) * 30}ms` }}
          />
        );
      })}
      <style>{`
        @media (prefers-reduced-motion: no-preference){
          .tf-dot{animation:tfIn .6s ease-out both}
          .tf-me{animation:tfPulse 2.2s ease-in-out infinite;transform-box:fill-box;transform-origin:center}
        }
        @keyframes tfIn{from{opacity:0}}
        @keyframes tfPulse{50%{transform:scale(1.5)}}
      `}</style>
    </svg>
  );
}

export function Podium({ place = 3 }: { place?: number }) {
  const bars = [
    { p: 2, h: 70, x: 20 },
    { p: 1, h: 100, x: 110 },
    { p: 3, h: 48, x: 200 },
  ];
  return (
    <svg viewBox="0 0 290 130" className="h-auto w-full" aria-hidden="true">
      {bars.map((b) => {
        const me = b.p === place;
        return (
          <g key={b.p}>
            <rect x={b.x} y={120 - b.h} width="70" height={b.h} rx="6" fill={me ? "var(--accent)" : "transparent"} stroke={me ? "var(--accent)" : "var(--line-strong)"} className="pd-bar" style={{ transformOrigin: `${b.x + 35}px 120px` }} />
            <text x={b.x + 35} y={120 - b.h + 26} textAnchor="middle" fontSize="18" fontWeight="600" fill={me ? "#fff" : "var(--fg-muted)"}>
              {b.p}
            </text>
          </g>
        );
      })}
      <line x1="0" x2="290" y1="120.5" y2="120.5" stroke="var(--line-strong)" />
      <style>{`@media (prefers-reduced-motion: no-preference){.pd-bar{animation:pdUp 1.1s cubic-bezier(.22,1,.36,1) both}}@keyframes pdUp{from{transform:scaleY(0)}}`}</style>
    </svg>
  );
}
