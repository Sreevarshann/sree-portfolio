/**
 * Cleans model (or legacy) Markdown before it is rendered:
 * - `name@x.com (mailto:name@x.com)` and bare `mailto:` text become one email link
 * - a URL repeated right after a link to the same URL is dropped
 * - `•` / `*` bullets and `1)` numbering become standard Markdown lists
 * - raw HTML tags are stripped (the renderer also skips HTML)
 * - runs of blank lines collapse
 * Code spans and fenced blocks are left untouched.
 */
const EMAIL = "[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}";

function cleanProse(s: string) {
  return (
    s
      // `[text](mailto:a) (mailto:a)` or `[text](url) (url)` → keep the link once
      .replace(/(\[[^\]]+\]\(([^)\s]+)\))\s*\((?:mailto:)?\2\)/g, "$1")
      .replace(new RegExp(`(\\[[^\\]]+\\]\\(mailto:(${EMAIL})\\))\\s*\\((?:mailto:)?\\2\\)`, "g"), "$1")
      // `a@b.com (mailto:a@b.com)` → `[a@b.com](mailto:a@b.com)`
      .replace(new RegExp(`(?<![\\[(:/\\w])(${EMAIL})\\s*\\(mailto:\\1\\)`, "g"), "[$1](mailto:$1)")
      // bare `mailto:a@b.com` outside a link → link
      .replace(new RegExp(`(?<![(\\[\\w])mailto:(${EMAIL})`, "g"), "[$1](mailto:$1)")
      // `[url](url) (url)` style duplicates where the text is the URL
      .replace(/(\[(https?:\/\/[^\]\s]+)\]\(\2\))\s*\(\2\)/g, "$1")
      // `[label](url) - url` trailing echo (em dash, en dash or hyphen)
      .replace(/(\[[^\]]+\]\((https?:\/\/[^)\s]+)\))\s*[\u2014\u2013-]\s*\2(?=[\s.,;]|$)/g, "$1")
      // em/en dashes become plain hyphens (after the echo rule above)
      .replace(/[ \t]*\u2014[ \t]*/g, " - ")
      .replace(/[ \t]+\u2013[ \t]+/g, " - ")
      .replace(/\u2013/g, "-")
      // raw HTML tags (keep `<` used in prose such as "p < 0.05")
      .replace(/<\/?[A-Za-z][A-Za-z0-9-]*(\s[^<>]*)?\/?>/g, "")
  );
}

export function normalizeMarkdown(input: string): string {
  const text = input.replace(/\r\n?/g, "\n");
  const lines = text.split("\n");
  const out: string[] = [];
  let fenced = false;
  for (const raw of lines) {
    if (/^\s*(```|~~~)/.test(raw)) {
      fenced = !fenced;
      out.push(raw);
      continue;
    }
    if (fenced) {
      out.push(raw);
      continue;
    }
    let line = raw
      .replace(/^(\s*)[•●▪◦]\s+/, "$1- ")
      .replace(/^(\s*)(\d+)\)\s+/, "$1$2. ");
    // Protect inline code spans while cleaning prose.
    const parts = line.split(/(`[^`]*`)/);
    line = parts.map((p, i) => (i % 2 ? p : cleanProse(p))).join("");
    out.push(line);
  }
  return out.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}
