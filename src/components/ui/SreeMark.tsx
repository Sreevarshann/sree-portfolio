"use client";

import { useId } from "react";

/**
 * The Sree AI mark - original artwork. Eight rounded capsules (four long,
 * four short) around an open core, a silver-white nucleus and a small
 * orbiting satellite, over a soft blue glow. Colors: deep ocean → electric
 * blue → silver-white (theme tokens --mark-*).
 *
 * States: "idle" rotates slowly and breathes; "thinking" speeds up, the arms
 * morph in a staggered wave and the glow pulses.
 */
export function SreeMark({
  size = 40,
  state = "idle",
  className = "",
  title,
  glow = size >= 26,
}: {
  size?: number;
  state?: "idle" | "thinking";
  className?: string;
  title?: string;
  glow?: boolean;
}) {
  const uid = useId().replace(/:/g, "");
  const grad = `sm-g-${uid}`;
  const core = `sm-c-${uid}`;
  const halo = `sm-h-${uid}`;
  const arms = Array.from({ length: 8 }, (_, i) => {
    const long = i % 2 === 0;
    return { angle: i * 45, len: long ? 29 : 18, w: long ? 10.5 : 8.5, delay: (i * 0.09).toFixed(2) };
  });

  return (
    <svg
      className={`sree-mark ${className}`}
      data-state={state}
      width={size}
      height={size}
      viewBox="0 0 100 100"
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
      focusable="false"
      overflow="visible"
    >
      <defs>
        <linearGradient id={grad} x1="14" y1="8" x2="86" y2="94" gradientUnits="userSpaceOnUse">
          <stop offset="0" style={{ stopColor: "var(--mark-1)" }} />
          <stop offset="0.45" style={{ stopColor: "var(--mark-2)" }} />
          <stop offset="1" style={{ stopColor: "var(--mark-3)" }} />
        </linearGradient>
        <radialGradient id={core} cx="47" cy="46" r="10" gradientUnits="userSpaceOnUse">
          <stop offset="0" style={{ stopColor: "var(--mark-core-1)" }} />
          <stop offset="1" style={{ stopColor: "var(--mark-core-2)" }} />
        </radialGradient>
        <radialGradient id={halo} cx="50" cy="50" r="50" gradientUnits="userSpaceOnUse">
          <stop offset="0" style={{ stopColor: "var(--mark-glow)", stopOpacity: 0.5 }} />
          <stop offset="1" style={{ stopColor: "var(--mark-glow)", stopOpacity: 0 }} />
        </radialGradient>
      </defs>
      {glow && <circle className="glow" cx="50" cy="50" r="50" fill={`url(#${halo})`} />}
      <g className="arms">
        {arms.map((a) => (
          <g key={a.angle} transform={`rotate(${a.angle} 50 50)`}>
            <rect
              className="arm"
              x={50 - a.w / 2}
              y={50 - 12.5 - a.len}
              width={a.w}
              height={a.len}
              rx={a.w / 2}
              fill={`url(#${grad})`}
              style={{ animationDelay: `${a.delay}s` }}
            />
          </g>
        ))}
      </g>
      <circle className="core" cx="50" cy="50" r="6.5" fill={`url(#${core})`} />
      <g className="orbit">
        <circle cx="50" cy="3.5" r="3" style={{ fill: "var(--mark-1)" }} opacity="0.95" />
      </g>
    </svg>
  );
}
