/** Small animated illustration per role. Decorative. */
export function RoleArt({ motif }: { motif: "agents" | "pipeline" | "sonar" }) {
  if (motif === "sonar")
    return (
      <svg viewBox="0 0 160 100" className="h-full w-full text-accent" aria-hidden="true">
        {[0, 1, 2].map((i) => (
          <circle key={i} cx="40" cy="50" r="10" fill="none" stroke="currentColor" strokeWidth="1" className="ra-ping" style={{ animationDelay: `${i * 0.9}s` }} />
        ))}
        <path d="M34 50 l10 -5 v10 z" fill="currentColor" />
        <rect x="104" y="30" width="22" height="40" rx="2" fill="none" stroke="currentColor" strokeDasharray="3 3" opacity=".7" />
        <text x="115" y="84" textAnchor="middle" fontSize="8" className="mono" fill="currentColor" opacity=".7">gate</text>
        <path d="M50 50 C70 40 88 44 104 50" stroke="currentColor" strokeDasharray="2 4" fill="none" className="ra-dash" />
      </svg>
    );
  if (motif === "pipeline")
    return (
      <svg viewBox="0 0 160 100" className="h-full w-full text-accent" aria-hidden="true">
        {[["IoT", 14], ["ETL", 62], ["BI", 110]].map(([t, x]) => (
          <g key={t as string}>
            <rect x={x as number} y="36" width="36" height="28" rx="6" fill="none" stroke="currentColor" opacity=".8" />
            <text x={(x as number) + 18} y="54" textAnchor="middle" fontSize="9" className="mono" fill="currentColor">{t}</text>
          </g>
        ))}
        <path d="M50 50 H62 M98 50 H110" stroke="currentColor" />
        {[0, 1].map((i) => (
          <circle key={i} r="2.5" cy="50" fill="currentColor" className="ra-flow" style={{ animationDelay: `${i * 1.2}s` }} />
        ))}
      </svg>
    );
  return (
    <svg viewBox="0 0 160 100" className="h-full w-full text-accent" aria-hidden="true">
      <rect x="62" y="36" width="36" height="28" rx="8" fill="none" stroke="currentColor" />
      <text x="80" y="54" textAnchor="middle" fontSize="8" className="mono" fill="currentColor">MCP</text>
      {[[18, 18], [18, 82], [142, 18], [142, 82]].map(([x, y], i) => (
        <g key={i}>
          <line x1={x} y1={y} x2={x < 80 ? 62 : 98} y2={y < 50 ? 40 : 60} stroke="currentColor" strokeDasharray="2 3" className="ra-dash" opacity=".7" />
          <circle cx={x} cy={y} r="7" fill="none" stroke="currentColor" className="ra-node" style={{ animationDelay: `${i * 0.35}s` }} />
        </g>
      ))}
      <style>{`
        @media (prefers-reduced-motion: no-preference){
          .ra-node{animation:raPulse 2.6s ease-in-out infinite;transform-box:fill-box;transform-origin:center}
          .ra-dash{animation:raDash 1.4s linear infinite}
          .ra-ping{animation:raPing 2.7s ease-out infinite;transform-box:fill-box;transform-origin:center}
          .ra-flow{animation:raFlow 2.4s linear infinite}
        }
        @keyframes raPulse{50%{transform:scale(1.3);opacity:.5}}
        @keyframes raDash{to{stroke-dashoffset:-10}}
        @keyframes raPing{from{transform:scale(.6);opacity:.9}to{transform:scale(5);opacity:0}}
        @keyframes raFlow{from{transform:translateX(50px)}to{transform:translateX(110px)}}
      `}</style>
    </svg>
  );
}
