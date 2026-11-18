/**
 * Identity reveal: "Spiderman." becomes "Sreevarshan.".
 *
 * Pure geometry and timing, no DOM. The hero measures the rendered glyphs,
 * samples their ink into points, and this module pairs every point of
 * "piderm" with a point of "reevarsh" so the middle letters fracture into
 * shards, travel and rebuild the new letters. "S" and "an" are never part of
 * the particle set: they stay in the DOM and only slide to their new places.
 *
 * Everything is deterministic (seeded), so the same page renders the same
 * motion every time and tests can assert exact endpoints.
 */

export const FROM = "piderm";
export const TO = "reevarsh";

/**
 * Milliseconds from the start of the hold. "Spiderman." holds for 1.5 s, then
 * the name and the photo transform together on one clock and finish at 2.4 s.
 */
export const INTRO = {
  hold: 1500,
  fractureEnd: 1770,
  flowStart: 1680,
  flowSpread: 207,
  flowDur: 378,
  slideStart: 1815,
  slideEnd: 2310,
  lockStart: 2238,
  end: 2400,
} as const;

export type Pt = { x: number; y: number; a: number };
export type Box = { x: number; y: number; w: number; h: number };

export type Particle = {
  sx: number; sy: number; // source (on a "piderm" glyph)
  tx: number; ty: number; // target (on a "reevarsh" glyph)
  cx: number; cy: number; // bezier control point
  px: number; py: number; // shard pivot
  dx: number; dy: number; // shard drift at the end of the fracture
  rot: number; // shard rotation (radians) at the end of the fracture
  delay: number; // ms after flowStart
  a0: number; a1: number;
};

export const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
export const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
export const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
export const easeInOutSine = (t: number) => -(Math.cos(Math.PI * t) - 1) / 2;

/** Small fast seeded PRNG (mulberry32). */
export function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Sample glyph ink from RGBA pixels on a regular grid. `step` is in device
 * pixels; returned coordinates are in CSS pixels (divided by `scale`).
 */
export function samplePoints(data: Uint8ClampedArray, width: number, height: number, step: number, scale: number, minAlpha = 48): Pt[] {
  const out: Pt[] = [];
  const s = Math.max(1, Math.round(step));
  for (let y = Math.floor(s / 2); y < height; y += s) {
    for (let x = Math.floor(s / 2); x < width; x += s) {
      const a = data[(y * width + x) * 4 + 3];
      if (a >= minAlpha) out.push({ x: x / scale, y: y / scale, a: a / 255 });
    }
  }
  return out;
}

/** Order points left to right in narrow columns, top to bottom within a column. */
function columnOrder(points: Pt[], columns: number) {
  if (!points.length) return [];
  let min = Infinity;
  let max = -Infinity;
  for (const p of points) {
    if (p.x < min) min = p.x;
    if (p.x > max) max = p.x;
  }
  const span = Math.max(1e-6, max - min);
  return points
    .map((p) => ({ p, k: Math.min(columns - 1, Math.floor(((p.x - min) / span) * columns)) }))
    .sort((a, b) => a.k - b.k || a.p.y - b.p.y)
    .map((e) => e.p);
}

/**
 * Pair source and target points and give each pair its shard and path.
 * `letters` are the source glyph boxes (for shard seeds); `em` is the font
 * size in CSS pixels so motion scales with the type.
 */
export function buildParticles(src: Pt[], tgt: Pt[], letters: Box[], em: number, seed = 7): Particle[] {
  if (!src.length || !tgt.length) return [];
  const rand = rng(seed);
  // Shards: a handful of seeds per source letter; each point joins the nearest.
  const shards: { x: number; y: number; dx: number; dy: number; rot: number }[] = [];
  for (const b of letters) {
    const cx = b.x + b.w / 2;
    const cy = b.y + b.h / 2;
    for (let i = 0; i < 6; i++) {
      const x = b.x + b.w * (0.15 + 0.7 * rand());
      const y = b.y + b.h * (0.1 + 0.8 * rand());
      const len = Math.hypot(x - cx, y - cy) || 1;
      const push = em * (0.025 + 0.035 * rand());
      shards.push({ x, y, dx: ((x - cx) / len) * push, dy: ((y - cy) / len) * push - em * 0.012, rot: (rand() - 0.5) * 0.16 });
    }
  }
  const shardOf = (p: Pt) => {
    let best = shards[0];
    let bd = Infinity;
    for (const s of shards) {
      const d = (s.x - p.x) ** 2 + (s.y - p.y) ** 2;
      if (d < bd) {
        bd = d;
        best = s;
      }
    }
    return best;
  };

  const S = columnOrder(src, 48);
  const T = columnOrder(tgt, 48);
  const n = Math.max(S.length, T.length);
  let minX = Infinity;
  let maxX = -Infinity;
  for (const t of T) {
    if (t.x < minX) minX = t.x;
    if (t.x > maxX) maxX = t.x;
  }
  const spanX = Math.max(1e-6, maxX - minX);
  const out: Particle[] = new Array(n);
  for (let k = 0; k < n; k++) {
    const s = S[Math.floor((k * S.length) / n)];
    const t = T[Math.floor((k * T.length) / n)];
    const sh = shardOf(s);
    const mx = (s.x + t.x) / 2;
    const my = (s.y + t.y) / 2;
    const vx = t.x - s.x;
    const vy = t.y - s.y;
    const len = Math.hypot(vx, vy) || 1;
    const bend = em * (rand() - 0.5) * 0.5;
    const nx = -vy / len;
    const ny = vx / len;
    out[k] = {
      sx: s.x, sy: s.y, tx: t.x, ty: t.y,
      cx: mx + nx * bend, cy: my + ny * bend - em * (0.08 + 0.12 * rand()),
      px: sh.x, py: sh.y, dx: sh.dx, dy: sh.dy, rot: sh.rot,
      delay: (((t.x - minX) / spanX) * 0.75 + rand() * 0.25) * INTRO.flowSpread,
      a0: s.a, a1: t.a,
    };
  }
  return out;
}

export type Frame = { x: number; y: number; a: number; size: number; glow: number };

/** Where a particle is at time `t` (ms on the intro clock). */
export function particleAt(p: Particle, t: number, out: Frame = { x: 0, y: 0, a: 0, size: 1, glow: 0 }): Frame {
  // Fracture: the shard drifts and turns slightly around its pivot.
  const f = easeOutCubic(clamp01((t - INTRO.hold) / (INTRO.fractureEnd - INTRO.hold)));
  const c = Math.cos(p.rot * f);
  const s = Math.sin(p.rot * f);
  const rx = p.sx - p.px;
  const ry = p.sy - p.py;
  const fx = p.px + rx * c - ry * s + p.dx * f;
  const fy = p.py + rx * s + ry * c + p.dy * f;
  // Flow: a quadratic path from the fractured position to the target.
  const u = clamp01((t - INTRO.flowStart - p.delay) / INTRO.flowDur);
  const e = easeInOutCubic(u);
  const i = 1 - e;
  out.x = i * i * fx + 2 * i * e * p.cx + e * e * p.tx;
  out.y = i * i * fy + 2 * i * e * p.cy + e * e * p.ty;
  out.a = p.a0 + (p.a1 - p.a0) * e;
  const lift = Math.sin(Math.PI * u);
  out.size = 1 + 0.6 * lift;
  out.glow = Math.max(f * (1 - u) * 0.55, lift);
  return out;
}

/** Shared progress for everything else on the clock. */
export function timeline(t: number) {
  return {
    // The photo dissolves over exactly the same window as the name: 1.5 s to 2.4 s.
    photo: easeInOutCubic(clamp01((t - INTRO.hold) / (INTRO.end - INTRO.hold))),
    slide: easeInOutCubic(clamp01((t - INTRO.slideStart) / (INTRO.slideEnd - INTRO.slideStart))),
    lock: easeOutCubic(clamp01((t - INTRO.lockStart) / (INTRO.end - INTRO.lockStart))),
    done: t >= INTRO.end,
  };
}
