"use client";

import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import { INTRO, buildParticles, particleAt, samplePoints, timeline, type Box, type Frame, type Particle } from "@/lib/identityMorph";

export type IntroPhase = "hold" | "morph" | "final";

/*
 * Once per page load. Module state survives React Strict Mode's double
 * effects and client-side remounts, so the intro never replays on its own.
 */
let played = false;
let holdStart: number | null = null;

const LEVELS = 4;

/** CSS color of `expr`, resolved by the browser (works with color-mix and custom properties). */
function resolveColor(host: HTMLElement, expr: string) {
  const probe = document.createElement("span");
  probe.style.color = expr;
  probe.style.display = "none";
  host.appendChild(probe);
  const c = getComputedStyle(probe).color;
  probe.remove();
  return c;
}

function waitForMedia(root: HTMLElement, timeout: number) {
  const imgs = Array.from(root.querySelectorAll<HTMLImageElement>(".pswap img"));
  const all = Promise.all([document.fonts?.ready, ...imgs.map((img) => img.decode().catch(() => undefined))]);
  return Promise.race([all, new Promise((r) => setTimeout(r, timeout))]);
}

/**
 * Drives the identity reveal on one clock: the letter particles, the slide
 * of "S" and "an", the lock-in of the new letters, and the photo dissolve
 * (published as --intro-photo on the hero for the portrait's CSS).
 */
export function useIdentityIntro(rootRef: RefObject<HTMLElement | null>, nameRef: RefObject<HTMLElement | null>) {
  const [phase, setPhase] = useState<IntroPhase>(() => (played ? "final" : "hold"));
  const phaseRef = useRef(phase);
  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);
  const stop = useRef<() => void>(() => {});

  const finish = useCallback(() => {
    stop.current();
    played = true;
    setPhase("final");
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    const name = nameRef.current;
    if (!root || !name) return;
    // Settle without the intro: a remount after it started (Strict Mode or
    // navigation), or reduced motion (CSS already shows the final state).
    if (played || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      if (phaseRef.current === "final") return;
      const id = requestAnimationFrame(finish);
      return () => cancelAnimationFrame(id);
    }

    let timer = 0;
    let raf = 0;
    let canvas: HTMLCanvasElement | null = null;
    let cancelled = false;
    const word = name.querySelector<HTMLElement>(".hf-word")!;
    const sEl = name.querySelector<HTMLElement>(".hf-s")!;
    const anEl = name.querySelector<HTMLElement>(".hf-an")!;
    const toEl = name.querySelector<HTMLElement>(".hf-to")!;

    const clear = () => {
      cancelAnimationFrame(raf);
      clearTimeout(timer);
      // Once the dissolve has started, leave the photo at its end value: the
      // portrait leaves its intro state on the next render, and a reset here
      // would flash Spider-Man back. Before that, leave nothing behind.
      if (canvas) root.style.setProperty("--intro-photo", "1");
      else root.style.removeProperty("--intro-photo");
      canvas?.remove();
      canvas = null;
      sEl.style.transform = "";
      anEl.style.transform = "";
      toEl.style.opacity = "";
    };
    stop.current = clear;

    if (holdStart === null) {
      // The hold is counted from when "Spiderman." was first painted (the
      // server-rendered page), not from hydration, so the reveal lands at the
      // same moment however long the scripts took. A later client-side visit
      // to the page starts its own hold now.
      const now = performance.now();
      const fcp = performance.getEntriesByName("first-contentful-paint")[0]?.startTime;
      holdStart = fcp !== undefined && now - fcp < INTRO.hold ? fcp : now;
      performance.mark("identity-hold", { startTime: holdStart });
    }
    const start = holdStart;

    const begin = () => {
      if (cancelled) return;
      played = true;
      performance.mark("identity-morph");
      // Rects are read in viewport space and converted at the end: the
      // heading is centred and shrink-wrapped, so its own box moves when the
      // word gets wider.
      const glyphs = (sel: string) => Array.from(name.querySelectorAll<HTMLElement>(sel)).map((el) => ({ ch: el.dataset.c ?? "", r: el.getBoundingClientRect() }));
      const baseline = () => name.querySelector(".hf-base")!.getBoundingClientRect().bottom;

      // 1. Measure "Spiderman." as it is drawn now.
      const fromRaw = glyphs(".hf-from [data-c]");
      const sFromR = sEl.getBoundingClientRect();
      const anFromR = anEl.getBoundingClientRect();
      const baseFromR = baseline();
      // 2. Lay out "Sreevarshan." (one layout pass) and measure it.
      word.dataset.phase = "morph";
      toEl.style.opacity = "0";
      const toRaw = glyphs(".hf-to [data-c]");
      const sToR = sEl.getBoundingClientRect();
      const anToR = anEl.getBoundingClientRect();
      const baseToR = baseline();
      const origin = name.getBoundingClientRect();
      const zoom = origin.width / (name.offsetWidth || 1) || 1;
      const rel = (r: DOMRect): Box => ({ x: (r.left - origin.left) / zoom, y: (r.top - origin.top) / zoom, w: r.width / zoom, h: r.height / zoom });
      const from = fromRaw.map((g) => ({ ch: g.ch, box: rel(g.r) }));
      const to = toRaw.map((g) => ({ ch: g.ch, box: rel(g.r) }));
      const sFrom = rel(sFromR);
      const anFrom = rel(anFromR);
      const sTo = rel(sToR);
      const anTo = rel(anToR);
      const baseFrom = (baseFromR - origin.top) / zoom;
      const baseTo = (baseToR - origin.top) / zoom;
      const dS = sFrom.x - sTo.x;
      const dAn = anFrom.x - anTo.x;
      sEl.style.transform = `translateX(${dS}px)`;
      anEl.style.transform = `translateX(${dAn}px)`;
      setPhase("morph");

      // 3. Rasterise both glyph sets in the displayed font and sample their ink.
      const cs = getComputedStyle(name.querySelector(".hf-from [data-c]") ?? sEl);
      const em = parseFloat(cs.fontSize);
      const font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
      const all = [...from.map((g) => g.box), ...to.map((g) => g.box)];
      const padX = em * 0.45;
      const padY = em * 0.4;
      const bx = Math.min(...all.map((b) => b.x)) - padX;
      const by = Math.min(...all.map((b) => b.y)) - padY;
      const bw = Math.max(...all.map((b) => b.x + b.w)) - bx + padX;
      const bh = Math.max(...all.map((b) => b.y + b.h)) - by + padY;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const W = Math.ceil(bw * dpr);
      const H = Math.ceil(bh * dpr);
      const raster = (set: typeof from, base: number) => {
        const c = document.createElement("canvas");
        c.width = W;
        c.height = H;
        const x = c.getContext("2d", { willReadFrequently: true })!;
        x.scale(dpr, dpr);
        x.font = font;
        x.textBaseline = "alphabetic";
        x.fillStyle = "#000";
        for (const g of set) x.fillText(g.ch, g.box.x - bx, base - by);
        return x.getImageData(0, 0, W, H).data;
      };
      const step = Math.max(1.5, Math.min(2.6, em / 58)) * dpr;
      const src = samplePoints(raster(from, baseFrom), W, H, step, dpr);
      const tgt = samplePoints(raster(to, baseTo), W, H, step, dpr);
      const particles: Particle[] = buildParticles(src, tgt, from.map((g) => ({ ...g.box, x: g.box.x - bx, y: g.box.y - by })), em);
      const size = step / dpr;

      // 4. The visible canvas, confined to the word's own region.
      canvas = document.createElement("canvas");
      canvas.className = "hf-canvas";
      canvas.setAttribute("aria-hidden", "true");
      canvas.width = W;
      canvas.height = H;
      Object.assign(canvas.style, { left: `${bx}px`, top: `${by}px`, width: `${bw}px`, height: `${bh}px` });
      name.appendChild(canvas);
      const ctx = canvas.getContext("2d")!;
      const colors = Array.from({ length: LEVELS }, (_, i) => resolveColor(name, `color-mix(in oklab, var(--accent) ${Math.round((i / (LEVELS - 1)) * 70)}%, var(--fg))`));
      const frame: Frame = { x: 0, y: 0, a: 0, size: 1, glow: 0 };
      const buckets: number[][] = Array.from({ length: LEVELS * LEVELS }, () => []);
      // The shared clock starts once measuring and rasterising are done, so
      // the first frame is the first frame of the timeline.
      const t0 = performance.now();
      performance.mark("identity-clock");

      const draw = (t: number) => {
        const tl = timeline(t);
        root.style.setProperty("--intro-photo", tl.photo.toFixed(4));
        sEl.style.transform = `translateX(${(dS * (1 - tl.slide)).toFixed(2)}px)`;
        anEl.style.transform = `translateX(${(dAn * (1 - tl.slide)).toFixed(2)}px)`;
        // Lock-in: the crisp letters reach full opacity first, then the
        // particles on top fade, so the word never dims mid-swap.
        toEl.style.opacity = Math.min(1, tl.lock * 2).toFixed(3);
        for (const b of buckets) b.length = 0;
        for (const p of particles) {
          particleAt(p, t, frame);
          const g = Math.min(LEVELS - 1, Math.round(frame.glow * (LEVELS - 1)));
          const a = Math.min(LEVELS - 1, Math.floor(frame.a * LEVELS));
          const s = size * frame.size;
          buckets[g * LEVELS + a].push(frame.x - s / 2, frame.y - s / 2, s);
        }
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, bw, bh);
        const fade = 1 - Math.max(0, tl.lock * 2 - 1);
        for (let g = 0; g < LEVELS; g++) {
          ctx.fillStyle = colors[g];
          for (let a = 0; a < LEVELS; a++) {
            const list = buckets[g * LEVELS + a];
            if (!list.length) continue;
            ctx.globalAlpha = ((a + 1) / LEVELS) * fade;
            ctx.beginPath();
            for (let i = 0; i < list.length; i += 3) ctx.rect(list[i], list[i + 1], list[i + 2], list[i + 2]);
            ctx.fill();
          }
        }
        return tl.done;
      };

      draw(INTRO.hold);
      const tick = (now: number) => {
        if (cancelled) return;
        if (draw(INTRO.hold + (now - t0))) {
          performance.mark("identity-final");
          clear();
          setPhase("final");
          return;
        }
        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    };

    // Hold "Spiderman." for 1.5 seconds, and never start before the font
    // and both photographs are ready (a late start beats a broken one).
    waitForMedia(root, 6000).then(() => {
      if (cancelled) return;
      const at = Math.max(start + INTRO.hold, performance.now() + 150);
      timer = window.setTimeout(begin, at - performance.now());
    });

    return () => {
      cancelled = true;
      clear();
    };
  }, [rootRef, nameRef, finish]);

  return { phase, skip: finish };
}
