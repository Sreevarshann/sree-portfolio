import { knowledge, type KnowledgeChunk } from "./knowledge";

/**
 * Lightweight BM25 retrieval over the portfolio knowledge base. The corpus is
 * small (~50 chunks), so an in-memory lexical index with synonym expansion is
 * fast, deterministic and needs no vector database.
 */
const STOP = new Set(
  "a an the and or of to in on for with at by from is are was were be been it its as that this what which who whom how why when where does do did has have had his he him her she they them their about can could would should tell me i you your please any some more most into than then there here also just".split(" "),
);

const SYNONYMS: Record<string, string[]> = {
  rightrev: ["snowflake", "cortex", "agents", "mcp"],
  snowflake: ["cortex", "rightrev"],
  auv: ["singapore", "underwater", "sauvc", "ros"],
  sauvc: ["singapore", "auv"],
  underwater: ["auv", "singapore"],
  mlops: ["charlie", "mbta", "expo"],
  charlie: ["mbta", "mlops", "expo"],
  mbta: ["charlie", "transit"],
  contact: ["email", "linkedin", "reach"],
  email: ["contact"],
  reach: ["contact", "email"],
  hire: ["fit", "role", "experience"],
  fit: ["experience", "skills", "projects"],
  certification: ["certificate", "certifications", "aws", "google", "cisco"],
  certifications: ["certificate", "aws", "google", "cisco"],
  cert: ["certifications"],
  school: ["education", "university"],
  degree: ["education", "university", "gpa"],
  education: ["university", "northeastern", "anna", "gpa"],
  fraud: ["aegis"],
  aegis: ["fraud", "streaming"],
  nexus: ["agents", "mission"],
  rag: ["retrieval", "sourceatlas", "citations"],
  retrieval: ["rag", "sourceatlas"],
  finetuning: ["tunelab", "lora"],
  fine: ["tunelab", "lora"],
  lora: ["tunelab"],
  data: ["etl", "pipeline", "sql"],
  pipeline: ["etl", "data"],
  python: ["etl", "fastapi", "pyspark"],
  skills: ["skill", "technologies"],
  projects: ["project", "built"],
  recent: ["projects", "2026"],
  built: ["projects", "project", "aegis", "nexus", "sourceatlas"],
  build: ["projects", "project"],
  why: ["experience", "values", "skills"],
  ai: ["agents", "llm", "rag"],
  agent: ["agents"],
};

function stem(t: string) {
  if (t.length > 4 && t.endsWith("ies")) return t.slice(0, -3) + "y";
  if (t.length > 4 && t.endsWith("ing")) return t.slice(0, -3);
  if (t.length > 3 && t.endsWith("s") && !t.endsWith("ss")) return t.slice(0, -1);
  return t;
}

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9+#.\s-]/g, " ")
    .split(/[\s.-]+/)
    .filter((t) => t.length > 1 && !STOP.has(t))
    .map(stem);
}

type Indexed = { chunk: KnowledgeChunk; tf: Map<string, number>; len: number };
const docs: Indexed[] = knowledge.map((chunk) => {
  const toks = tokenize(`${chunk.title} ${chunk.title} ${chunk.text}`);
  const tf = new Map<string, number>();
  toks.forEach((t) => tf.set(t, (tf.get(t) ?? 0) + 1));
  return { chunk, tf, len: toks.length };
});
const avgLen = docs.reduce((s, d) => s + d.len, 0) / docs.length;
const df = new Map<string, number>();
docs.forEach((d) => d.tf.forEach((_, t) => df.set(t, (df.get(t) ?? 0) + 1)));

function expand(tokens: string[]) {
  const out = new Map<string, number>();
  for (const t of tokens) {
    out.set(t, Math.max(out.get(t) ?? 0, 1));
    for (const s of SYNONYMS[t] ?? []) out.set(stem(s), Math.max(out.get(stem(s)) ?? 0, 0.5));
  }
  return out;
}

export function retrieve(query: string, k = 6): KnowledgeChunk[] {
  const q = expand(tokenize(query));
  const N = docs.length;
  const k1 = 1.4;
  const b = 0.72;
  const scored = docs.map((d) => {
    let score = 0;
    q.forEach((w, t) => {
      const f = d.tf.get(t);
      if (!f) return;
      const n = df.get(t) ?? 0;
      const idf = Math.log(1 + (N - n + 0.5) / (n + 0.5));
      score += w * idf * ((f * (k1 + 1)) / (f + k1 * (1 - b + (b * d.len) / avgLen)));
    });
    return { chunk: d.chunk, score };
  });
  return scored
    .filter((s) => s.score > 0.5)
    .sort((a, b) => b.score - a.score)
    .slice(0, k)
    .map((s) => s.chunk);
}

/** Retrieval for a conversation: the latest question, weighted, plus the prior user turn for follow-ups. */
export function retrieveForConversation(userTurns: string[], k = 6): KnowledgeChunk[] {
  const latest = userTurns[userTurns.length - 1] ?? "";
  const prior = userTurns.slice(-2, -1).join(" ");
  const primary = retrieve(latest, k);
  if (primary.length >= 3 || !prior) return ensureProfile(primary, k);
  const merged = [...primary];
  for (const c of retrieve(`${latest} ${prior}`, k)) if (!merged.find((m) => m.id === c.id)) merged.push(c);
  return ensureProfile(merged.slice(0, k), k);
}

function ensureProfile(list: KnowledgeChunk[], k: number) {
  if (list.find((c) => c.id === "profile")) return list;
  const profileChunk = knowledge.find((c) => c.id === "profile")!;
  return [...list.slice(0, k - 1), profileChunk];
}
