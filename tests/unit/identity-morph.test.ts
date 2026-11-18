import { describe, expect, it } from "vitest";
import { FROM, INTRO, TO, buildParticles, particleAt, samplePoints, timeline, type Pt } from "@/lib/identityMorph";

/** V13: deterministic letter reconstruction and one shared clock. */
const grid = (x0: number, w: number, n: number): Pt[] => Array.from({ length: n }, (_, i) => ({ x: x0 + ((i * 7) % w), y: 10 + (i % 13), a: 1 }));

describe("identity morph", () => {
  it("changes only the middle letters", () => {
    expect("S" + FROM + "an").toBe("Spiderman");
    expect("S" + TO + "an").toBe("Sreevarshan");
  });

  it("samples ink on a grid in CSS pixels", () => {
    const w = 8;
    const h = 4;
    const data = new Uint8ClampedArray(w * h * 4);
    data[(1 * w + 3) * 4 + 3] = 255; // one opaque pixel at (3, 1)
    expect(samplePoints(data, w, h, 1, 2)).toEqual([{ x: 1.5, y: 0.5, a: 1 }]);
  });

  it("starts every particle on a source glyph and ends it on a target glyph", () => {
    const src = grid(0, 300, 400);
    const tgt = grid(0, 420, 600);
    const ps = buildParticles(src, tgt, [{ x: 0, y: 0, w: 300, h: 30 }], 100);
    expect(ps).toHaveLength(600);
    const key = (p: { x: number; y: number }) => `${p.x},${p.y}`;
    const S = new Set(src.map(key));
    const T = new Set(tgt.map(key));
    for (const p of ps) {
      const a = particleAt(p, INTRO.hold);
      expect(S.has(key({ x: Math.round(a.x * 1e6) / 1e6, y: Math.round(a.y * 1e6) / 1e6 }))).toBe(true);
      const b = particleAt(p, INTRO.end);
      expect(T.has(key({ x: Math.round(b.x * 1e6) / 1e6, y: Math.round(b.y * 1e6) / 1e6 }))).toBe(true);
    }
    // Every target point is used: the new letters are fully rebuilt.
    expect(new Set(ps.map((p) => key({ x: p.tx, y: p.ty }))).size).toBe(T.size);
  });

  it("is deterministic", () => {
    const a = buildParticles(grid(0, 200, 100), grid(0, 260, 140), [{ x: 0, y: 0, w: 200, h: 30 }], 90);
    const b = buildParticles(grid(0, 200, 100), grid(0, 260, 140), [{ x: 0, y: 0, w: 200, h: 30 }], 90);
    expect(a).toEqual(b);
  });

  it("fractures, then flows, within the one-second window", () => {
    const [p] = buildParticles([{ x: 10, y: 10, a: 1 }], [{ x: 200, y: 12, a: 1 }], [{ x: 0, y: 0, w: 40, h: 40 }], 100);
    const before = particleAt(p, INTRO.hold - 500);
    expect([before.x, before.y]).toEqual([10, 10]);
    const cracked = particleAt(p, INTRO.flowStart);
    expect(Math.hypot(cracked.x - 10, cracked.y - 10)).toBeGreaterThan(0.5);
    expect(INTRO.flowStart + INTRO.flowSpread + INTRO.flowDur).toBeLessThanOrEqual(INTRO.end);
  });

  it("drives the photo and the name from the same clock: start at 1.5 s, finish at 2.4 s", () => {
    expect(timeline(0).photo).toBe(0);
    expect(timeline(INTRO.hold).photo).toBe(0);
    expect(timeline((INTRO.hold + INTRO.end) / 2).photo).toBeCloseTo(0.5, 5);
    // V14: a 1.5 s hold and a 0.9 s transformation.
    expect(INTRO.hold).toBe(1500);
    expect(INTRO.end).toBe(2400);
    expect(timeline(INTRO.end).photo).toBe(1);
    expect(timeline(INTRO.end).lock).toBe(1);
    expect(timeline(INTRO.end).slide).toBe(1);
    expect(timeline(INTRO.end - 1).done).toBe(false);
    expect(timeline(INTRO.end).done).toBe(true);
  });
});
