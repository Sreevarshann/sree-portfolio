/**
 * Static echo of the hero's contour field, placed behind the footer skyline
 * so the page opens and closes on the same water lines. Pure SVG, no JS.
 */
export function ContourEcho({ className = "", id = "echo-fade" }: { className?: string; id?: string }) {
  const lines = Array.from({ length: 9 }, (_, i) => {
    const y = 40 + i * 22;
    const a = 18 + (i % 3) * 7;
    return `M0 ${y} C 180 ${y - a}, 360 ${y + a}, 600 ${y - a / 2} S 980 ${y + a}, 1200 ${y - a / 3}`;
  });
  return (
    <svg viewBox="0 0 1200 260" preserveAspectRatio="none" className={className} aria-hidden="true">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="currentColor" stopOpacity="0" />
          <stop offset="0.6" stopColor="currentColor" stopOpacity="1" />
          <stop offset="1" stopColor="currentColor" stopOpacity="0.4" />
        </linearGradient>
      </defs>
      {lines.map((d, i) => (
        <path key={i} d={d} fill="none" stroke={`url(#${id})`} strokeWidth={i % 4 === 0 ? 1.1 : 0.7} className="echo-line" style={{ animationDelay: `${i * -2.2}s` }} />
      ))}
      {/* A single harbor light drifting along one water line, echoing the hero's field. */}
      <path d={lines[4]} pathLength={1000} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" className="echo-light" />
      <style>{`
        .echo-line{opacity:.55}
        @media (prefers-reduced-motion: no-preference){.echo-line{animation:echoDrift 18s ease-in-out infinite alternate}}
        @keyframes echoDrift{to{transform:translateX(-40px)}}
        .echo-light{stroke-dasharray:60 1000;stroke-dashoffset:60;opacity:0}
        @media (prefers-reduced-motion: no-preference){.echo-light{opacity:.9;animation:echoLight 14s cubic-bezier(.65,0,.35,1) infinite;filter:drop-shadow(0 0 4px currentColor)}}
        @keyframes echoLight{to{stroke-dashoffset:-1000}}
      `}</style>
    </svg>
  );
}
