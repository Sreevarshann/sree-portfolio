/**
 * Skills mapped to where they were actually used. No proficiency percentages:
 * the evidence is the list of roles and projects behind each skill.
 */
export type SkillCluster = {
  id: "ai" | "data" | "software" | "platform";
  title: string;
  blurb: string;
  skills: { name: string; usedIn: string[] }[];
};

export const skillClusters: SkillCluster[] = [
  {
    id: "ai",
    title: "Intelligent systems",
    blurb: "Agents, retrieval and evaluation that hold up under verification.",
    skills: [
      { name: "AI agents", usedIn: ["rightrev", "nexus-ai", "aegis-ai", "insightforge"] },
      { name: "Snowflake Cortex", usedIn: ["rightrev"] },
      { name: "Model Context Protocol", usedIn: ["rightrev", "nexus-ai"] },
      { name: "LangGraph", usedIn: ["nexus-ai", "sourceatlas", "insightforge", "aegis-ai"] },
      { name: "RAG & hybrid retrieval", usedIn: ["sourceatlas", "nexus-ai", "google-mlops-expo"] },
      { name: "LLM evaluation", usedIn: ["tunelab", "sourceatlas", "insightforge", "nexus-ai"] },
      { name: "LoRA fine-tuning", usedIn: ["tunelab"] },
      { name: "scikit-learn", usedIn: ["aegis-ai", "insightforge"] },
      { name: "Computer vision (YOLOv5, OpenCV)", usedIn: ["sri-sairam-techno-incubator"] },
      { name: "Reinforcement learning", usedIn: ["sri-sairam-techno-incubator"] },
    ],
  },
  {
    id: "data",
    title: "Data engineering",
    blurb: "Pipelines, models and quality gates that make downstream work trustworthy.",
    skills: [
      { name: "SQL", usedIn: ["rightrev", "flare-innovation", "insightforge", "aegis-ai"] },
      { name: "Python ETL", usedIn: ["flare-innovation", "google-mlops-expo", "aegis-ai"] },
      { name: "Snowflake", usedIn: ["rightrev"] },
      { name: "PostgreSQL", usedIn: ["flare-innovation", "aegis-ai", "sourceatlas", "workmesh", "nexus-ai"] },
      { name: "Kafka / Redpanda streaming", usedIn: ["aegis-ai"] },
      { name: "dbt", usedIn: ["aegis-ai"] },
      { name: "Apache Airflow", usedIn: ["google-mlops-expo"] },
      { name: "PySpark", usedIn: ["flare-innovation", "google-mlops-expo"] },
      { name: "DuckDB", usedIn: ["insightforge", "nexus-ai"] },
      { name: "Data quality & schema checks", usedIn: ["flare-innovation", "rightrev", "aegis-ai"] },
      { name: "Power BI", usedIn: ["flare-innovation"] },
    ],
  },
  {
    id: "software",
    title: "Full-stack software",
    blurb: "Product surfaces and APIs that explain what the system did.",
    skills: [
      { name: "TypeScript & React", usedIn: ["reviewpilot", "workmesh", "nexus-ai", "aegis-ai"] },
      { name: "Next.js", usedIn: ["reviewpilot", "workmesh", "sourceatlas", "tunelab", "insightforge", "nexus-ai"] },
      { name: "FastAPI", usedIn: ["aegis-ai", "sourceatlas", "insightforge", "tunelab", "nexus-ai"] },
      { name: "NestJS", usedIn: ["reviewpilot", "workmesh"] },
      { name: "REST APIs & integrations", usedIn: ["rightrev", "flare-innovation"] },
      { name: "Salesforce CRM APIs", usedIn: ["rightrev"] },
      { name: "Server-sent events & realtime", usedIn: ["reviewpilot", "tunelab", "workmesh", "insightforge"] },
    ],
  },
  {
    id: "platform",
    title: "Security, quality & delivery",
    blurb: "The parts that let a system be trusted in production.",
    skills: [
      { name: "OAuth & RBAC", usedIn: ["rightrev", "aegis-ai", "reviewpilot"] },
      { name: "Multi-tenant isolation", usedIn: ["rightrev", "reviewpilot", "workmesh"] },
      { name: "Automated testing (pytest, Vitest, Playwright)", usedIn: ["rightrev", "tunelab", "reviewpilot", "workmesh", "sourceatlas"] },
      { name: "GitHub Actions CI/CD", usedIn: ["flare-innovation", "aegis-ai", "tunelab", "reviewpilot"] },
      { name: "Docker", usedIn: ["flare-innovation", "google-mlops-expo", "aegis-ai", "workmesh"] },
      { name: "Azure ML", usedIn: ["google-mlops-expo"] },
      { name: "Prometheus monitoring", usedIn: ["google-mlops-expo", "aegis-ai"] },
    ],
  },
];

/** Human-readable labels for evidence ids. */
export const evidenceLabels: Record<string, { label: string; href: string }> = {
  rightrev: { label: "RightRev", href: "/experience#rightrev" },
  "flare-innovation": { label: "Flare Innovation", href: "/experience#flare-innovation" },
  "sri-sairam-techno-incubator": { label: "Sri Sairam Techno Incubator", href: "/experience#sri-sairam-techno-incubator" },
  "google-mlops-expo": { label: "Charlie (MBTA)", href: "/achievements#google-mlops-expo" },
  "aegis-ai": { label: "AEGIS AI", href: "/projects/aegis-ai" },
  "nexus-ai": { label: "NEXUS AI", href: "/projects/nexus-ai" },
  sourceatlas: { label: "SourceAtlas", href: "/projects/sourceatlas" },
  tunelab: { label: "TuneLab", href: "/projects/tunelab" },
  insightforge: { label: "InsightForge", href: "/projects/insightforge" },
  reviewpilot: { label: "ReviewPilot", href: "/projects/reviewpilot" },
  workmesh: { label: "WorkMesh", href: "/projects/workmesh" },
};
