import type { ChatLink } from "./protocol";
import type { KnowledgeChunk } from "./knowledge";

/** A project has four chunks on one page; collapse them to one entry per page. */
const pageKey = (href: string) => href.replace(/#.*$/, (h) => (href.startsWith("/experience") || href.startsWith("/achievements") ? h : ""));

/** Pages offered when no written answer is possible: one per page, clean titles and blurbs. */
export function fallbackLinks(chunks: KnowledgeChunk[]): ChatLink[] {
  const out: ChatLink[] = [];
  const seen = new Set<string>();
  for (const c of chunks) {
    const key = pageKey(c.href);
    if (seen.has(key) || c.id === "site-map") continue;
    seen.add(key);
    out.push({ title: c.label, href: c.href, blurb: c.blurb });
    if (out.length === 3) break;
  }
  return out;
}

