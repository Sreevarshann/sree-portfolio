/**
 * Single source of truth for public personal information.
 * PRIVACY: never add a phone number, street address, or immigration status here.
 */
export const profile = {
  name: "Sreevarshan Sathiyamurthy",
  displayName: "Sree",
  roles: ["AI Engineer", "Data Engineer", "Software Engineer"],
  location: "Boston, Massachusetts",
  coordinates: { lat: "42.3601° N", lng: "71.0589° W" },
  email: "sreevarshan.dev@gmail.com",
  links: {
    linkedin: "https://www.linkedin.com/in/sreevarshansathiyamurthy/",
    github: "https://github.com/Sreevarshann",
    scholar: "https://scholar.google.com/citations?user=ENfDDDQAAAAJ&hl=en",
  },
  resumePath: "/Sreevarshan-Sathiyamurthy-Resume.pdf",
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "https://sree-portfolio.vercel.app",
  headline: "I design intelligent systems, engineer the data underneath them, and ship the software around them.",
  summary:
    "Sree is an engineer in Boston working where AI, data infrastructure and product software meet. He is completing an M.S. in Data Analytics Engineering at Northeastern University and most recently built Snowflake Cortex AI agents and MCP integrations as a Software & Data Engineer Intern at RightRev.",
  about: [
    "I like systems you can reason about. An AI feature is only as good as the data it reads, the checks around it and the interface that explains it, so I tend to work across all three: the pipeline, the model and the product surface.",
    "At RightRev I built Snowflake Cortex AI agents, SQL stored procedures and Model Context Protocol integrations that let business teams ask revenue questions without manual analysis. Moving 18 agents into production taught me to treat tenant isolation, access control and validation tests as part of the feature rather than paperwork after it.",
    "Before that I was a data analyst and engineer at Flare Innovation in Chennai, building Python ETL pipelines for more than a million IoT records and Power BI dashboards that cut reporting latency by 30%. Earlier, at the Sri Sairam Techno Incubator Foundation, I worked on computer vision and reinforcement-learning control for an autonomous underwater vehicle that placed 6th of 320+ teams at the Singapore AUV Challenge.",
    "Outside of work I build end-to-end projects to test ideas properly: real-time fraud scoring on a streaming pipeline, agentic retrieval that refuses to cite what it can't verify, LoRA fine-tuning measured against a frozen baseline. Each one ships with tests, an evaluation and honest notes on its limits.",
  ],
  values: [
    { title: "Evidence over adjectives", body: "Every number I report comes from a test, an eval run or a log. If I can't verify it, I say so." },
    { title: "Guardrails are features", body: "Tenant isolation, RBAC, input validation and abstention belong in the first version, not the third." },
    { title: "Data is the product", body: "Schema checks, lineage and quality gates decide whether anything downstream can be trusted." },
    { title: "Explain the system", body: "Interfaces should show their work: the source, the query, the reason a score was given." },
  ],
  focus: [
    "Agentic AI systems with verifiable outputs",
    "Retrieval, evaluation and LLM reliability",
    "Streaming and batch data pipelines",
    "Full-stack products on top of data platforms",
  ],
} as const;

export type Profile = typeof profile;
