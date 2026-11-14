import fs from "node:fs";
import path from "node:path";

export type PortraitAsset = { src: string; focus: { x: number; y: number } } | null;

/** The two hero portraits; each is null until its file is added. */
export type PortraitPair = { real: string | null; illustrated: string | null; focus: { x: number; y: number } };

const EXT = ["avif", "webp", "jpg", "jpeg", "png"];
const PROFILE_DIR = ["images", "profile"];
const LEGACY = ["sree.avif", "sree.webp", "sree.jpg", "sree.jpeg", "sree.png"];

const publicPath = (...p: string[]) => path.join(process.cwd(), "public", ...p);

function find(dir: string[], base: string) {
  const ext = EXT.find((e) => fs.existsSync(publicPath(...dir, `${base}.${e}`)));
  return ext ? `/${[...dir, `${base}.${ext}`].join("/")}` : null;
}

function readFocus(dir: string[]) {
  try {
    const raw = JSON.parse(fs.readFileSync(publicPath(...dir, "focus.json"), "utf8"));
    if (typeof raw.x === "number" && typeof raw.y === "number") return { x: raw.x, y: raw.y };
  } catch {}
  return null;
}

/**
 * Finds the hero portraits in public/images/profile/:
 *   portrait-real.{avif,webp,jpg,jpeg,png}         - the photograph
 *   portrait-illustrated.{avif,webp,jpg,jpeg,png}  - the illustrated version
 *   focus.json (optional)                          - { "x": 50, "y": 30 } crop focus in %
 * Nothing is referenced until a file exists, so there are never broken images.
 * Evaluated at build time for static pages.
 */
export function getPortraitPair(): PortraitPair {
  const real = find(PROFILE_DIR, "portrait-real") ?? legacyPhoto();
  const illustrated = find(PROFILE_DIR, "portrait-illustrated");
  const focus = readFocus(PROFILE_DIR) ?? readFocus(["portrait"]) ?? { x: 50, y: 30 };
  return { real, illustrated, focus };
}

function legacyPhoto() {
  const file = LEGACY.find((f) => fs.existsSync(publicPath("portrait", f)));
  return file ? `/portrait/${file}` : null;
}

/** The single approved photograph (About page). Returns null for the placeholder. */
export function getPortrait(): PortraitAsset {
  const { real, focus } = getPortraitPair();
  return real ? { src: real, focus } : null;
}
