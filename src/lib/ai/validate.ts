import { technologies } from "@/content/technologies";
import { experience } from "@/content/experience";
import { projects } from "@/content/projects";
import { achievements } from "@/content/credentials";
import { stripCitationMarkers } from "./citations";
import { factsOf, type KnowledgeChunk } from "./knowledge";

/**
 * Deterministic claim check: flags named technologies, companies, products
 * and figures in an answer that the context it was grounded on does not
 * contain, plus vague padding ("and other services"). It never rewrites the
 * answer; the route logs findings and the tests and live evaluation assert on
 * them.
 */
export type Finding = { kind: "term" | "number" | "vague"; value: string };

const WATCHLIST = [
  "Salesforce", "Kubernetes", "AWS", "Azure", "GCP", "Google Cloud", "Kafka", "Airflow", "Spark", "Tableau", "Power BI",
  "Django", "Flask", "Terraform", "Java", "Golang", "Rust", "C++", "TensorFlow", "PyTorch", "Hadoop", "dbt", "Looker",
  "Databricks", "BigQuery", "Redshift", "MongoDB", "Supabase", "GraphQL", "Kotlin", "Swift", "Angular", "Vue", "Node.js",
  "Express", "Spring", "Elasticsearch", "Redis", "Snowflake", "Cortex", "MCP", "OAuth", "RBAC", "LangChain", "LlamaIndex",
  "OpenAI", "Gemini", "Claude", "Hugging Face", "Ollama", "LangGraph", "FastAPI", "Docker", "PostgreSQL", "React", "Next.js",
  "TypeScript", "JavaScript", "Python", "SQL", "R", "Google", "Microsoft", "Amazon", "Meta", "Netflix",
];

const split = (s: string) => s.split(/\s*[·(),/]\s*/).map((x) => x.trim()).filter((x) => x.length > 1 || x === "R");
const VOCAB = [
  ...new Set([
    ...WATCHLIST,
    ...technologies.flatMap((t) => split(t.name)),
    ...experience.flatMap((e) => [e.company, ...e.stack]),
    ...projects.map((p) => p.name),
    ...achievements.flatMap((a) => a.stack),
  ]),
].filter((t) => t.length >= 2 || t === "R");

const VAGUE = [
  /\band (?:other|various|several|many) (?:services|tools|technologies|systems|platforms|integrations|apis)\b/i,
  /\bvarious (?:services|tools|technologies|systems|platforms)\b/i,
  /\b(?:and )?(?:much|many) more\b/i,
  /\betc\.?(?=\s|$)/i,
  /\bamong others\b/i,
  /\bstandard (?:web )?technologies\b/i,
];

const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const has = (hay: string, term: string) => new RegExp(`(?<![A-Za-z0-9])${esc(term)}(?![A-Za-z0-9])`, term === "R" ? "" : "i").test(hay);

/** Marks facts that state a tool was NOT used; they cannot support a claim of use. */
export const NO_USAGE = "no documented work or project usage";

/** The text claims are checked against: every grounding fact except statements of non-use. */
export function groundingText(chunks: KnowledgeChunk[]) {
  return chunks.flatMap(factsOf).filter((f) => !f.includes(NO_USAGE)).join("\n");
}

export function unsupportedClaims(answer: string, context: string): Finding[] {
  const text = stripCitationMarkers(answer);
  const out: Finding[] = [];
  for (const term of VOCAB) if (has(text, term) && !has(context, term)) out.push({ kind: "term", value: term });
  for (const m of text.matchAll(/(?<![\w.])(\d[\d,.]*\s?(?:%|\+|K\b|k\b|M\b)?)/g)) {
    const raw = m[1].trim().replace(/[.,]$/, "");
    if (!/[%+KkM]/.test(raw) && raw.replace(/\D/g, "").length < 2) continue; // small counts and list numbers
    if (/^(19|20)\d\d$/.test(raw)) {
      if (!context.includes(raw)) out.push({ kind: "number", value: raw });
      continue;
    }
    if (!context.replace(/,/g, "").includes(raw.replace(/,/g, "").replace(/\s/g, ""))) out.push({ kind: "number", value: raw });
  }
  for (const re of VAGUE) {
    const m = text.match(re);
    if (m) out.push({ kind: "vague", value: m[0] });
  }
  return out;
}
