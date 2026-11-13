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
  /** Short first-person introduction for the About page (about 90 words in total). */
  intro: {
    statement: {
      before: "I'm Sreevarshan, a Boston-based engineer building ",
      highlights: ["intelligent systems", "data platforms", "software products"],
      after: ".",
    },
    blocks: [
      {
        label: "What I do",
        title: "Pipeline, model and product.",
        body: "I work across all three, because an AI feature is only as good as the data it reads and the interface that explains it. Most recently I built Snowflake Cortex AI agents and MCP integrations at RightRev.",
      },
      {
        label: "What I'm working toward",
        title: "AI that teams can trust.",
        body: "Agents that cite their sources, data that is checked before it is used, and results I can measure.",
      },
    ],
    now: "Finishing my M.S. in Data Analytics Engineering at Northeastern",
  },
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
