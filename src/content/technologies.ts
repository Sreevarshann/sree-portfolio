import { evidenceLabels } from "./skills";
import { profile } from "./profile";

/**
 * Technologies shown in the "Tools & Technologies" marquee.
 *
 * Every `hands-on` entry names where it was used: a role, a project with a
 * public repository, this site itself, or the resume's skills section.
 * Tools without that evidence are listed as `exploring`, never as expertise.
 * No proficiency levels or percentages.
 *
 * Logos: `sprite` ids are symbols in public/tech-icons.svg (drawn in
 * currentColor), `file` entries are standalone multicolour SVGs in
 * public/tech/, and `text` entries are typographic tiles for tools without a
 * licensed mark. See scripts/build-tech-icons.mjs and public/tech/LICENSES.md.
 */
export type TechLogo =
  /** `ink` = draw in the theme's text colour (black marks that vanish on dark). */
  | { kind: "sprite"; id: string; color: string | "ink"; darkColor?: string | "ink" }
  | { kind: "file"; src: string }
  | { kind: "text"; mark: string };

export type TechCategory = "AI & agents" | "Languages & frontend" | "Data engineering" | "Machine learning" | "Cloud & databases" | "DevOps & engineering" | "Visualization";

export type Tech = {
  id: string;
  name: string;
  category: TechCategory;
  logo: TechLogo;
  level: "hands-on" | "exploring";
  /** Evidence ids: keys of `evidence` below. */
  usedIn: string[];
  note?: string;
};

export const evidence: Record<string, { label: string; href: string }> = {
  ...evidenceLabels,
  "sree-ai": { label: "Sree AI on this site", href: "/ask" },
  "this-site": { label: "This portfolio", href: "/" },
  lab: { label: "The Lab", href: "/lab" },
  resume: { label: "Resume skills", href: profile.resumePath },
};

const s = (id: string, color: string | "ink", darkColor?: string | "ink"): TechLogo => ({ kind: "sprite", id, color, darkColor });
const f = (name: string): TechLogo => ({ kind: "file", src: `/tech/${name}.svg` });
const t = (mark: string): TechLogo => ({ kind: "text", mark });

export const technologies: Tech[] = [
  // AI & agents
  { id: "claude", name: "Claude", category: "AI & agents", logo: s("claude", "#D97757"), level: "hands-on", usedIn: ["sree-ai"], note: "Powers the Sree AI assistant on this site through the Anthropic API." },
  { id: "openai", name: "OpenAI", category: "AI & agents", logo: s("openai", "ink"), level: "hands-on", usedIn: ["google-mlops-expo", "sourceatlas"], note: "GPT-powered RAG assistant in Charlie; OpenAI-compatible provider adapter in SourceAtlas." },
  { id: "gemini", name: "Gemini", category: "AI & agents", logo: f("gemini"), level: "exploring", usedIn: [] },
  { id: "huggingface", name: "Hugging Face", category: "AI & agents", logo: f("huggingface"), level: "hands-on", usedIn: ["tunelab"], note: "TuneLab pulls its pinned base model from the Hugging Face Hub." },
  { id: "langchain", name: "LangChain", category: "AI & agents", logo: s("langchain", "#1C3C3C", "#7FC8FF"), level: "exploring", usedIn: [] },
  { id: "langgraph", name: "LangGraph", category: "AI & agents", logo: s("langgraph", "#1C3C3C", "#7FC8FF"), level: "hands-on", usedIn: ["nexus-ai", "sourceatlas", "insightforge", "aegis-ai"] },
  { id: "rag", name: "RAG", category: "AI & agents", logo: t("RAG"), level: "hands-on", usedIn: ["sourceatlas", "nexus-ai", "google-mlops-expo"], note: "Retrieval-augmented generation." },
  { id: "mcp", name: "Model Context Protocol", category: "AI & agents", logo: s("modelcontextprotocol", "ink"), level: "hands-on", usedIn: ["rightrev", "nexus-ai"] },
  { id: "cortex", name: "Snowflake Cortex", category: "AI & agents", logo: s("snowflake", "#29B5E8"), level: "hands-on", usedIn: ["rightrev"] },
  { id: "ollama", name: "Ollama", category: "AI & agents", logo: s("ollama", "ink"), level: "hands-on", usedIn: ["nexus-ai", "sourceatlas", "insightforge"] },

  // Languages & frontend
  { id: "python", name: "Python", category: "Languages & frontend", logo: s("python", "#3776AB", "#5B9BD5"), level: "hands-on", usedIn: ["flare-innovation", "sri-sairam-techno-incubator", "aegis-ai", "sourceatlas"] },
  { id: "sql", name: "SQL", category: "Languages & frontend", logo: t("SQL"), level: "hands-on", usedIn: ["rightrev", "flare-innovation", "insightforge"] },
  { id: "r", name: "R", category: "Languages & frontend", logo: s("r", "#276DC3", "#5B9BD5"), level: "hands-on", usedIn: ["resume"] },
  { id: "javascript", name: "JavaScript", category: "Languages & frontend", logo: s("javascript", "#E8C900", "#F7DF1E"), level: "hands-on", usedIn: ["reviewpilot", "workmesh", "this-site"] },
  { id: "typescript", name: "TypeScript", category: "Languages & frontend", logo: s("typescript", "#3178C6", "#4B9BE8"), level: "hands-on", usedIn: ["reviewpilot", "workmesh", "nexus-ai", "this-site"] },
  { id: "react", name: "React", category: "Languages & frontend", logo: s("react", "#149ECA", "#61DAFB"), level: "hands-on", usedIn: ["reviewpilot", "workmesh", "aegis-ai", "this-site"] },
  { id: "nextjs", name: "Next.js", category: "Languages & frontend", logo: s("nextdotjs", "ink"), level: "hands-on", usedIn: ["reviewpilot", "workmesh", "sourceatlas", "this-site"] },

  // Machine learning
  { id: "pytorch", name: "PyTorch", category: "Machine learning", logo: s("pytorch", "#EE4C2C"), level: "exploring", usedIn: [] },
  { id: "scikit-learn", name: "scikit-learn", category: "Machine learning", logo: s("scikitlearn", "#F7931E"), level: "hands-on", usedIn: ["aegis-ai", "insightforge"] },
  { id: "mlflow", name: "MLflow", category: "Machine learning", logo: s("mlflow", "#0194E2"), level: "hands-on", usedIn: ["aegis-ai"] },
  { id: "opencv", name: "OpenCV", category: "Machine learning", logo: s("opencv", "#5C3EE8", "#8E7BFF"), level: "hands-on", usedIn: ["sri-sairam-techno-incubator"] },
  { id: "yolov5", name: "YOLOv5", category: "Machine learning", logo: s("yolo", "#111F68", "ink"), level: "hands-on", usedIn: ["sri-sairam-techno-incubator"] },

  // Data engineering
  { id: "spark", name: "Apache Spark · PySpark", category: "Data engineering", logo: s("apachespark", "#E25A1C"), level: "hands-on", usedIn: ["flare-innovation", "google-mlops-expo"] },
  { id: "airflow", name: "Apache Airflow", category: "Data engineering", logo: s("apacheairflow", "#017CEE", "#3C9BF0"), level: "hands-on", usedIn: ["google-mlops-expo"] },
  { id: "dbt", name: "dbt", category: "Data engineering", logo: t("dbt"), level: "hands-on", usedIn: ["aegis-ai"] },
  { id: "snowflake", name: "Snowflake", category: "Data engineering", logo: s("snowflake", "#29B5E8"), level: "hands-on", usedIn: ["rightrev"] },
  { id: "pandas", name: "pandas", category: "Data engineering", logo: s("pandas", "#150458", "ink"), level: "hands-on", usedIn: ["aegis-ai", "insightforge"] },
  { id: "numpy", name: "NumPy", category: "Data engineering", logo: s("numpy", "#013243", "#4DABCF"), level: "hands-on", usedIn: ["insightforge"] },
  { id: "duckdb", name: "DuckDB", category: "Data engineering", logo: s("duckdb", "ink", "#FFF000"), level: "hands-on", usedIn: ["insightforge", "nexus-ai"] },

  // Cloud & databases
  { id: "aws", name: "AWS", category: "Cloud & databases", logo: s("aws", "ink"), level: "hands-on", usedIn: ["resume"], note: "S3 on the resume; AWS Cloud Practitioner Essentials training course." },
  { id: "azure", name: "Microsoft Azure · Azure ML", category: "Cloud & databases", logo: f("azure"), level: "hands-on", usedIn: ["google-mlops-expo"] },
  { id: "bigquery", name: "Google BigQuery", category: "Cloud & databases", logo: s("googlebigquery", "#4285F4", "#669DF6"), level: "hands-on", usedIn: ["resume"] },
  { id: "postgresql", name: "PostgreSQL", category: "Cloud & databases", logo: s("postgresql", "#4169E1", "#6E8EF0"), level: "hands-on", usedIn: ["flare-innovation", "aegis-ai", "sourceatlas", "workmesh"] },
  { id: "sqlserver", name: "SQL Server", category: "Cloud & databases", logo: f("sqlserver"), level: "exploring", usedIn: [] },
  { id: "mongodb", name: "MongoDB", category: "Cloud & databases", logo: s("mongodb", "#47A248"), level: "exploring", usedIn: [] },
  { id: "supabase", name: "Supabase", category: "Cloud & databases", logo: s("supabase", "#3ECF8E"), level: "exploring", usedIn: [] },

  // DevOps & engineering
  { id: "git", name: "Git", category: "DevOps & engineering", logo: s("git", "#F05032"), level: "hands-on", usedIn: ["aegis-ai", "nexus-ai", "this-site"] },
  { id: "github", name: "GitHub", category: "DevOps & engineering", logo: s("github", "ink"), level: "hands-on", usedIn: ["aegis-ai", "sourceatlas", "this-site"] },
  { id: "github-actions", name: "GitHub Actions", category: "DevOps & engineering", logo: s("githubactions", "#2088FF"), level: "hands-on", usedIn: ["flare-innovation", "aegis-ai", "tunelab", "this-site"] },
  { id: "docker", name: "Docker", category: "DevOps & engineering", logo: s("docker", "#2496ED"), level: "hands-on", usedIn: ["flare-innovation", "google-mlops-expo", "aegis-ai", "workmesh"] },
  { id: "kubernetes", name: "Kubernetes", category: "DevOps & engineering", logo: s("kubernetes", "#326CE5", "#5A8DF0"), level: "exploring", usedIn: [], note: "Planned for AEGIS AI; not built yet." },
  { id: "fastapi", name: "FastAPI", category: "DevOps & engineering", logo: s("fastapi", "#009688", "#26B5A6"), level: "hands-on", usedIn: ["aegis-ai", "sourceatlas", "tunelab", "nexus-ai"] },
  { id: "pytest", name: "pytest", category: "DevOps & engineering", logo: s("pytest", "#0A9EDC"), level: "hands-on", usedIn: ["tunelab", "sourceatlas", "insightforge"] },
  { id: "vercel", name: "Vercel", category: "DevOps & engineering", logo: s("vercel", "ink"), level: "hands-on", usedIn: ["this-site"] },

  // Visualization
  { id: "plotly", name: "Plotly", category: "Visualization", logo: s("plotly", "#3F4F75", "#9A97FF"), level: "hands-on", usedIn: ["lab", "insightforge", "tunelab"] },
  { id: "powerbi", name: "Power BI", category: "Visualization", logo: t("BI"), level: "hands-on", usedIn: ["flare-innovation"] },
  { id: "tableau", name: "Tableau", category: "Visualization", logo: t("Tb"), level: "exploring", usedIn: [] },
  { id: "matplotlib", name: "Matplotlib", category: "Visualization", logo: f("matplotlib"), level: "exploring", usedIn: [] },
];

/** Marquee rows: models and code move left; data and delivery move right. */
export const techRows: { id: string; label: string; categories: TechCategory[]; direction: "left" | "right" }[] = [
  { id: "build", label: "AI, machine learning and languages", categories: ["AI & agents", "Machine learning", "Languages & frontend"], direction: "left" },
  { id: "ship", label: "Data, cloud, delivery and visualization", categories: ["Data engineering", "Cloud & databases", "DevOps & engineering", "Visualization"], direction: "right" },
];

export const TECH_CATEGORIES: TechCategory[] = ["AI & agents", "Languages & frontend", "Data engineering", "Machine learning", "Cloud & databases", "DevOps & engineering", "Visualization"];
