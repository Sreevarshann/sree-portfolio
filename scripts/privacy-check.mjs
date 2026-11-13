#!/usr/bin/env node
/**
 * Fails if anything that looks like a phone number, a tel: link, a secret or
 * a private source file is tracked in the repository or shipped in public/.
 * Uses generic patterns only — the real number is never written here.
 */
import { execSync } from "node:child_process";
import { readFileSync, statSync } from "node:fs";

const files = execSync("git ls-files --cached --others --exclude-standard", { encoding: "utf8" })
  .split("\n")
  .filter(Boolean)
  .filter((f) => !f.startsWith("node_modules/"));

const PHONE = /(?<![\d.])\+?1?[\s.-]?\(?\d{3}\)?[\s.-]\d{3}[\s.-]\d{4}(?![\d])/;
const FAKE_OK = /555[\s.-]0\d{3}/; // fictional numbers used in tests
const SECRET = /(sk-ant-[a-z0-9-]{10,}|ghp_[A-Za-z0-9]{20,}|gho_[A-Za-z0-9]{20,}|AKIA[0-9A-Z]{16})/;
const FORBIDDEN_PATH = /(^|\/)(private|resume-source)|\.env($|\.(?!example))/i;

const problems = [];
for (const f of files) {
  if (FORBIDDEN_PATH.test(f)) problems.push(`${f}: private or environment file is tracked`);
  let st;
  try {
    st = statSync(f);
  } catch {
    continue;
  }
  if (st.size > 5_000_000) continue;
  const buf = readFileSync(f);
  let text = f.endsWith(".pdf") ? buf.toString("latin1") : buf.toString("utf8");
  // SVG geometry (path data, coordinates) is long runs of numbers that can
  // look like phone numbers; drop those attributes but keep text and titles.
  if (f.endsWith(".svg")) text = text.replace(/\s(d|points|viewBox|transform|gradientTransform|x[12]?|y[12]?|cx|cy|r|rx|ry|width|height|offset)="[^"]*"/g, "");
  if (/\btel:/.test(text) && !f.startsWith("scripts/") && !f.startsWith("tests/")) problems.push(`${f}: contains a tel: link`);
  if (/\.(png|jpe?g|webp|avif|ico|pdf|woff2?)$/i.test(f)) continue;
  for (const [i, line] of text.split("\n").entries()) {
    const m = line.match(PHONE);
    if (m && !FAKE_OK.test(m[0])) problems.push(`${f}:${i + 1}: phone-like number "${m[0]}"`);
    if (SECRET.test(line)) problems.push(`${f}:${i + 1}: possible secret`);
  }
}

if (problems.length) {
  console.error("Privacy check failed:\n" + problems.map((p) => "  - " + p).join("\n"));
  process.exit(1);
}
console.log(`Privacy check passed (${files.length} files scanned).`);
