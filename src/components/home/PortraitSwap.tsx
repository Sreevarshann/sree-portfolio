"use client";

import Image from "next/image";
import { useCallback, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import type { PortraitPair } from "@/lib/portrait";

/**
 * Editorial hero portrait: a slightly rotated photographic print.
 *
 * With both assets present it starts on the illustrated portrait and reveals
 * the photograph through a circular mask that grows from the pointer:
 * - mouse / pen: hover to reveal, leave to return
 * - touch, keyboard and click: the frame is a toggle button (aria-pressed)
 * - reduced motion: a short crossfade instead of the mask and tilt
 * Both images share the same box and crop, so nothing shifts; the frame has
 * its own background, so there is no white flash before decode.
 *
 * With one asset it shows that image statically; with none it shows an
 * intentional placeholder (no face, no generated image).
 */
export function PortraitSwap({ pair, priority = false, className = "" }: { pair: PortraitPair; priority?: boolean; className?: string }) {
  const { real, illustrated, focus } = pair;
  const mode = real && illustrated ? "pair" : real || illustrated ? "single" : "placeholder";
  const [hover, setHover] = useState(false);
  const [pinned, setPinned] = useState(false);
  const [origin, setOrigin] = useState({ x: 50, y: 50 });
  const lastPointer = useRef<string>("mouse");
  const showReal = hover || pinned;

  const at = useCallback((e: ReactPointerEvent<HTMLElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    setOrigin({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 });
  }, []);

  const objectPosition = `${focus.x}% ${focus.y}%`;
  const sizes = "(min-width: 1024px) 340px, (min-width: 640px) 300px, 70vw";

  return (
    <figure className={`pswap ${className}`} data-mode={mode} data-state={showReal ? "real" : "illustrated"}>
      <div className="pswap-print">
        <span className="pswap-tape" aria-hidden="true" />
        <div className="pswap-photo">
          {mode === "pair" ? (
            <button
              type="button"
              className="pswap-hit"
              aria-pressed={showReal}
              aria-label="Show photograph of Sreevarshan Sathiyamurthy"
              onPointerEnter={(e) => {
                lastPointer.current = e.pointerType;
                if (e.pointerType === "touch") return;
                at(e);
                setHover(true);
              }}
              onPointerLeave={(e) => {
                if (e.pointerType === "touch") return;
                at(e);
                setHover(false);
              }}
              onPointerDown={(e) => {
                lastPointer.current = e.pointerType;
                at(e);
              }}
              onClick={(e) => {
                // Mouse users already see the photo while hovering; a click pins it.
                // Touch and keyboard toggle; keyboard reveals from the centre.
                if (e.detail === 0) setOrigin({ x: 50, y: 50 });
                setPinned((p) => !p);
                if (lastPointer.current === "touch") setHover(false);
              }}
            >
              <span className="pswap-layer pswap-illustrated">
                <Image src={illustrated!} alt="" fill priority={priority} sizes={sizes} className="object-cover" style={{ objectPosition }} />
              </span>
              <span className="pswap-layer pswap-real" style={{ ["--ox" as string]: `${origin.x}%`, ["--oy" as string]: `${origin.y}%` }}>
                {/* Eager (low priority) so the first hover never reveals an empty frame. */}
                <Image src={real!} alt="" fill loading="eager" fetchPriority="low" sizes={sizes} className="object-cover" style={{ objectPosition }} />
              </span>
              <span className="sr-only">{showReal ? "Showing the photograph." : "Showing the illustrated portrait."}</span>
            </button>
          ) : mode === "single" ? (
            <Image
              src={(real ?? illustrated)!}
              alt={real ? "Photograph of Sreevarshan Sathiyamurthy" : "Illustrated portrait of Sreevarshan Sathiyamurthy"}
              fill
              priority={priority}
              sizes={sizes}
              className="object-cover"
              style={{ objectPosition }}
            />
          ) : (
            <PortraitPlaceholder />
          )}
          <span className="pswap-gloss" aria-hidden="true" />
        </div>
        <figcaption className="pswap-caption">
          <span>Sreevarshan</span>
          <span>Boston, MA</span>
        </figcaption>
      </div>
      <p className="pswap-note" aria-hidden="true">
        <svg width="34" height="26" viewBox="0 0 34 26" fill="none" className="pswap-arrow">
          <path d="M2 23C9 22 20 18 27 6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          <path d="M21.5 7.5L27.4 5.2l.9 6.2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        {mode === "pair" ? (
          <>
            <span className="pswap-note-hover">hover for the real me</span>
            <span className="pswap-note-touch">tap for the real me</span>
          </>
        ) : (
          <span>portrait arriving soon</span>
        )}
      </p>
    </figure>
  );
}

/** Abstract, intentional placeholder: a pixel mosaic easing into contour lines. */
function PortraitPlaceholder() {
  const cols = 10;
  const rows = 12;
  const cells = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      // Deterministic soft field: brighter toward the upper centre, fading right.
      const dx = (c - 4.2) / 5;
      const dy = (r - 4.5) / 6;
      const v = Math.max(0, 1 - Math.sqrt(dx * dx + dy * dy)) * (1 - c / (cols * 1.15));
      const jitter = ((r * 7 + c * 13) % 5) / 25;
      const o = Math.min(0.85, v * 0.75 + jitter * v);
      if (o > 0.04) cells.push(<rect key={`${r}-${c}`} x={c * 20 + 1} y={r * 20.8 + 1} width="18" height="18.8" rx="2" fill="currentColor" opacity={o.toFixed(2)} />);
    }
  }
  return (
    <div className="pswap-placeholder" role="img" aria-label="Portrait placeholder — photo coming soon">
      <svg viewBox="0 0 200 250" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full text-accent" aria-hidden="true">
        <g className="pswap-mosaic">{cells}</g>
        {Array.from({ length: 9 }, (_, i) => (
          <path key={i} d={`M95 ${250 - i * 26} C 130 ${232 - i * 26}, 160 ${262 - i * 24}, 210 ${236 - i * 27}`} fill="none" stroke="currentColor" strokeOpacity={0.14 + (i % 3) * 0.06} strokeWidth="0.8" />
        ))}
      </svg>
      <span className="pswap-placeholder-mark">SS</span>
    </div>
  );
}
