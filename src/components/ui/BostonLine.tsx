"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Abstract line drawing of the Boston skyline meeting the Zakim bridge cables,
 * drawn on when scrolled into view. Decorative only.
 */
export function BostonLine({ className = "" }: { className?: string }) {
  const ref = useRef<SVGSVGElement>(null);
  const [on, setOn] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setOn(true);
          io.disconnect();
        }
      },
      { threshold: 0.25 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const base = 196;
  // [x, width, height] for simple towers
  const towers: [number, number, number][] = [
    [40, 34, 46], [80, 22, 70], [108, 40, 54], [156, 26, 88], [190, 36, 62],
    [236, 30, 104], [380, 34, 96], [420, 24, 72], [452, 38, 118], [600, 30, 84],
    [640, 22, 64], [668, 34, 92], [760, 26, 58], [792, 40, 76],
  ];
  // Zakim: two towers at 960 and 1110, deck at y=170
  const deck = 168;
  const zakimTowers = [960, 1110];
  const cables: string[] = [];
  zakimTowers.forEach((tx) => {
    for (let i = 1; i <= 7; i++) {
      cables.push(`M${tx} ${80 + i * 4} L${tx - i * 16} ${deck}`);
      cables.push(`M${tx} ${80 + i * 4} L${tx + i * 16 * (tx === 960 ? 0.9 : 1)} ${deck}`);
    }
  });

  const draw = (len: number, delay: number): React.CSSProperties => ({
    strokeDasharray: len,
    strokeDashoffset: on ? 0 : len,
    transition: `stroke-dashoffset 1800ms cubic-bezier(.65,0,.35,1) ${delay}ms`,
  });

  return (
    <svg
      ref={ref}
      className={className}
      viewBox="0 0 1200 220"
      fill="none"
      stroke="currentColor"
      strokeWidth="1"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      preserveAspectRatio="xMidYMax meet"
    >
      {towers.map(([x, w, h], i) => (
        <path key={i} d={`M${x} ${base} V${base - h} H${x + w} V${base}`} style={draw(2 * h + w, i * 50)} opacity={0.55} />
      ))}
      {/* Prudential-like tower with crown and mast */}
      <path d={`M300 ${base} V60 H344 V${base} M306 60 V48 H338 V60 M322 48 V22`} style={draw(520, 200)} />
      {/* Hancock-like slim slab with notched side */}
      <path d={`M512 ${base} V30 L548 26 V${base} M530 28 V${base}`} style={draw(560, 320)} />
      {/* Custom House-like spire */}
      <path d={`M716 ${base} V86 H736 V${base} M716 86 L726 58 L736 86`} style={draw(360, 420)} />
      {/* Zakim bridge */}
      {zakimTowers.map((tx, i) => (
        <path key={tx} d={`M${tx - 9} ${base} L${tx} 76 L${tx + 9} ${base}`} style={draw(260, 600 + i * 120)} />
      ))}
      <path d={`M860 ${deck} H1196`} style={draw(340, 560)} />
      {cables.map((d, i) => (
        <path key={i} d={d} style={draw(170, 760 + i * 28)} opacity={0.6} strokeWidth={0.8} />
      ))}
      {/* waterline and reflections */}
      <path d={`M0 ${base} H1200`} style={draw(1200, 0)} opacity={0.8} />
      {[206, 213].map((y, i) => (
        <path key={y} d={`M${120 + i * 60} ${y} H${1080 - i * 90}`} strokeDasharray="2 10" opacity={on ? 0.35 : 0} style={{ transition: "opacity 1.2s 1.6s" }} />
      ))}
    </svg>
  );
}
