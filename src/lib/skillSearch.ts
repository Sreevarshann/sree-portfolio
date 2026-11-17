import { evidence, relatedTopics, skills, skillById, topicById, type RelatedTopic, type Skill, type SkillCategory } from "@/content/skillCatalog";

/**
 * Deterministic skill search over the verified catalog. No network, no model:
 * exact names, aliases (case, spacing and punctuation ignored), partial words,
 * small typos, and usage contexts ("RightRev" lists what was used there).
 *
 * Relationship levels (never blurred):
 *   exact         the query is the skill's canonical name or id
 *   alias         the query is a documented alias ("Postgres" → PostgreSQL)
 *   partial       a word in the name or an alias starts with the query, or a small typo
 *   context       the query names an employer or project; the skill was used there
 *   related       a related topic: a different product with overlapping purpose
 *   transferable  a related topic sharing concepts across tool categories
 * "related" and "transferable" results are never direct experience.
 */
export type MatchLevel = "exact" | "alias" | "partial" | "context";
export type SkillHit = { skill: Skill; level: MatchLevel; matched?: string };
export type TopicHit = { topic: RelatedTopic; via: Skill[] };
export type SearchResult = {
  query: string;
  /** Verified skills matching the query (filtered by category when one is selected). */
  hits: SkillHit[];
  /** Verified matches hidden by the selected category. */
  hiddenByCategory: number;
  /** Related topics (only when the query names something not in the catalog). */
  related: TopicHit[];
  /** True when the query names a technology with a verified exact or alias match. */
  direct: boolean;
  /** True when the query names a known technology that is simply not documented. */
  gap?: boolean;
};

/** Lowercase, punctuation to spaces, collapse spaces. "React.js" → "react js". */
export function norm(s: string) {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/c\+\+/g, "cpp")
    .replace(/c#/g, "csharp")
    .replace(/[^a-z0-9/]+/g, " ")
    .trim();
}
/** Spacing ignored too: "react js" → "reactjs", "power bi" → "powerbi". */
export const compact = (s: string) => norm(s).replace(/[\s/]+/g, "");

/** Levenshtein distance, early exit above `max`. */
function within(a: string, b: string, max: number) {
  if (Math.abs(a.length - b.length) > max) return false;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    let best = i;
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      best = Math.min(best, cur[j]);
    }
    if (best > max) return false;
    prev = cur;
  }
  return prev[b.length] <= max;
}

type Term = { key: string; words: string[]; text: string };
const termsOf = (name: string, aliases: string[], id: string): Term[] =>
  [name, id, ...aliases, name.replace(/\s*\(.*\)\s*/g, " ")].map((t) => ({ key: compact(t), words: norm(t).split(" ").filter(Boolean), text: t }));

const skillTerms = new Map(skills.map((s) => [s.id, termsOf(s.name, s.aliases, s.id)]));
const topicTerms = new Map(relatedTopics.map((t) => [t.id, termsOf(t.name, t.aliases, t.id).filter((x) => x.text !== t.name || !t.name.includes(","))]));

/** Exact (canonical) or alias match for one skill. */
function directLevel(s: Skill, key: string): MatchLevel | null {
  if (key === compact(s.name) || key === compact(s.id) || key === compact(s.name.replace(/\s*\(.*\)\s*/g, " "))) return "exact";
  if (s.aliases.some((a) => compact(a) === key)) return "alias";
  return null;
}

function partialMatch(terms: Term[], q: string, key: string): string | undefined {
  if (key.length < 2) return undefined;
  for (const t of terms) {
    // A word of the term starts with the query ("snow" → Snowflake, "graph" → LangGraph is not a word start).
    if (t.words.some((w) => w.startsWith(q)) || (key.length >= 3 && t.key.startsWith(key))) return t.text;
  }
  // Small typos on longer queries ("snowflak", "postgress", "kubernets").
  const max = key.length >= 8 ? 2 : key.length >= 5 ? 1 : 0;
  if (max) for (const t of terms) if (t.key.length >= 4 && within(key, t.key, max)) return t.text;
  return undefined;
}

/** Topics (non-catalog technologies) named by the query. */
function matchTopics(q: string, key: string, allowPartial: boolean): RelatedTopic[] {
  const out: RelatedTopic[] = [];
  for (const t of relatedTopics) {
    const terms = topicTerms.get(t.id)!;
    const hit = terms.some((x) => x.key === key) || (allowPartial && partialMatch(terms, q, key) !== undefined);
    if (hit) out.push(t);
  }
  return out;
}

export function searchSkills(query: string, category: SkillCategory | "all" = "all"): SearchResult {
  const q = norm(query);
  const key = compact(query);
  const empty: SearchResult = { query, hits: [], hiddenByCategory: 0, related: [], direct: false };
  if (!key) return empty;

  const hits: SkillHit[] = [];
  const seen = new Set<string>();
  const add = (skill: Skill, level: MatchLevel, matched?: string) => {
    if (seen.has(skill.id)) return;
    seen.add(skill.id);
    hits.push({ skill, level, matched });
  };

  for (const s of skills) {
    const lvl = directLevel(s, key);
    if (lvl) add(s, lvl, lvl === "alias" ? s.aliases.find((a) => compact(a) === key) : undefined);
  }
  const direct = hits.length > 0;
  // A technology Sree has not documented, with no related topic ("Java", "Go"):
  // never let it partially match something else ("Java" is not JavaScript).
  if (!direct && GAP_TERMS.some((g) => g.match.test(query.trim()) && compact(g.name).startsWith(key.slice(0, 2)))) return { ...empty, gap: true };

  // A query that names a topic exactly ("Databricks") is answered with the
  // topic, not with loose partial skill matches that would read as a claim.
  const exactTopics = matchTopics(q, key, false);
  if (!exactTopics.length) {
    for (const s of skills) {
      const m = partialMatch(skillTerms.get(s.id)!, q, key);
      if (m) add(s, "partial", m);
    }
  }

  // Usage contexts: "rightrev", "aegis", "flare" → every skill used there.
  if (key.length >= 3) {
    const ctx = Object.entries(evidence).filter(([id, e]) => compact(e.label).startsWith(key) || compact(id).startsWith(key) || compact(e.label).split(/\s/).some((w) => w.startsWith(key)));
    for (const [id] of ctx) for (const s of skills) if (s.uses.some((x) => x.at === id)) add(s, "context", evidence[id].label);
  }

  const topics = direct ? [] : exactTopics.length ? exactTopics : hits.length || key.length < 3 ? [] : matchTopics(q, key, true);
  const related = topics.map((topic) => ({ topic, via: topic.via.map((id) => skillById.get(id)!).filter(Boolean) }));

  const rank: Record<MatchLevel, number> = { exact: 0, alias: 1, partial: 2, context: 3 };
  hits.sort((a, b) => rank[a.level] - rank[b.level]);
  const shown = category === "all" ? hits : hits.filter((h) => h.skill.category === category);
  return { query, hits: shown, hiddenByCategory: hits.length - shown.length, related, direct };
}

/**
 * Catalog skills and related topics a free-text question names, for Sree AI
 * retrieval ("Has he used Databricks?" → the Databricks topic; "Where has he
 * used Postgres?" → PostgreSQL). Whole-word phrase matches only: no partials,
 * no typos, and very short or ambiguous aliases are ignored.
 */
const AMBIGUOUS = new Set(["git", "github", "ai", "ml", "cv", "ts", "js", "py", "pg", "ui", "ci", "cd", "api", "apis", "next", "node", "nest", "rest", "rl", "bi", "hf", "go", "r", "ros", "stats", "auth", "evaluation", "testing", "integrations", "pipelines", "reporting", "analytics", "monitoring", "metrics", "visualization", "dashboard", "dashboards", "streaming", "realtime", "real time", "caching", "embeddings", "evals", "agents", "frontend", "front end", "orchestration", "vertex", "glue", "lambda", "s3", "express", "torch", "vue", "mongo", "dynamo", "nlp", "qa", "e2e", "css", "gpt", "kpi", "kpis", "llm", "llms", "crm", "saas", "jwt", "rls", "sse", "dags", "marts"]);
export function skillsInText(text: string): { skills: string[]; topics: string[] } {
  const hay = ` ${norm(text)} `;
  const found = (t: string) => {
    const n = norm(t);
    if (!n || AMBIGUOUS.has(n) || n.length < 3) return false;
    return hay.includes(` ${n} `);
  };
  const sk: string[] = [];
  for (const s of skills) if ([s.name, s.name.replace(/\s*\(.*\)\s*/g, " "), ...s.aliases].some(found)) sk.push(s.id);
  const tp: string[] = [];
  for (const t of relatedTopics) if (t.aliases.some(found)) tp.push(t.id);
  return { skills: sk, topics: tp };
}

/* ------------------------------------------------------------ job descriptions */
/**
 * Common technologies with no verified usage and no related topic: if a job
 * description names them, they are reported as "not documented".
 */
const GAP_TERMS: { name: string; match: RegExp }[] = [
  { name: "Java", match: /\bjava\b(?!\s*script)/i },
  { name: "Go", match: /\bgolang\b|\bgo\s*(?:lang|programming)\b|^go$/i },
  { name: "C++", match: /c\+\+/i },
  { name: "C#", match: /c#|\.net\b/i },
  { name: "Scala", match: /\bscala\b/i },
  { name: "Rust", match: /\brust\b/i },
  { name: "Ruby", match: /\bruby\b|\brails\b/i },
  { name: "PHP", match: /\bphp\b/i },
  { name: "Kotlin", match: /\bkotlin\b/i },
  { name: "Swift", match: /\bswift\b/i },
  { name: "Terraform", match: /\bterraform\b|\binfrastructure as code\b|\biac\b/i },
  { name: "Ansible", match: /\bansible\b/i },
  { name: "GraphQL", match: /\bgraphql\b/i },
  { name: "Hadoop or Hive", match: /\bhadoop\b|\bhive\b|\bhdfs\b/i },
  { name: "Informatica or SSIS", match: /\binformatica\b|\bssis\b|\btalend\b/i },
  { name: "Fivetran or Airbyte", match: /\bfivetran\b|\bairbyte\b/i },
  { name: "SAS or MATLAB", match: /\bsas\b|\bmatlab\b/i },
  { name: "R", match: /\bR\b(?=\s*(?:,|\/|or|and|programming|language|studio))|^r$/i },
];

export type JdReport = {
  direct: { skill: Skill; term: string }[];
  /** Matched only through a training course or coursework, not applied work. */
  partial: { skill: Skill; term: string }[];
  related: { topic: RelatedTopic; via: Skill[] }[];
  missing: string[];
  questions: string[];
};

/** Maps a pasted job description to verified evidence. Runs in the browser; nothing is stored or sent. */
export function analyzeJobDescription(text: string): JdReport {
  const { skills: skillIds, topics: topicIds } = skillsInText(text);
  // Short aliases are skipped by skillsInText; job descriptions often use them, so check a few safely.
  const extra: [string, RegExp][] = [
    ["ai-agents", /\b(ai|llm)[\s-]agents?\b|\bagentic\b/i],
    ["llm-apps", /\bLLMs?\b|\bgenerative ai\b|\bgenai\b/i],
    ["machine-learning", /\bmachine learning\b|\bML\b/],
    ["nodejs", /\bnode(\.js|js)?\b/i],
    ["rest-apis", /\bREST(ful)?\b|\bAPIs?\b/],
    ["github-actions", /\bCI\s*\/\s*CD\b|\bCI\b/],
    ["testing", /\btesting\b|\bunit tests?\b/i],
    ["frontend", /\bfront[\s-]?end\b/i],
    ["dashboards", /\bdashboards?\b|\bBI\b/],
    ["etl", /\bETL\b|\bELT\b|\bdata pipelines?\b/i],
    ["realtime", /\breal[\s-]?time\b|\bstreaming\b/i],
  ];
  for (const [id, re] of extra) if (re.test(text) && !skillIds.includes(id)) skillIds.push(id);

  const direct: JdReport["direct"] = [];
  const partial: JdReport["partial"] = [];
  for (const id of skillIds) {
    const s = skillById.get(id);
    if (!s) continue;
    const applied = s.uses.some((x) => !["course", "coursework"].includes(evidence[x.at]?.kind));
    (applied ? direct : partial).push({ skill: s, term: s.name });
  }
  const related = topicIds.map((id) => topicById.get(id)!).filter(Boolean).map((topic) => ({ topic, via: topic.via.map((v) => skillById.get(v)!).filter(Boolean) }));
  const missing = GAP_TERMS.filter((g) => g.match.test(text)).map((g) => g.name);

  const questions: string[] = [];
  for (const r of related.slice(0, 2)) questions.push(`How would his ${r.via.slice(0, 2).map((s) => s.name).join(" and ")} work carry over to ${shortName(r.topic)}?`);
  for (const p of partial.slice(0, 1)) questions.push(`What hands-on ${p.skill.name.replace(/\s*\(.*\)/, "")} work has he done beyond the training course?`);
  for (const m of missing.slice(0, 2)) questions.push(`Has he worked with ${m} outside what the portfolio documents?`);
  if (direct.length) questions.push(`Can he walk through a production decision from his ${direct[0].skill.name} work?`);
  return { direct, partial, related, missing, questions: questions.slice(0, 4) };
}

/** "BigQuery, Redshift or Synapse" stays as is; used in generated questions. */
export const shortName = (t: RelatedTopic) => t.name;

/** The question Sree AI is asked when a visitor taps "Ask AI about this". */
export function askQuestionFor(target: { kind: "skill"; skill: Skill } | { kind: "topic"; topic: RelatedTopic; via: Skill[]; asked?: string }) {
  if (target.kind === "skill") {
    const name = target.skill.name.replace(/\s*\(.*\)\s*$/, "");
    const work = target.skill.uses.some((u) => evidence[u.at]?.kind === "work");
    return work ? `How has Sree used ${name} in his professional work?` : `Where has Sree used ${name}, and what did he build with it?`;
  }
  const via = target.via.slice(0, 2).map((s) => s.name.replace(/\s*\(.*\)\s*$/, ""));
  // Name the technology the visitor searched for ("Redshift"), not the topic's group label.
  const asked = target.asked?.trim().slice(0, 40);
  const name = asked && topicById.get(target.topic.id)?.aliases.some((a) => compact(a) === compact(asked)) ? displayCase(asked, target.topic) : target.topic.name.split(/,| or /)[0].trim();
  return `How relevant is Sree's ${via.join(" and ")} experience to ${name}-oriented work?`;
}

/** "redshift" → "Redshift" using the topic's own spelling when it has one. */
function displayCase(asked: string, topic: RelatedTopic) {
  const inName = topic.name.split(/,\s*|\s+or\s+/).find((n) => compact(n) === compact(asked));
  if (inName) return inName;
  return asked.replace(/\b[a-z]/g, (c) => c.toUpperCase());
}
