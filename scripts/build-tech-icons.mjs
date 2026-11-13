/**
 * Regenerates the technology logo assets used by the "Tools & Technologies"
 * marquee. Run from the repo root after installing the icon packages into a
 * scratch directory (they are not runtime or build dependencies):
 *
 *   npm i --prefix /tmp/icons simple-icons@16 devicon@2 @lobehub/icons-static-svg@1
 *   node scripts/build-tech-icons.mjs /tmp/icons/node_modules
 *
 * Sources and licenses (see public/tech/LICENSES.md):
 * - Simple Icons (CC0-1.0): single-path marks → public/tech-icons.svg sprite
 * - LobeHub icons (MIT): OpenAI, AWS, Gemini, Hugging Face, Azure
 * - Devicon (MIT): Microsoft SQL Server, Matplotlib
 * Brand marks remain trademarks of their owners and are shown only to name
 * the tools; none is redrawn or approximated here.
 */
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const mods = process.argv[2];
if (!mods) throw new Error("usage: node scripts/build-tech-icons.mjs <node_modules with icon packages>");
const require = createRequire(path.join(mods, "noop.js"));
const si = require("simple-icons");
const lobe = (f) => fs.readFileSync(path.join(mods, "@lobehub/icons-static-svg/icons", f), "utf8");
const devicon = (f) => fs.readFileSync(path.join(mods, "devicon/icons", f), "utf8");

/** Simple Icons slugs drawn into the sprite (fill = currentColor, colour set in CSS). */
const SIMPLE = [
  "claude", "langchain", "langgraph", "modelcontextprotocol", "ollama", "snowflake",
  "python", "r", "javascript", "typescript", "react", "nextdotjs",
  "apachespark", "apacheairflow", "pandas", "numpy", "duckdb",
  "pytorch", "scikitlearn", "mlflow", "opencv", "yolo",
  "googlebigquery", "postgresql", "mongodb", "supabase",
  "git", "github", "githubactions", "docker", "kubernetes", "fastapi", "pytest", "vercel",
  "plotly",
];

const bySlug = Object.fromEntries(Object.values(si).filter((i) => i && i.slug).map((i) => [i.slug, i]));
const inner = (svg) => svg.replace(/^[\s\S]*?<svg[^>]*>/, "").replace(/<\/svg>\s*$/, "").replace(/<title>[\s\S]*?<\/title>/, "");

const symbols = [];
for (const slug of SIMPLE) {
  const icon = bySlug[slug];
  if (!icon) throw new Error(`Simple Icons has no ${slug}`);
  symbols.push(`<symbol id="${slug}" viewBox="0 0 24 24"><path d="${icon.path}"/></symbol>`);
}
// LobeHub monochrome / two-tone marks: currentColor parts follow the theme ink.
symbols.push(`<symbol id="openai" viewBox="0 0 24 24">${inner(lobe("openai.svg")).replace(/fill="currentColor"/g, "")}</symbol>`);
symbols.push(`<symbol id="aws" viewBox="0 0 24 24">${inner(lobe("aws-color.svg")).replace(/fill="currentColor"/g, "")}</symbol>`);

const outDir = path.join(process.cwd(), "public");
fs.writeFileSync(
  path.join(outDir, "tech-icons.svg"),
  `<svg xmlns="http://www.w3.org/2000/svg">${symbols.join("")}</svg>\n`,
);

// Multicolour marks with gradients stay standalone so their ids never collide.
const standalone = {
  gemini: lobe("gemini-color.svg"),
  huggingface: lobe("huggingface-color.svg"),
  azure: lobe("azure-color.svg"),
  sqlserver: devicon("microsoftsqlserver/microsoftsqlserver-plain.svg"),
  matplotlib: devicon("matplotlib/matplotlib-original.svg"),
};
fs.mkdirSync(path.join(outDir, "tech"), { recursive: true });
for (const [name, svg] of Object.entries(standalone)) {
  const clean = svg
    .replace(/<title>[\s\S]*?<\/title>/, "")
    .replace(/\s(height|width)="1em"/g, "")
    .replace(/\sstyle="[^"]*"/, "");
  fs.writeFileSync(path.join(outDir, "tech", `${name}.svg`), clean.trim() + "\n");
}

// Brand colours for the catalog (light-theme hex from Simple Icons).
const colours = Object.fromEntries(SIMPLE.map((s) => [s, `#${bySlug[s].hex}`]));
console.log(JSON.stringify(colours, null, 2));
console.log(`sprite: ${symbols.length} symbols; standalone: ${Object.keys(standalone).join(", ")}`);
