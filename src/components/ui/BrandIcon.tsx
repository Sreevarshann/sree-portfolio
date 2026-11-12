import { brandIcons } from "@/content/brandIcons";

/** Map free-text technology names to Simple Icons slugs. */
const ALIASES: Record<string, string> = {
  python: "python", "python 3.11": "python", "python 3.13": "python", typescript: "typescript", "next.js": "nextdotjs", "next.js 16": "nextdotjs",
  react: "react", "react 18": "react", "react 19": "react", postgresql: "postgresql", "postgresql 16": "postgresql", "postgres": "postgresql",
  "postgresql + pgvector": "postgresql", "postgresql 16 + pgvector": "postgresql", "postgresql 16 (rls, fts)": "postgresql", snowflake: "snowflake",
  "snowflake cortex": "snowflake", fastapi: "fastapi", docker: "docker", "docker compose": "docker", redis: "redis", "redis 7": "redis",
  "redpanda (kafka api)": "apachekafka", kafka: "apachekafka", langgraph: "langchain", nestjs: "nestjs", "nestjs 11": "nestjs", plotly: "plotly",
  duckdb: "duckdb", "mlflow 3": "mlflow", mlflow: "mlflow", "github actions": "githubactions", opencv: "opencv", ros: "ros", "scikit-learn": "scikitlearn",
  pandas: "pandas", "apache airflow": "apacheairflow", pyspark: "apachespark", "apache spark (pyspark)": "apachespark", ollama: "ollama",
  "ollama (qwen3:4b-instruct)": "ollama", "ollama (optional)": "ollama", "tailwind 4": "tailwindcss", tailwind: "tailwindcss", "sqlite (wal)": "sqlite",
  sqlite: "sqlite", "prometheus client": "prometheus", prometheus: "prometheus", "prometheus monitoring": "prometheus", github: "github",
  "google scholar": "googlescholar", google: "google", cisco: "cisco",
};

export function iconFor(name: string) {
  const key = ALIASES[name.toLowerCase().trim()];
  return key ? brandIcons[key] : undefined;
}

/**
 * Monochrome brand mark (Simple Icons, CC0). Inherits currentColor; pass
 * `brand` to use the official brand color. Renders nothing for unknown names
 * so callers can fall back to text.
 */
export function BrandIcon({ name, size = 16, brand = false, className = "", title }: { name: string; size?: number; brand?: boolean; className?: string; title?: string }) {
  const icon = brandIcons[name] ?? iconFor(name);
  if (!icon) return null;
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={className}
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
      fill={brand ? icon.hex : "currentColor"}
    >
      <path d={icon.path} />
    </svg>
  );
}
