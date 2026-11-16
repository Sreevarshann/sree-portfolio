/**
 * Dark theme only: Boston at night behind the footer skyline. A crescent moon
 * high over the Zakim approach and a handful of stars, placed by hand in the
 * gaps between the drawn towers. Positions use the skyline's own coordinate
 * space (viewBox 0 0 1200 220, water line at y 196), so nothing touches a
 * building at any width. Pure markup + CSS: no script, no blur filters; the
 * twinkle is an opacity animation paused off screen ([data-anim-pause]).
 */

// [x, y, size px, brightness, twinkle duration s (0 = steady), delay s]
const STARS: [number, number, number, number, number, number][] = [
  [62, 38, 1.6, 0.7, 0, 0],
  [148, 90, 1.3, 0.5, 6.5, 1.2],
  [205, 22, 2.1, 0.9, 0, 0],
  [272, 66, 1.4, 0.55, 0, 0],
  [366, 30, 1.8, 0.8, 7.5, 3.4],
  [418, 60, 1.2, 0.45, 0, 0],
  [478, 36, 1.5, 0.65, 0, 0],
  [582, 52, 2.3, 0.95, 8.5, 0.6],
  [652, 18, 1.4, 0.6, 0, 0],
  [754, 44, 1.6, 0.7, 5.5, 2.2],
  [934, 66, 1.2, 0.5, 0, 0],
  [1012, 28, 1.9, 0.85, 0, 0],
  [1064, 60, 1.3, 0.5, 7, 4.6],
  [1166, 24, 1.6, 0.75, 0, 0],
];

const pos = (x: number, y: number) => ({ left: `${(x / 1200) * 100}%`, top: `${(y / 220) * 100}%` });

export function NightSky() {
  return (
    <span className="footer-night only-dark" aria-hidden="true" data-anim-pause>
      <span className="footer-night-frame">
        <span className="footer-night-plane">
          {STARS.map(([x, y, s, o, t, d]) => (
            <span
              key={`${x}-${y}`}
              className={t ? "footer-star footer-star-tw" : "footer-star"}
              style={{ ...pos(x, y), ["--s" as string]: `${s}px`, ["--o" as string]: o, ["--t" as string]: `${t}s`, ["--d" as string]: `${d}s` } as React.CSSProperties}
            />
          ))}
          <span className="footer-moon" style={pos(888, 40)}>
            <svg viewBox="0 0 100 100" className="block h-full w-full">
              <defs>
                <mask id="footer-moon-cut">
                  <circle cx="50" cy="50" r="46" fill="#fff" />
                  <circle cx="68" cy="38" r="41" fill="#000" />
                </mask>
                <linearGradient id="footer-moon-lit" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0" stopColor="#f4f7ff" />
                  <stop offset="1" stopColor="#c3d0ef" />
                </linearGradient>
              </defs>
              <circle cx="50" cy="50" r="46" fill="url(#footer-moon-lit)" mask="url(#footer-moon-cut)" />
            </svg>
          </span>
        </span>
      </span>
    </span>
  );
}
