import fs from "node:fs";
import path from "node:path";

export type PortraitAsset = { src: string; focus: { x: number; y: number } } | null;

const CANDIDATES = ["sree.avif", "sree.webp", "sree.jpg", "sree.jpeg", "sree.png"];

/**
 * Finds the approved portrait in public/portrait/. Returns null (placeholder)
 * when none has been added. Evaluated at build time for static pages.
 */
export function getPortrait(): PortraitAsset {
  const dir = path.join(process.cwd(), "public", "portrait");
  const file = CANDIDATES.find((f) => fs.existsSync(path.join(dir, f)));
  if (!file) return null;
  let focus = { x: 50, y: 30 };
  try {
    const raw = JSON.parse(fs.readFileSync(path.join(dir, "focus.json"), "utf8"));
    if (typeof raw.x === "number" && typeof raw.y === "number") focus = { x: raw.x, y: raw.y };
  } catch {}
  return { src: `/portrait/${file}`, focus };
}
