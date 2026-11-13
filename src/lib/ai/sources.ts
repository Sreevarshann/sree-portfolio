import type { ChatLink, ChatSource } from "./protocol";
import { knowledge, type KnowledgeChunk } from "./knowledge";

/** A project has four chunks on one page; collapse them to one entry per page. */
const pageKey = (href: string) => href.replace(/#.*$/, (h) => (href.startsWith("/experience") || href.startsWith("/achievements") ? h : ""));

/**
 * Sources shown under an answer: the pages it actually linked, in order.
 * If it linked none, the single most relevant retrieved page, so a citation
 * is never attached to a page the answer did not use.
 */
export function citedSources(answer: string, chunks: KnowledgeChunk[]): ChatSource[] {
  const out: ChatSource[] = [];
  const seen = new Set<string>();
  const add = (c: KnowledgeChunk, href = c.href) => {
    const key = pageKey(href);
    if (seen.has(key) || c.id === "site-map") return;
    seen.add(key);
    out.push({ title: c.label, href, section: c.section });
  };
  for (const m of answer.matchAll(/\]\((\/[^)\s]*)\)/g)) {
    const href = m[1];
    const c = knowledge.find((k) => k.href === href) ?? knowledge.find((k) => pageKey(k.href) === pageKey(href));
    if (c) add(c, href);
  }
  if (!out.length && chunks[0] && chunks[0].id !== "profile") add(chunks[0]);
  return out.slice(0, 3);
}

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

