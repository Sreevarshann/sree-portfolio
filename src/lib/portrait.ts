import { portrait } from "@/content/media";

export type PortraitAsset = { src: string; focus: { x: number; y: number } } | null;

/** The two hero portraits: the masked photo shown first ("illustrated"), and the real one. */
export type PortraitPair = { real: string | null; illustrated: string | null; focus: { x: number; y: number } };

/**
 * Hero portraits from the media manifest (src/content/media.ts): the
 * Spider-Man mask photo is the default layer and the real photograph is
 * revealed. PortraitSwap still handles a missing file gracefully (single
 * image or placeholder) if either entry is ever removed.
 */
export function getPortraitPair(): PortraitPair {
  return { real: portrait.real.src, illustrated: portrait.masked.src, focus: portrait.focus };
}

/** The approved real photograph (About page). */
export function getPortrait(): PortraitAsset {
  return { src: portrait.real.src, focus: portrait.focus };
}
