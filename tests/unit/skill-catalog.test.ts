import { describe, expect, it } from "vitest";
import { evidence, relatedTopics, skills, skillById } from "@/content/skillCatalog";
import { skillClusters } from "@/content/skills";
import { technologies } from "@/content/technologies";
import { analyzeJobDescription, askQuestionFor, searchSkills, skillsInText } from "@/lib/skillSearch";

/** V12: one verified skill catalog behind the Skill Explorer and Sree AI. */
describe("verified skill catalog", () => {
  it("names a real evidence context, with what was done, for every usage", () => {
    for (const s of skills) {
      expect(s.uses.length, s.id).toBeGreaterThan(0);
      for (const x of s.uses) {
        expect(evidence[x.at], `${s.id} → ${x.at}`).toBeTruthy();
        expect(x.what.length, `${s.id} @ ${x.at}`).toBeGreaterThan(15);
      }
    }
  });

  it("has unique ids and resolvable related skills", () => {
    expect(new Set(skills.map((s) => s.id)).size).toBe(skills.length);
    for (const s of skills) for (const r of s.related ?? []) expect(skillById.get(r), `${s.id} → ${r}`).toBeTruthy();
    for (const t of relatedTopics) for (const v of t.via) expect(skillById.get(v), `${t.id} → ${v}`).toBeTruthy();
  });

  it("never lists an undocumented technology as a skill", () => {
    const names = skills.flatMap((s) => [s.name, ...s.aliases]).map((n) => n.toLowerCase());
    for (const t of ["databricks", "kubernetes", "pytorch", "tensorflow", "langchain", "mongodb", "bigquery", "java", "terraform"]) expect(names, t).not.toContain(t);
  });

  it("does not attach a related topic's name to any verified skill", () => {
    const aliases = new Set(skills.flatMap((s) => s.aliases.map((a) => a.toLowerCase())));
    for (const t of relatedTopics) for (const a of t.aliases) expect(aliases.has(a.toLowerCase()), `${t.id}: ${a}`).toBe(false);
  });

  it("has no proficiency levels, scores or em dashes", () => {
    const text = JSON.stringify([skills, relatedTopics]);
    expect(text).not.toMatch(/expert|proficien|beginner|advanced|confidence|\b\d+\/10\b/i);
    expect(text).not.toMatch(/[–—]/);
  });

  it("feeds the marquee usage index (technologies derive their contexts from it)", () => {
    for (const t of technologies) for (const id of t.usedIn) expect(skills.some((s) => s.tech?.includes(t.id) && s.uses.some((x) => x.at === id)), `${t.id} → ${id}`).toBe(true);
    expect(technologies.find((t) => t.id === "snowflake")?.usedIn).toEqual(["rightrev"]);
  });

  it("agrees with the About page skills map (every context there is a catalog context)", () => {
    for (const c of skillClusters) for (const s of c.skills) for (const id of s.usedIn) expect(evidence[id], `${s.name} → ${id}`).toBeTruthy();
  });

  it("keeps training separate from applied work", () => {
    expect(skillById.get("aws")!.uses.map((x) => evidence[x.at].kind)).toEqual(["course"]);
  });
});

describe("skill search", () => {
  const top = (q: string) => searchSkills(q).hits[0];

  it.each([
    ["React", "react", "exact"],
    ["dbt", "dbt", "exact"],
    ["Snowflake", "snowflake", "exact"],
    ["Python", "python", "exact"],
    ["PostgreSQL", "postgresql", "exact"],
    ["LangGraph", "langgraph", "exact"],
    ["React.js", "react", "alias"],
    ["DBT", "dbt", "exact"],
    ["Postgres", "postgresql", "alias"],
    ["RAG", "rag", "exact"],
    ["Retrieval-Augmented Generation", "rag", "exact"],
    ["PySpark", "spark", "alias"],
    ["Apache Spark", "spark", "exact"],
    ["Snowflake Cortex", "snowflake-cortex", "exact"],
    ["data pipelines", "etl", "alias"],
    ["AI agents", "ai-agents", "exact"],
    ["power bi", "powerbi", "exact"],
  ])("%s → %s (%s)", (q, id, level) => {
    expect(top(q)?.skill.id).toBe(id);
    expect(top(q)?.level).toBe(level);
    expect(searchSkills(q).direct).toBe(true);
  });

  it("finds partial words and small typos", () => {
    expect(searchSkills("snow").hits.map((h) => h.skill.id)).toContain("snowflake");
    expect(top("postgress")?.skill.id).toBe("postgresql");
    expect(top("postgress")?.level).toBe("partial");
  });

  it("Databricks: related experience only, never a verified match", () => {
    const r = searchSkills("Databricks");
    expect(r.hits).toEqual([]);
    expect(r.direct).toBe(false);
    expect(r.related).toHaveLength(1);
    expect(r.related[0].topic.id).toBe("databricks");
    expect(r.related[0].via.map((s) => s.id)).toEqual(expect.arrayContaining(["snowflake", "spark"]));
    expect(r.related[0].topic.summary).toBe("Looking for Databricks? Sree has worked with Snowflake and Apache Spark in related data engineering workflows.");
    expect(r.related[0].topic.overlap).toMatch(/not documented/);
  });

  it("a missing technology with no relationship is a clean miss", () => {
    for (const q of ["Java", "Go", "zzzz", "Rust"]) {
      const r = searchSkills(q);
      expect(r.hits, q).toEqual([]);
      expect(r.related, q).toEqual([]);
    }
    expect(searchSkills("Java").hits.map((h) => h.skill.id)).not.toContain("javascript");
  });

  it("lists what was used at an employer or project", () => {
    const r = searchSkills("RightRev");
    expect(r.hits.every((h) => h.level === "context")).toBe(true);
    expect(r.hits.map((h) => h.skill.id)).toEqual(expect.arrayContaining(["snowflake", "snowflake-cortex", "mcp", "salesforce"]));
  });

  it("explains matches hidden by a category filter", () => {
    const r = searchSkills("sql", "ai");
    expect(r.hits.find((h) => h.skill.id === "sql")).toBeUndefined();
    expect(r.hiddenByCategory).toBeGreaterThan(0);
    expect(searchSkills("", "data").hits).toEqual([]);
  });

  it("builds hand-off questions from canonical names", () => {
    expect(askQuestionFor({ kind: "skill", skill: skillById.get("snowflake")! })).toBe("How has Sree used Snowflake in his professional work?");
    const db = searchSkills("Databricks").related[0];
    expect(askQuestionFor({ kind: "topic", topic: db.topic, via: db.via, asked: "databricks" })).toBe("How relevant is Sree's Snowflake and Apache Spark experience to Databricks-oriented work?");
  });

  it("finds named skills and topics in free text, ignoring ambiguous words", () => {
    expect(skillsInText("Has he used Databricks or Postgres?")).toEqual({ skills: ["postgresql"], topics: ["databricks"] });
    expect(skillsInText("What is his most impressive GitHub project?")).toEqual({ skills: [], topics: [] });
  });
});

describe("job description mapping", () => {
  const jd = "Senior Data Engineer. Requirements: Python, SQL, Databricks, Airflow, Kafka, dbt, Terraform, Java, AWS, Kubernetes. Experience building LLM agents and CI/CD pipelines.";

  it("separates direct, training-only, related and undocumented requirements", () => {
    const r = analyzeJobDescription(jd);
    expect(r.direct.map((d) => d.skill.id)).toEqual(expect.arrayContaining(["python", "sql", "airflow", "kafka", "dbt", "ai-agents", "github-actions"]));
    expect(r.partial.map((d) => d.skill.id)).toEqual(["aws"]);
    expect(r.related.map((x) => x.topic.id).sort()).toEqual(["databricks", "kubernetes"]);
    expect(r.missing).toEqual(["Java", "Terraform"]);
    expect(r.direct.map((d) => d.skill.id)).not.toContain("javascript");
  });

  it("offers interview questions and never a score", () => {
    const r = analyzeJobDescription(jd);
    expect(r.questions.length).toBeGreaterThan(0);
    expect(JSON.stringify(r.questions)).not.toMatch(/\d+\s?%|score|rating/i);
  });

  it("handles text with no recognisable requirements", () => {
    const r = analyzeJobDescription("We are a friendly team that values kindness.");
    expect([r.direct, r.partial, r.related, r.missing].every((x) => x.length === 0)).toBe(true);
  });
});
