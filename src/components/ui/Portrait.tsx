"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import type { PortraitAsset } from "@/lib/portrait";

/**
 * Editorial portrait: a 4:5 frame with an offset back plate, a blue light
 * edge, coordinate caption, a mask reveal on load, gentle scroll drift and a
 * subtle pointer-responsive tilt (desktop, motion allowed).
 *
 * With no approved photo it shows an explicitly temporary placeholder - an
 * abstract monogram composition, never a generated face.
 */
export function Portrait({
  asset,
  size = "lg",
  priority = false,
  className = "",
}: {
  asset: PortraitAsset;
  size?: "sm" | "lg";
  priority?: boolean;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || size === "sm") return;
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!fine || reduce) return;
    let raf = 0;
    let tx = 0, ty = 0, x = 0, y = 0;
    const loop = () => {
      x += (tx - x) * 0.08;
      y += (ty - y) * 0.08;
      el.style.setProperty("--rx", `${(-y * 5).toFixed(2)}deg`);
      el.style.setProperty("--ry", `${(x * 6).toFixed(2)}deg`);
      el.style.setProperty("--px", `${(x * 10).toFixed(1)}px`);
      el.style.setProperty("--py", `${(y * 10).toFixed(1)}px`);
      if (Math.abs(tx - x) > 0.001 || Math.abs(ty - y) > 0.001) raf = requestAnimationFrame(loop);
      else raf = 0;
    };
    const move = (e: PointerEvent) => {
      tx = (e.clientX / window.innerWidth - 0.5) * 2;
      ty = (e.clientY / window.innerHeight - 0.5) * 2;
      if (!raf) raf = requestAnimationFrame(loop);
    };
    window.addEventListener("pointermove", move, { passive: true });
    return () => {
      window.removeEventListener("pointermove", move);
      cancelAnimationFrame(raf);
    };
  }, [size]);

  const small = size === "sm";
  return (
    <figure ref={ref} className={`portrait relative ${small ? "w-[64px] sm:w-[84px]" : "w-full"} ${className}`} data-size={size}>
      <div className="relative">
      <div className="portrait-plate absolute inset-0 rounded-[26px] border border-line-strong" aria-hidden="true" />
      <div className="portrait-frame relative aspect-[4/5] overflow-hidden rounded-[26px] bg-surface">
        {asset ? (
          <Image
            src={asset.src}
            alt="Portrait of Sreevarshan (Sree) Sathiyamurthy"
            fill
            priority={priority}
            sizes={small ? "84px" : "(min-width: 1024px) 340px, 60vw"}
            className="portrait-img object-cover"
            style={{ objectPosition: `${asset.focus.x}% ${asset.focus.y}%` }}
          />
        ) : (
          <PortraitPlaceholder small={small} />
        )}
        <div className="pointer-events-none absolute inset-0 rounded-[26px] portrait-shade" aria-hidden="true" />
        <div className="portrait-sheen pointer-events-none absolute inset-0" aria-hidden="true" />
      </div>
      </div>
      {!small && (
        <figcaption className="mono mt-5 flex items-center justify-between text-[0.66rem] uppercase tracking-[0.14em] text-fg-muted">
          <span>Sreevarshan · Boston</span>
          <span>42.36° N</span>
        </figcaption>
      )}
      <style>{`
        .portrait{perspective:900px}
        .portrait .portrait-frame{transform:rotateX(var(--rx,0)) rotateY(var(--ry,0));transform-style:preserve-3d;transition:transform .2s linear}
        .portrait .portrait-plate{transform:translate(calc(14px + var(--px,0px)), calc(14px + var(--py,0px)));background:linear-gradient(140deg,var(--accent-soft),transparent 60%)}
        .portrait[data-size="sm"] .portrait-plate{transform:translate(6px,6px)}
        .portrait[data-size="sm"] .portrait-frame,.portrait[data-size="sm"] .portrait-plate{border-radius:16px}
        .portrait-shade{box-shadow:inset 0 0 0 1px rgb(255 255 255/.08),inset 0 -80px 80px -60px rgb(0 0 0/.45)}
        :root[data-theme="light"] .portrait-shade{box-shadow:inset 0 0 0 1px rgb(15 23 42/.06),inset 0 -60px 60px -50px rgb(15 23 42/.08)}
        .portrait-sheen{background:linear-gradient(115deg,transparent 35%,rgb(169 200 255/.16) 50%,transparent 65%);transform:translateX(-120%)}
        :root[data-theme="light"] .portrait-sheen{background:linear-gradient(115deg,transparent 35%,rgb(255 255 255/.5) 50%,transparent 65%)}
        @media (prefers-reduced-motion: no-preference){
          .portrait-frame{animation:portraitReveal 1.4s cubic-bezier(.65,0,.35,1) .35s both}
          .portrait-img{animation:portraitZoom 2.2s cubic-bezier(.16,1,.3,1) .35s both}
          .portrait-shade{box-shadow:inset 0 0 0 1px rgb(255 255 255/.08),inset 0 -80px 80px -60px rgb(0 0 0/.45)}
        :root[data-theme="light"] .portrait-shade{box-shadow:inset 0 0 0 1px rgb(15 23 42/.06),inset 0 -60px 60px -50px rgb(15 23 42/.08)}
        .portrait-sheen{animation:portraitSheen 1.6s cubic-bezier(.65,0,.35,1) 1.2s both}
        }
        @keyframes portraitReveal{from{clip-path:inset(100% 0 0 0 round 26px)}to{clip-path:inset(0 0 0 0 round 26px)}}
        @keyframes portraitZoom{from{transform:scale(1.18)}}
        @keyframes portraitSheen{to{transform:translateX(120%)}}
      `}</style>
    </figure>
  );
}

function PortraitPlaceholder({ small }: { small: boolean }) {
  return (
    <div className="absolute inset-0" role="img" aria-label="Portrait placeholder: photo coming soon">
      <div className="absolute inset-0 bg-[radial-gradient(120%_80%_at_70%_20%,var(--accent-soft),transparent_60%),linear-gradient(180deg,var(--surface),var(--bg-elev))]" />
      <svg viewBox="0 0 200 250" className="absolute inset-0 h-full w-full text-accent" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        {Array.from({ length: 11 }, (_, i) => (
          <path
            key={i}
            d={`M-10 ${40 + i * 20} C 50 ${20 + i * 20}, 110 ${70 + i * 18}, 210 ${30 + i * 21}`}
            fill="none"
            stroke="currentColor"
            strokeOpacity={0.12 + (i % 3) * 0.05}
            strokeWidth="0.8"
          />
        ))}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`font-medium leading-none tracking-[0.04em] text-accent-fg ${small ? "text-2xl" : "text-[5rem]"}`}>SS</span>
        {!small && <span className="mono mt-4 text-[0.62rem] uppercase tracking-[0.2em] text-fg-muted">Photo coming soon</span>}
      </div>
    </div>
  );
}
