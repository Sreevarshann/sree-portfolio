import { evidence as catalogEvidence, usageForTech } from "./skillCatalog";

/**
 * Technologies shown in the "Tools & Technologies" marquee and in the
 * "Where I've Used These Technologies" index.
 *
 * Each entry names where it was used: a role, a project with a public
 * repository, this site, coursework named in the education record, or a
 * course whose title names the tool. Nothing is inferred from a course's
 * typical curriculum.
 * Nothing is attributed without a source. No proficiency levels.
 *
 * Logos: `sprite` ids are symbols in public/tech-icons.svg (drawn in
 * currentColor), `file` entries are standalone multicolour SVGs in
 * public/tech/, and `text` entries are typographic tiles for tools without a
 * licensed mark. See scripts/build-tech-icons.mjs and public/tech/LICENSES.md.
 */
export type TechLogo =
  /** `ink` = draw in the theme's text colour (black marks that vanish on dark). */
  /** `backdrop` fills the mark's cut-out shapes (the JavaScript logo's letters are black on yellow). */
  | { kind: "sprite"; id: string; color: string | "ink"; darkColor?: string | "ink"; backdrop?: string }
  | { kind: "file"; src: string }
  | { kind: "text"; mark: string };

export type TechCategory = "AI & agents" | "Languages & frontend" | "Data engineering" | "Machine learning" | "Cloud & databases" | "DevOps & engineering" | "Visualization";

export type Tech = {
  id: string;
  name: string;
  category: TechCategory;
  logo: TechLogo;
  /**
   * Where it was used: keys of `evidence`, derived from the verified skill
   * catalog (src/content/skillCatalog.ts). Empty means no verified usage:
   * shown in the marquee only.
   */
  usedIn: string[];
  note?: string;
};

/** Usage contexts (shared with the skill catalog, the single source of truth). */
export const evidence: Record<string, { label: string; href: string }> = catalogEvidence;

const s = (id: string, color: string | "ink", darkColor?: string | "ink", backdrop?: string): TechLogo => ({ kind: "sprite", id, color, darkColor, backdrop });
const f = (name: string): TechLogo => ({ kind: "file", src: `/tech/${name}.svg` });
const t = (mark: string): TechLogo => ({ kind: "text", mark });

const raw: Omit<Tech, "usedIn">[] = [
  // AI & agents
  { id: "claude", name: "Claude", category: "AI & agents", logo: s("claude", "#D97757"), note: "A configurable model provider for Sree AI on this site." },
  { id: "openai", name: "OpenAI", category: "AI & agents", logo: s("openai", "ink"), note: "GPT-powered RAG assistant in Charlie; OpenAI-compatible provider adapter in SourceAtlas." },
  { id: "gemini", name: "Gemini", category: "AI & agents", logo: f("gemini") },
  { id: "huggingface", name: "Hugging Face", category: "AI & agents", logo: f("huggingface"), note: "TuneLab pulls its pinned base model from the Hugging Face Hub." },
  { id: "langchain", name: "LangChain", category: "AI & agents", logo: s("langchain", "#1C3C3C", "#7FC8FF") },
  { id: "langgraph", name: "LangGraph", category: "AI & agents", logo: s("langgraph", "#1C3C3C", "#7FC8FF") },
  { id: "rag", name: "RAG", category: "AI & agents", logo: t("RAG"), note: "Retrieval-augmented generation." },
  { id: "mcp", name: "Model Context Protocol", category: "AI & agents", logo: s("modelcontextprotocol", "ink") },
  { id: "cortex", name: "Snowflake Cortex", category: "AI & agents", logo: s("snowflake", "#29B5E8") },
  { id: "ollama", name: "Ollama", category: "AI & agents", logo: s("ollama", "ink") },

  // Languages & frontend
  { id: "python", name: "Python", category: "Languages & frontend", logo: s("python", "#3776AB", "#5B9BD5") },
  { id: "sql", name: "SQL", category: "Languages & frontend", logo: f("sql") },
  { id: "r", name: "R", category: "Languages & frontend", logo: s("r", "#276DC3", "#5B9BD5") },
  { id: "javascript", name: "JavaScript", category: "Languages & frontend", logo: s("javascript", "#F7DF1E", "#F7DF1E", "#000") },
  { id: "typescript", name: "TypeScript", category: "Languages & frontend", logo: s("typescript", "#3178C6", "#4B9BE8") },
  { id: "react", name: "React", category: "Languages & frontend", logo: s("react", "#149ECA", "#61DAFB") },
  { id: "nextjs", name: "Next.js", category: "Languages & frontend", logo: s("nextdotjs", "ink") },

  // Machine learning
  { id: "pytorch", name: "PyTorch", category: "Machine learning", logo: s("pytorch", "#EE4C2C") },
  { id: "scikit-learn", name: "scikit-learn", category: "Machine learning", logo: s("scikitlearn", "#F7931E") },
  { id: "mlflow", name: "MLflow", category: "Machine learning", logo: s("mlflow", "#0194E2") },
  { id: "opencv", name: "OpenCV", category: "Machine learning", logo: s("opencv", "#5C3EE8", "#8E7BFF") },
  { id: "yolov5", name: "YOLOv5", category: "Machine learning", logo: s("yolo", "#111F68", "ink") },

  // Data engineering
  { id: "spark", name: "Apache Spark · PySpark", category: "Data engineering", logo: s("apachespark", "#E25A1C") },
  { id: "airflow", name: "Apache Airflow", category: "Data engineering", logo: s("apacheairflow", "#017CEE", "#3C9BF0") },
  { id: "dbt", name: "dbt", category: "Data engineering", logo: f("dbt") },
  { id: "snowflake", name: "Snowflake", category: "Data engineering", logo: s("snowflake", "#29B5E8") },
  { id: "pandas", name: "pandas", category: "Data engineering", logo: s("pandas", "#150458", "ink") },
  { id: "numpy", name: "NumPy", category: "Data engineering", logo: s("numpy", "#013243", "#4DABCF") },
  { id: "duckdb", name: "DuckDB", category: "Data engineering", logo: s("duckdb", "ink", "#FFF000") },

  // Cloud & databases
  { id: "aws", name: "AWS", category: "Cloud & databases", logo: s("aws", "ink") },
  { id: "azure", name: "Microsoft Azure · Azure ML", category: "Cloud & databases", logo: f("azure") },
  { id: "bigquery", name: "Google BigQuery", category: "Cloud & databases", logo: s("googlebigquery", "#4285F4", "#669DF6") },
  { id: "postgresql", name: "PostgreSQL", category: "Cloud & databases", logo: s("postgresql", "#4169E1", "#6E8EF0") },
  { id: "sqlserver", name: "SQL Server", category: "Cloud & databases", logo: f("sqlserver") },
  { id: "mongodb", name: "MongoDB", category: "Cloud & databases", logo: s("mongodb", "#47A248") },
  { id: "supabase", name: "Supabase", category: "Cloud & databases", logo: s("supabase", "#3ECF8E") },

  // DevOps & engineering
  { id: "git", name: "Git", category: "DevOps & engineering", logo: s("git", "#F05032") },
  { id: "github", name: "GitHub", category: "DevOps & engineering", logo: s("github", "ink") },
  { id: "github-actions", name: "GitHub Actions", category: "DevOps & engineering", logo: s("githubactions", "#2088FF") },
  { id: "docker", name: "Docker", category: "DevOps & engineering", logo: s("docker", "#2496ED") },
  { id: "kubernetes", name: "Kubernetes", category: "DevOps & engineering", logo: s("kubernetes", "#326CE5", "#5A8DF0") },
  { id: "fastapi", name: "FastAPI", category: "DevOps & engineering", logo: s("fastapi", "#009688", "#26B5A6") },
  { id: "pytest", name: "pytest", category: "DevOps & engineering", logo: s("pytest", "#0A9EDC") },
  { id: "vercel", name: "Vercel", category: "DevOps & engineering", logo: s("vercel", "ink") },

  // Visualization
  { id: "plotly", name: "Plotly", category: "Visualization", logo: s("plotly", "#3F4F75", "#9A97FF") },
  { id: "powerbi", name: "Power BI", category: "Visualization", logo: f("powerbi") },
  { id: "tableau", name: "Tableau", category: "Visualization", logo: f("tableau") },
  { id: "matplotlib", name: "Matplotlib", category: "Visualization", logo: f("matplotlib") },
];

export const technologies: Tech[] = raw.map((t) => ({ ...t, usedIn: usageForTech(t.id) }));

/** Marquee rows: models and code move left; data and delivery move right. */
export const techRows: { id: string; label: string; categories: TechCategory[]; direction: "left" | "right" }[] = [
  { id: "build", label: "AI, machine learning and languages", categories: ["AI & agents", "Machine learning", "Languages & frontend"], direction: "left" },
  { id: "ship", label: "Data, cloud, delivery and visualization", categories: ["Data engineering", "Cloud & databases", "DevOps & engineering", "Visualization"], direction: "right" },
];

export const TECH_CATEGORIES: TechCategory[] = ["AI & agents", "Languages & frontend", "Data engineering", "Machine learning", "Cloud & databases", "DevOps & engineering", "Visualization"];
