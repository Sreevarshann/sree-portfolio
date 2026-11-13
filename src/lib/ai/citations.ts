/**
 * Citations are separate from answer text. The model marks claims with source
 * ids ("[S2]") that refer to the context it was given; the server sends the
 * id → {label, href} map, and the client renders each valid marker as a small
 * numbered link. Unknown ids are dropped; the model writes no links itself.
 */
export type SourceRef = { id: string; label: string; href: string };
export type Citation = SourceRef & { n: number };

/**
 * One marker or a group: [S1] · [S1][S3] · [S1, S3] · [S1; S3]. Full-width
 * brackets (【S1】), which some models emit for citations, are accepted too.
 */
const OPEN = "[\\[【]";
const CLOSE = "[\\]】]";
const IDS = "(S\\d{1,2}(?:\\s*[,;，]\\s*S\\d{1,2})*)";
const GROUP = new RegExp(`${OPEN}\\s*${IDS}\\s*${CLOSE}`, "g");
const GROUP_WITH_SPACE = new RegExp(`[ \\t]*${OPEN}\\s*${IDS}\\s*${CLOSE}`, "g");
const splitIds = (ids: string) => ids.split(/[,;，]/).map((x) => x.trim());

/** Experience/achievement anchors are distinct pages; other hashes are not. */
const pageKey = (href: string) => (/^\/(experience|achievements)#/.test(href) ? href : href.replace(/#.*$/, ""));

/** Cited sources in order of first appearance, one per page, numbered from 1. */
export function resolveCitations(text: string, map: SourceRef[]): Citation[] {
  const byId = new Map(map.map((s) => [s.id, s]));
  const out: Citation[] = [];
  const seen = new Map<string, number>();
  for (const m of text.matchAll(GROUP)) {
    for (const id of splitIds(m[1])) {
      const ref = byId.get(id);
      if (!ref) continue;
      const key = pageKey(ref.href);
      if (seen.has(key)) continue;
      seen.set(key, out.length + 1);
      out.push({ ...ref, n: out.length + 1 });
    }
  }
  return out;
}

/**
 * Replaces markers with Markdown links to `#cite-<n>` (rendered as citation
 * chips by the chat view) and removes invalid ids. While streaming, a
 * half-written marker at the very end is hidden until it completes.
 */
export function renderCitationMarkers(text: string, map: SourceRef[], streaming = false): string {
  const cited = resolveCitations(text, map);
  const byId = new Map(map.map((s) => [s.id, s]));
  const numberFor = (id: string) => {
    const ref = byId.get(id);
    return ref ? cited.find((c) => pageKey(c.href) === pageKey(ref.href))?.n : undefined;
  };
  let out = text.replace(GROUP_WITH_SPACE, (_, ids: string) => {
    const ns = [...new Set(splitIds(ids).map((x) => numberFor(x)).filter((n): n is number => n !== undefined))];
    return ns.map((n) => `[${n}](#cite-${n})`).join("");
  });
  if (streaming) out = out.replace(/[[【]\s*S?\d{0,2}(\s*[,;，]\s*S?\d{0,2})*$/, "");
  return out;
}

/** The answer without citation markers (for copying and validation). */
export function stripCitationMarkers(text: string) {
  return text.replace(GROUP_WITH_SPACE, "");
}
