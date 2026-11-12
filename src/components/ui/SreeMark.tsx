"use client";

import { useId } from "react";

/**
 * The Ask Sree mark: eight rounded capsules of two lengths around an open
 * core, with a small orbiting satellite. Original artwork.
 * state: "idle" (slow rotation + breathing) | "thinking" (staggered pulse).
 */
export function SreeMark({
  size = 40,
  state = "idle",
  className = "",
  title,
}: {
  size?: number;
  state?: "idle" | "thinking";
  className?: string;
  title?: string;
}) {
  const uid = useId().replace(/:/g, "");
  const grad = `sm-g-${uid}`;
  const grad2 = `sm-h-${uid}`;
  const arms = Array.from({ length: 8 }, (_, i) => {
    const long = i % 2 === 0;
    const len = long ? 30 : 19;
    const w = long ? 10.5 : 8.5;
    return { angle: i * 45, len, w, delay: (i * 0.11).toFixed(2) };
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
    >
      <defs>
        <linearGradient id={grad} x1="12" y1="10" x2="88" y2="92" gradientUnits="userSpaceOnUse">
          <stop offset="0" style={{ stopColor: "var(--mark-1)" }} />
          <stop offset="0.42" style={{ stopColor: "var(--mark-2)" }} />
          <stop offset="1" style={{ stopColor: "var(--mark-3)" }} />
        </linearGradient>
        <radialGradient id={grad2} cx="50" cy="50" r="12" gradientUnits="userSpaceOnUse">
          <stop offset="0" style={{ stopColor: "var(--mark-core-1)" }} />
          <stop offset="1" style={{ stopColor: "var(--mark-core-2)" }} />
        </radialGradient>
      </defs>
      <g className="arms">
        {arms.map((a) => (
          <g key={a.angle} transform={`rotate(${a.angle} 50 50)`}>
            <rect
              className="arm"
              x={50 - a.w / 2}
              y={50 - 13 - a.len}
              width={a.w}
              height={a.len}
              rx={a.w / 2}
              fill={`url(#${grad})`}
              style={{ animationDelay: `${a.delay}s` }}
            />
          </g>
        ))}
      </g>
      <circle className="core" cx="50" cy="50" r="6.5" fill={`url(#${grad2})`} />
      <g className="orbit">
        <circle cx="50" cy="4.5" r="3.2" style={{ fill: "var(--mark-2)" }} opacity="0.9" />
      </g>
    </svg>
  );
}
