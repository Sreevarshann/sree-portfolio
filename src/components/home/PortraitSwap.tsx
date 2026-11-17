"use client";

import Image from "next/image";
import { useCallback, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import type { PortraitPair } from "@/lib/portrait";

/**
 * Editorial hero portrait: a slightly rotated photographic print.
 *
 * With both assets present it starts on the masked (Spider-Man) photo. The
 * hero's identity intro dissolves it to the real photograph underneath on the
 * same clock as the name (an opacity fade with a soft radial opening from the
 * face). Both are real photographs sharing the same frame; nothing is morphed
 * or generated. After the intro the real photo rests:
 * - mouse / pen: hover brings Spider-Man back, leaving returns the real photo
 * - touch, keyboard (Enter / Space) and click: the frame is a toggle button
 *   whose label names the next action; during the intro it skips to the end
 * - reduced motion: a short crossfade instead of the opening and tilt
 * Both images share the same box and crop, so nothing shifts; the frame has
 * its own background, so there is no white flash before decode.
 *
 * With one asset it shows that image statically; with none it shows an
 * intentional placeholder (no face, no generated image).
 */
export function PortraitSwap({
  pair,
  priority = false,
  className = "",
  intro = "done",
  onSkip,
}: {
  pair: PortraitPair;
  priority?: boolean;
  className?: string;
  /** The hero's identity reveal: Spider-Man while pending, dissolving while running, then the real photo rests. */
  intro?: "pending" | "running" | "done";
  onSkip?: () => void;
}) {
  const { real, illustrated, focus } = pair;
  const mode = real && illustrated ? "pair" : real || illustrated ? "single" : "placeholder";
  const [hover, setHover] = useState(false);
  const [pinned, setPinned] = useState(false);
  // The intro dissolve opens from the face; afterwards it follows the pointer.
  const [origin, setOrigin] = useState({ x: 50, y: 38 });
  const lastPointer = useRef<string>("mouse");
  const settled = intro === "done";
  // After the intro the real photo is the resting state; hover or a tap brings Spider-Man back.
  const showReal = settled && !(hover || pinned);

  const at = useCallback((e: ReactPointerEvent<HTMLElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    setOrigin({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 });
  }, []);

  const objectPosition = `${focus.x}% ${focus.y}%`;
  const sizes = "(min-width: 1024px) 340px, (min-width: 640px) 300px, 70vw";

  return (
    <figure className={`pswap ${className}`} data-mode={mode} data-intro={intro} data-state={showReal ? "real" : "illustrated"}>
      <div className="pswap-print">
        <span className="pswap-tape" aria-hidden="true" />
        <div className="pswap-photo">
          {mode === "pair" ? (
            <button
              type="button"
              className="pswap-hit"
              aria-label={showReal ? "Show Spider-Man portrait" : "Reveal Sree's portrait"}
              onPointerEnter={(e) => {
                lastPointer.current = e.pointerType;
                if (e.pointerType === "touch" || !settled) return;
                at(e);
                setHover(true);
              }}
              onPointerLeave={(e) => {
                if (e.pointerType === "touch" || !settled) return;
                at(e);
                setHover(false);
              }}
              onPointerDown={(e) => {
                lastPointer.current = e.pointerType;
                at(e);
              }}
              onClick={(e) => {
                // During the intro, any activation jumps straight to the real photo.
                if (!settled) {
                  onSkip?.();
                  return;
                }
                // Mouse users already see Spider-Man while hovering; a click pins it.
                // Touch and keyboard toggle; keyboard reveals from the centre.
                if (e.detail === 0) setOrigin({ x: 50, y: 50 });
                setPinned((p) => !p);
                if (lastPointer.current === "touch") setHover(false);
              }}
            >
              {/* Bottom: the real photograph, eager (low priority) so the first reveal never shows an empty frame. */}
              <span className="pswap-layer pswap-real">
                <Image src={real!} alt="" fill loading="eager" fetchPriority="low" sizes={sizes} className="object-cover" style={{ objectPosition }} />
              </span>
              {/* Top: the Spider-Man mask photo, which dissolves away. */}
              <span className="pswap-layer pswap-illustrated" style={{ ["--ox" as string]: `${origin.x}%`, ["--oy" as string]: `${origin.y}%` }}>
                <Image src={illustrated!} alt="" fill priority={priority} sizes={sizes} className="object-cover" style={{ objectPosition }} />
              </span>
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
          <span>Sree</span>
        </figcaption>
      </div>
      {/* The hint sits under the print, its notch pointing straight up at the
          photograph. Purely visual (the button's label carries the action) and
          never intercepts pointer events. */}
      <p className="pswap-note" aria-hidden="true">
        <span className="pswap-note-notch" />
        {mode === "pair" ? (
          <>
            <span className="pswap-note-hover">Hover to see Spider-Man</span>
            <span className="pswap-note-touch pswap-note-touch-spider">Tap to see Spider-Man</span>
            <span className="pswap-note-touch pswap-note-touch-real">Tap again for the real me</span>
          </>
        ) : (
          <span>Portrait arriving soon</span>
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
    <div className="pswap-placeholder" role="img" aria-label="Portrait placeholder: photo coming soon">
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
