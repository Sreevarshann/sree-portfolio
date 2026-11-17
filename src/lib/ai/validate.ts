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
export type Finding = { kind: "term" | "number" | "vague" | "commitment"; value: string };

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

/**
 * Statements Sree AI must never send, whatever the context: guarantees,
 * commitments on Sree's behalf, money, literal superlatives and immigration
 * claims. Proportionate on purpose: humour and clearly qualified statements
 * ("his dance moves are unverified", "he's worth interviewing") pass.
 */
export const COMMITMENTS: RegExp[] = [
  /\bguarantee[sd]?\b/i,
  /\bhe(?: will|'ll| would)(?: definitely| certainly| surely)? (?:accept|join|relocate|move|start|deliver|finish|be available)\b/i,
  /\b(?:he is|he's) (?:available|free) (?:to start|immediately|right away|from|starting)\b/i,
  /\b(?:ready|able|free|set) to (?:join|start|begin)\b/i,
  /\b(?:join|start|begin)\w*\b[^.!?]{0,30}\b(?:right away|immediately|asap|tomorrow|next week)\b/i,
  /\b(?:can|could) start\b/i,
  /\$\s?\d|\b\d{2,3}\s?k\b|\b(?:USD|per (?:year|hour|annum))\b/i,
  /\b(?:best|smartest|greatest|top) (?:engineer|developer|programmer|candidate|data scientist|ai engineer)s? (?:in|of) (?:the )?(?:world|country|industry|planet)\b/i,
  /\bgenius\b/i,
  // Team results: a contribution is never upgraded to leadership.
  /\b(?:led|leading|leads|headed|heading|captained|captaining|captain of)\b[^.!?]{0,25}\bteam\b/i,
  /\b(?:he is|he's|he has|he holds|he's got)(?: a| an| on| on an?)? (?:u\.?s\.? citizen|green card|permanent resident|h-?1b|(?:stem )?opt\b|f-?1)/i,
  /\b(?:does not|doesn't|will not|won't|does|will|would) (?:need|require) (?:visa )?sponsorship\b/i,
];

/** The first commitment pattern a sentence matches, if any. */
export function commitmentIn(sentence: string): string | null {
  for (const re of COMMITMENTS) {
    const m = stripCitationMarkers(sentence).match(re);
    if (m) return m[0];
  }
  return null;
}

/**
 * Streams text through sentence by sentence, dropping any complete sentence
 * that matches COMMITMENTS. Holds back only the current unfinished sentence.
 */
export function createCommitmentGate(onDrop?: (sentence: string, match: string) => void) {
  let buf = "";
  const check = (part: string) =>
    part
      .split(/(?<=[.!?](?:\s+|$)|\n)/)
      .map((sentence) => {
        const hit = commitmentIn(sentence);
        if (!hit) return sentence;
        onDrop?.(sentence, hit);
        return sentence.match(/^\s*/)![0]; // keep the spacing before the next sentence
      })
      .join("");
  return {
    push(text: string) {
      buf += text;
      const ends = [...buf.matchAll(/[.!?](?=\s)|\n/g)];
      if (!ends.length) return "";
      const cut = ends[ends.length - 1].index! + 1;
      const done = buf.slice(0, cut);
      buf = buf.slice(cut);
      return check(done);
    },
    flush() {
      const rest = buf;
      buf = "";
      return rest ? check(rest) : "";
    },
  };
}

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
  for (const sentence of text.split(/(?<=[.!?])\s+|\n/)) {
    const hit = commitmentIn(sentence);
    if (hit) out.push({ kind: "commitment", value: hit });
  }
  for (const re of VAGUE) {
    const m = text.match(re);
    if (m) out.push({ kind: "vague", value: m[0] });
  }
  return out;
}
