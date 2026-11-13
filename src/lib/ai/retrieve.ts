import { knowledge, type KnowledgeChunk } from "./knowledge";
import { analyze, NAME_TOKENS, type Analysis, type Entity, type Intent } from "./intent";

/**
 * Intent-aware retrieval over the portfolio knowledge base.
 *
 * 1. `analyze` recognises the question type and any named entity
 *    (RightRev, AEGIS AI, the Singapore AUV Challenge, Northeastern...).
 * 2. Authoritative records for that intent are pinned first (the profile for
 *    "who is", experience records for work questions, the certification list
 *    for certificates...).
 * 3. BM25 with synonym expansion fills the remaining slots, boosted toward
 *    the intent's section and away from unrelated ones.
 * Follow-ups without a named topic inherit the previous turn's entities.
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
  education: ["university", "northeastern", "anna", "sairam", "college", "gpa"],
  undergrad: ["sairam", "college", "anna", "bachelor"],
  bachelor: ["sairam", "anna", "college"],
  college: ["sairam", "anna", "university"],
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
  built: ["projects", "project"],
  build: ["projects", "project"],
  why: ["experience", "values", "skills"],
  ai: ["agents", "llm", "rag"],
  agent: ["agents"],
  studying: ["degree", "university"],
  study: ["degree", "university"],
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
const byId = new Map(knowledge.map((c) => [c.id, c]));

function expand(tokens: string[]) {
  const out = new Map<string, number>();
  for (const t of tokens) {
    if (NAME_TOKENS.has(t)) continue; // the subject's name matches every chunk
    out.set(t, Math.max(out.get(t) ?? 0, 1));
    for (const s of SYNONYMS[t] ?? []) out.set(stem(s), Math.max(out.get(stem(s)) ?? 0, 0.5));
  }
  return out;
}

function bm25(query: string) {
  const q = expand(tokenize(query));
  const N = docs.length;
  const k1 = 1.4;
  const b = 0.72;
  return docs.map((d) => {
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
}

/** Sections each intent should draw from. */
const INTENT_SECTIONS: Record<Intent, string[]> = {
  identity: ["About"],
  experience: ["Experience"],
  project: ["Projects"],
  achievement: ["Achievements"],
  certification: ["Certifications"],
  education: ["Education"],
  skills: ["Skills", "About", "Experience", "Projects"],
  contact: ["Contact"],
  fit: ["About", "Experience", "Projects"],
  assistant: ["About", "Site"],
  general: [],
};

/** Authoritative records pinned to the top for each intent (when no specific entity is named). */
function pinnedFor(intent: Intent): string[] {
  const ids = (prefix: string, suffix = "") => knowledge.filter((c) => c.id.startsWith(prefix) && c.id.endsWith(suffix)).map((c) => c.id);
  switch (intent) {
    case "identity":
      return ["profile", "exp-rightrev", "edu-Northeastern University"];
    case "experience":
      return ids("exp-");
    case "project":
      return ids("proj-", "-overview");
    case "achievement":
      return ids("ach-");
    case "certification":
      return ["certifications"];
    case "education":
      return ids("edu-");
    case "skills":
      return ["tech-usage", ...ids("skills-")];
    case "contact":
      return ["contact"];
    case "fit":
      return ["profile", "exp-rightrev", "skills-ai", "skills-data"];
    case "assistant":
      return ["profile", "site-map"];
    default:
      return [];
  }
}

/** Chunks an entity owns: every chunk whose id starts with the entity id (projects have four). */
function entityChunks(e: Entity, focus: string) {
  const owned = knowledge.filter((c) => c.id === e.id || c.id.startsWith(`${e.id}-`));
  if (owned.length <= 1) return owned.map((c) => c.id);
  // Order a project's chunks by what the question asks about.
  const f = focus.toLowerCase();
  const rank = (id: string) =>
    id.endsWith("-overview") ? 0
    : /test|result|metric|accura|stack|technolog|perform|benchmark/.test(f) && id.endsWith("-results") ? -1
    : /architect|design|how does|how is|decision|challenge|work\b/.test(f) && id.endsWith("-engineering") ? -1
    : /feature|roadmap|plan|next|future/.test(f) && id.endsWith("-features") ? -1
    : 1;
  return owned.map((c) => c.id).sort((a, b) => rank(a) - rank(b));
}

export type RetrievalResult = { chunks: KnowledgeChunk[]; analysis: Analysis };

export function retrieveWithAnalysis(question: string, k = 6, inherited?: Analysis): RetrievalResult {
  const own = analyze(question);
  const useInherited = !!inherited && own.followUp && inherited.entities.length > 0;
  const analysis: Analysis = useInherited
    ? {
        ...own,
        entities: inherited.entities,
        intents: own.intents[0] === "general" ? inherited.intents : own.intents,
      }
    : own;

  const primary = analysis.intents[0];
  const wantSections = new Set(analysis.intents.flatMap((i) => INTENT_SECTIONS[i]));
  const asksResume = analysis.entities.some((e) => e.kind === "resume");
  const genericProjects = !analysis.entities.length && analysis.intents.includes("project");
  const limit = genericProjects ? Math.max(k, 8) : k;

  const ordered: string[] = [];
  const push = (id: string) => {
    if (byId.has(id) && !ordered.includes(id)) ordered.push(id);
  };
  // Named entities first: they are the subject of the question.
  for (const e of analysis.entities) entityChunks(e, question).forEach(push);
  if (!analysis.entities.length) (primary === "general" ? ["profile"] : pinnedFor(primary)).forEach(push);
  // Secondary intents get their single most authoritative record.
  for (const i of analysis.intents.slice(1)) pinnedFor(i).slice(0, i === "skills" ? 2 : 1).forEach(push);

  const scored = bm25(useInherited ? `${question} ${analysis.entities.map((e) => e.label).join(" ")}` : question)
    .map(({ chunk, score }) => {
      let s = score;
      if (wantSections.size) s *= wantSections.has(chunk.section) ? 1.6 : 0.6;
      if (chunk.id === "resume-event-processing" && !asksResume) s = 0;
      if (chunk.id === "contact" && !analysis.intents.includes("contact")) s = 0;
      if (chunk.id === "site-map" && primary !== "assistant" && primary !== "general") s = 0;
      return { chunk, score: s };
    })
    .filter((s) => s.score > 0.8)
    .sort((a, b) => b.score - a.score);
  for (const s of scored) {
    if (ordered.length >= limit) break;
    push(s.chunk.id);
  }

  // Always give the model the profile so it can introduce Sree correctly.
  let ids = ordered.slice(0, limit);
  if (!ids.includes("profile")) ids = [...ids.slice(0, limit - 1), "profile"];
  if (primary === "general" && !analysis.entities.length && scored.length === 0 && !ids.includes("site-map")) ids.push("site-map");
  return { chunks: ids.map((id) => byId.get(id)!), analysis };
}

export function retrieve(query: string, k = 6): KnowledgeChunk[] {
  return retrieveWithAnalysis(query, k).chunks;
}

export type Turn = { role: "user" | "assistant"; content: string };

/** Entities named by a previous answer (via its links) help resolve "how does it work?". */
function entitiesFromAnswer(text: string): Entity[] {
  const out: Entity[] = [];
  for (const m of text.matchAll(/\]\((\/[a-z]+[^)\s]*)\)/g)) {
    const href = m[1];
    const chunk = knowledge.find((c) => c.href === href && c.id !== "site-map");
    if (!chunk) continue;
    const base = chunk.id.replace(/-(overview|features|engineering|results)$/, "");
    const a = analyze(chunk.title.split(" - ")[0]);
    const e = a.entities.find((x) => x.id === base);
    if (e && !out.find((x) => x.id === e.id)) out.push(e);
  }
  return out;
}

/**
 * Retrieval for a conversation: the latest question decides, and a follow-up
 * without a named topic ("what stack did he use there?") inherits the
 * entities of the most recent turn that had one.
 */
export function retrieveConversation(history: Turn[], k = 6): RetrievalResult {
  const userTurns = history.filter((m) => m.role === "user");
  const latest = userTurns[userTurns.length - 1]?.content ?? "";
  let inherited: Analysis | undefined;
  // Walk back one exchange at a time: the user's own words win over the
  // topic an answer happened to link (first link only).
  const prior = history.slice(0, -1);
  for (let i = prior.length - 1; i >= 0 && !inherited; i--) {
    if (prior[i].role !== "user") continue;
    const asked = analyze(prior[i].content);
    if (asked.entities.length) {
      inherited = asked;
      break;
    }
    const answer = prior[i + 1]?.role === "assistant" ? entitiesFromAnswer(prior[i + 1].content).slice(0, 1) : [];
    if (answer.length) inherited = { ...asked, entities: answer };
  }
  return retrieveWithAnalysis(latest, k, inherited);
}

/** Back-compatible helper used by older callers and tests: user turns only. */
export function retrieveForConversation(userTurns: string[], k = 6): KnowledgeChunk[] {
  return retrieveConversation(userTurns.map((content) => ({ role: "user", content })), k).chunks;
}
