import { evidenceLabels } from "./skills";
import { profile } from "./profile";

/**
 * The verified skill catalog: the single source of truth behind the Skill
 * Explorer (Explore My Stack) and Sree AI's skill knowledge.
 *
 * Every skill names where it was actually used: a role, a project with a
 * public repository, a competition, this site, coursework named in the
 * education record, or a course whose own title names the tool. Each usage
 * says what was done there, in words taken from the experience records,
 * project READMEs and the resume. Nothing is inferred from the logo marquee,
 * a course syllabus or a neighbouring technology. No proficiency levels, no
 * percentages.
 *
 * Technologies Sree has not documented are never skills. Some of them are
 * `RelatedTopic`s: they point to verified skills with an honest explanation
 * of the overlap ("Looking for Databricks?"), and are always presented as
 * related experience, never as direct experience.
 */

/* ------------------------------------------------------------ evidence */
export type EvidenceKind = "work" | "project" | "competition" | "site" | "coursework" | "course" | "public";

export const evidence: Record<string, { label: string; href: string; kind: EvidenceKind }> = {
  rightrev: { ...evidenceLabels.rightrev, kind: "work" },
  "flare-innovation": { ...evidenceLabels["flare-innovation"], kind: "work" },
  "sri-sairam-techno-incubator": { ...evidenceLabels["sri-sairam-techno-incubator"], kind: "work" },
  "google-mlops-expo": { ...evidenceLabels["google-mlops-expo"], kind: "competition" },
  sauvc: { label: "Singapore AUV Challenge", href: "/achievements#sauvc", kind: "competition" },
  "aegis-ai": { ...evidenceLabels["aegis-ai"], kind: "project" },
  "nexus-ai": { ...evidenceLabels["nexus-ai"], kind: "project" },
  sourceatlas: { ...evidenceLabels.sourceatlas, kind: "project" },
  tunelab: { ...evidenceLabels.tunelab, kind: "project" },
  insightforge: { ...evidenceLabels.insightforge, kind: "project" },
  reviewpilot: { ...evidenceLabels.reviewpilot, kind: "project" },
  workmesh: { ...evidenceLabels.workmesh, kind: "project" },
  "sree-ai": { label: "Sree AI (this site)", href: "/ask", kind: "site" },
  "this-site": { label: "This portfolio", href: "/", kind: "site" },
  /** Northeastern M.S.: MLOps coursework labs (Airflow, Docker) noted under Education. */
  coursework: { label: "University coursework", href: "/education", kind: "coursework" },
  "aws-course": { label: "AWS Cloud Practitioner Essentials course", href: "/certifications", kind: "course" },
  /** Three public dashboards on his Tableau Public profile (checked on the live profile). */
  "tableau-public": { label: "Tableau Public dashboards", href: profile.links.tableau, kind: "public" },
};

/** How a usage context reads in the interface. */
export const EVIDENCE_KIND_LABEL: Record<EvidenceKind, string> = {
  work: "Work",
  project: "Project",
  competition: "Competition",
  site: "This site",
  coursework: "Coursework",
  course: "Course",
  public: "Public work",
};

/* ------------------------------------------------------------ skills */
export type SkillCategory = "ai" | "data" | "cloud" | "software" | "devops" | "analytics";

export const SKILL_CATEGORIES: { id: SkillCategory; label: string }[] = [
  { id: "ai", label: "AI & Machine Learning" },
  { id: "data", label: "Data Engineering" },
  { id: "cloud", label: "Cloud & Databases" },
  { id: "software", label: "Frontend & Software" },
  { id: "devops", label: "DevOps & Infrastructure" },
  { id: "analytics", label: "Analytics & Visualization" },
];

export type SkillUse = {
  /** Key of `evidence`. */
  at: string;
  /** What Sree did there, in one sentence. */
  what: string;
};

export type Skill = {
  id: string;
  name: string;
  /** Other names people search for (case, punctuation and spacing are ignored). */
  aliases: string[];
  category: SkillCategory;
  /** Marquee technologies (ids) this skill covers; the first supplies the logo. */
  tech?: string[];
  /** Strongest first. */
  uses: SkillUse[];
  /** Other verified skills worth showing next to this one. */
  related?: string[];
};

const u = (at: string, what: string): SkillUse => ({ at, what });

export const skills: Skill[] = [
  /* ---------------------------------------------- AI & Machine Learning */
  {
    id: "ai-agents",
    name: "AI agents",
    aliases: ["agents", "agentic ai", "ai agent", "llm agents", "agentic workflows", "multi-agent systems", "multi agent"],
    category: "ai",
    uses: [
      u("rightrev", "Developed Snowflake Cortex AI agents that automate financial reporting, and migrated 18 of them to production."),
      u("nexus-ai", "Built a mission pipeline: planner, human approval, research, document and data agents, a synthesizer and an evidence verifier."),
      u("aegis-ai", "Built LangGraph fraud investigations that use six tools, with an optional local-LLM narration step."),
      u("insightforge", "Built an analyst agent: the LLM plans typed operations and sandboxed SQL, and every number it explains is verified."),
    ],
    related: ["langgraph", "snowflake-cortex", "mcp", "llm-apps"],
  },
  {
    id: "llm-apps",
    name: "LLM applications",
    aliases: ["llm", "llms", "large language models", "generative ai", "genai", "gen ai", "gpt"],
    category: "ai",
    uses: [
      u("rightrev", "Built Snowflake Cortex AI agents for financial reporting."),
      u("sourceatlas", "Built a research engine that checks every claim against the passage it cites and abstains when it cannot verify."),
      u("reviewpilot", "Runs a grounded model pass after 17 deterministic rules; findings that do not quote the lines they cite are discarded."),
      u("sree-ai", "Built the Sree AI assistant on this site: grounded retrieval, cited answers and a claim gate."),
    ],
    related: ["rag", "ai-agents", "llm-eval", "lora"],
  },
  {
    id: "snowflake-cortex",
    name: "Snowflake Cortex",
    aliases: ["cortex", "cortex ai", "snowflake cortex ai"],
    category: "ai",
    tech: ["cortex"],
    uses: [u("rightrev", "Developed Snowflake Cortex AI agents and MCP integrations that automate financial reporting; 18 agents migrated to production.")],
    related: ["snowflake", "ai-agents", "mcp"],
  },
  {
    id: "mcp",
    name: "Model Context Protocol (MCP)",
    aliases: ["mcp", "model context protocol", "mcp server"],
    category: "ai",
    tech: ["mcp"],
    uses: [
      u("rightrev", "Built MCP integrations for the Snowflake Cortex AI agents."),
      u("nexus-ai", "Built an authenticated MCP server over Streamable HTTP."),
    ],
    related: ["ai-agents", "snowflake-cortex"],
  },
  {
    id: "langgraph",
    name: "LangGraph",
    aliases: ["lang graph"],
    category: "ai",
    tech: ["langgraph"],
    uses: [
      u("nexus-ai", "Orchestrates the multi-agent mission pipeline, with pause, resume and retry from a Postgres checkpointer."),
      u("sourceatlas", "Runs the retrieval and claim-verification workflow."),
      u("insightforge", "Plans and executes the analyst agent's typed operations."),
      u("aegis-ai", "Runs fraud investigations that call six tools."),
    ],
    related: ["ai-agents", "ollama"],
  },
  {
    id: "rag",
    name: "Retrieval-augmented generation (RAG)",
    aliases: ["rag", "retrieval augmented generation", "retrieval-augmented generation", "hybrid search", "hybrid retrieval", "semantic search"],
    category: "ai",
    tech: ["rag"],
    uses: [
      u("sourceatlas", "Hybrid search (pgvector HNSW plus Postgres full-text) fused with reciprocal rank fusion, and claim-level verification against cited passages."),
      u("nexus-ai", "Knowledge library with pgvector and full-text retrieval fused by reciprocal rank fusion."),
      u("google-mlops-expo", "GPT-powered RAG assistant for live transit questions; retrieval evaluation reached 92% precision on route and schedule questions."),
    ],
    related: ["pgvector", "llm-apps", "llm-eval"],
  },
  {
    id: "pgvector",
    name: "pgvector & vector search",
    aliases: ["pgvector", "vector search", "vector database", "embeddings", "vector store"],
    category: "ai",
    uses: [
      u("sourceatlas", "PostgreSQL 16 with pgvector HNSW indexes for hybrid retrieval."),
      u("nexus-ai", "PostgreSQL with pgvector for the knowledge library."),
    ],
    related: ["rag", "postgresql"],
  },
  {
    id: "llm-eval",
    name: "LLM evaluation",
    aliases: ["evals", "evaluation", "model evaluation", "llm evals"],
    category: "ai",
    uses: [
      u("tunelab", "Evaluates LoRA adapters against the frozen base model on identical prompts: JSON validity, per-field accuracy and teacher-forced loss."),
      u("sourceatlas", "Claim-level verification and an evaluation dashboard."),
      u("insightforge", "A number verifier checks every figure in the agent's explanation."),
    ],
    related: ["lora", "rag"],
  },
  {
    id: "lora",
    name: "LoRA fine-tuning",
    aliases: ["lora", "fine tuning", "fine-tuning", "finetuning", "peft", "mlx", "llm fine tuning"],
    category: "ai",
    uses: [u("tunelab", "Trains LoRA adapters for Qwen2.5-0.5B-Instruct with MLX on Apple Silicon, with live loss curves and adapter verification.")],
    related: ["llm-eval", "huggingface"],
  },
  {
    id: "ollama",
    name: "Ollama (local LLMs)",
    aliases: ["ollama", "local llm", "local llms", "qwen"],
    category: "ai",
    tech: ["ollama"],
    uses: [
      u("nexus-ai", "Runs the agents locally on qwen3:4b-instruct with nomic-embed-text embeddings."),
      u("sourceatlas", "Local model and embeddings for retrieval and verification."),
      u("insightforge", "Local model for the analyst agent."),
      u("reviewpilot", "Local model for the grounded code-review pass."),
    ],
    related: ["langgraph", "llm-apps"],
  },
  {
    id: "openai",
    name: "OpenAI API",
    aliases: ["openai", "gpt api", "chatgpt api"],
    category: "ai",
    tech: ["openai"],
    uses: [
      u("google-mlops-expo", "GPT-powered RAG assistant in Charlie."),
      u("sourceatlas", "OpenAI-compatible provider adapter."),
    ],
    related: ["rag", "llm-apps"],
  },
  {
    id: "groq",
    name: "Groq",
    aliases: ["groq api"],
    category: "ai",
    uses: [u("sree-ai", "Sree AI on this site streams its answers from models served by Groq.")],
    related: ["llm-apps"],
  },
  {
    id: "claude",
    name: "Claude (Anthropic API)",
    aliases: ["claude", "anthropic", "anthropic api"],
    category: "ai",
    tech: ["claude"],
    uses: [u("sree-ai", "Sree AI on this site supports the Anthropic API as a configurable model provider.")],
    related: ["llm-apps"],
  },
  {
    id: "huggingface",
    name: "Hugging Face",
    aliases: ["hugging face", "huggingface hub", "hf"],
    category: "ai",
    tech: ["huggingface"],
    uses: [u("tunelab", "Pulls its pinned base model from the Hugging Face Hub.")],
    related: ["lora"],
  },
  {
    id: "machine-learning",
    name: "Machine learning",
    aliases: ["ml", "predictive modeling", "classification"],
    category: "ai",
    uses: [
      u("aegis-ai", "Logistic regression and histogram gradient boosting with Platt calibration, MLflow tracking and PSI drift checks."),
      u("google-mlops-expo", "Real-time features for transit delay prediction, with automated retraining."),
      u("sri-sairam-techno-incubator", "YOLOv5 object detection and reinforcement-learning control for an autonomous underwater vehicle."),
    ],
    related: ["scikit-learn", "mlflow", "mlops"],
  },
  {
    id: "scikit-learn",
    name: "scikit-learn",
    aliases: ["sklearn", "scikit learn"],
    category: "ai",
    tech: ["scikit-learn"],
    uses: [
      u("aegis-ai", "Fraud models: logistic regression versus histogram gradient boosting with Platt calibration."),
      u("insightforge", "Part of the analysis stack behind its typed statistical operations."),
    ],
    related: ["machine-learning", "mlflow"],
  },
  {
    id: "mlflow",
    name: "MLflow",
    aliases: ["ml flow", "experiment tracking"],
    category: "ai",
    tech: ["mlflow"],
    uses: [u("aegis-ai", "Tracks the fraud model experiments.")],
    related: ["mlops", "machine-learning"],
  },
  {
    id: "mlops",
    name: "MLOps",
    aliases: ["ml ops", "model deployment", "model monitoring"],
    category: "ai",
    uses: [
      u("google-mlops-expo", "Dockerized Azure ML services with autoscaling, automated retraining, and Prometheus and Slack alerts (3rd place, Google MLOps Expo)."),
      u("aegis-ai", "MLflow tracking, PSI drift checks and Prometheus metrics."),
      u("coursework", "MLOps coursework labs published on GitHub: Airflow, Docker, data labelling and experiment tracking."),
    ],
    related: ["docker", "airflow", "azure", "mlflow"],
  },
  {
    id: "computer-vision",
    name: "Computer vision (YOLOv5, OpenCV)",
    aliases: ["computer vision", "cv", "yolo", "yolov5", "opencv", "object detection"],
    category: "ai",
    tech: ["yolov5", "opencv"],
    uses: [
      u("sri-sairam-techno-incubator", "Trained and integrated YOLOv5 models with OpenCV for real-time underwater object detection."),
      u("sauvc", "Object detection for the team's AUV, which finished 6th of 320+ teams."),
    ],
    related: ["reinforcement-learning", "ros"],
  },
  {
    id: "reinforcement-learning",
    name: "Reinforcement learning",
    aliases: ["rl", "reinforcement learning"],
    category: "ai",
    uses: [u("sri-sairam-techno-incubator", "Reinforcement-learning control on ROS with a 92% success rate on obstacle avoidance, gate traversal and object recovery in Gazebo and pool tests.")],
    related: ["ros", "computer-vision"],
  },
  {
    id: "ros",
    name: "ROS & Gazebo",
    aliases: ["ros", "robot operating system", "gazebo", "robotics"],
    category: "ai",
    uses: [u("sri-sairam-techno-incubator", "Integrated reinforcement-learning control with ROS, validated in Gazebo simulations and real pool tests.")],
    related: ["reinforcement-learning", "computer-vision"],
  },

  /* ---------------------------------------------- Data Engineering */
  {
    id: "python",
    name: "Python",
    aliases: ["python3", "py"],
    category: "data",
    tech: ["python"],
    uses: [
      u("flare-innovation", "Python ETL pipelines processing 1M+ IoT records, plus sensor anomaly detection."),
      u("sri-sairam-techno-incubator", "YOLOv5 detection and reinforcement-learning control for the AUV."),
      u("aegis-ai", "Python 3.11 backend: FastAPI, streaming consumers and the ML models."),
      u("sourceatlas", "Python 3.13 backend with FastAPI, SQLAlchemy and strict typing (mypy --strict)."),
      u("google-mlops-expo", "Real-time ETL that turns live MBTA data into prediction features."),
    ],
    related: ["etl", "fastapi", "pandas"],
  },
  {
    id: "sql",
    name: "SQL",
    aliases: ["structured query language", "stored procedures", "sql stored procedures"],
    category: "data",
    tech: ["sql"],
    uses: [
      u("rightrev", "SQL stored procedures for the Cortex agents, an audit of 200+ Snowflake views, and SQL and JSON validation tests."),
      u("flare-innovation", "SQL transformations behind IoT anomaly detection and KPI reporting."),
      u("insightforge", "Guarded SQL: a SQLGlot policy and a locked DuckDB sandbox."),
    ],
    related: ["snowflake", "postgresql", "duckdb"],
  },
  {
    id: "snowflake",
    name: "Snowflake",
    aliases: ["snowflake data cloud", "snowflake sql"],
    category: "data",
    tech: ["snowflake"],
    uses: [u("rightrev", "Snowflake Cortex AI agents, SQL stored procedures, MCP integrations and an audit of 200+ Snowflake views; 18 agents migrated to production.")],
    related: ["snowflake-cortex", "sql", "dbt"],
  },
  {
    id: "etl",
    name: "ETL & data pipelines",
    aliases: ["etl", "elt", "data pipeline", "data pipelines", "pipelines", "data ingestion", "data engineering"],
    category: "data",
    uses: [
      u("flare-innovation", "Python ETL pipelines processing 1M+ IoT records from PostgreSQL and Airtable, with automated PyTest schema validation."),
      u("google-mlops-expo", "Real-time ETL with Python, Apache Airflow, PySpark and Azure on live MBTA data."),
      u("aegis-ai", "Streaming pipeline: idempotent producer, Redpanda topic, consumer that commits offsets after the database commit, and dbt models."),
    ],
    related: ["spark", "airflow", "kafka", "dbt", "data-quality"],
  },
  {
    id: "spark",
    name: "Apache Spark (PySpark)",
    aliases: ["spark", "pyspark", "apache spark", "py spark"],
    category: "data",
    tech: ["spark"],
    uses: [
      u("flare-innovation", "Used PySpark to optimize large-scale processing of IoT sensor data."),
      u("google-mlops-expo", "PySpark in the real-time ETL behind transit delay prediction."),
    ],
    related: ["etl", "python", "airflow"],
  },
  {
    id: "airflow",
    name: "Apache Airflow",
    aliases: ["airflow", "apache airflow", "dags"],
    category: "data",
    tech: ["airflow"],
    uses: [
      u("google-mlops-expo", "Orchestrates the real-time ETL for Charlie."),
      u("coursework", "MLOps coursework labs published on GitHub."),
    ],
    related: ["etl", "spark", "mlops"],
  },
  {
    id: "dbt",
    name: "dbt",
    aliases: ["dbt core", "data build tool"],
    category: "data",
    tech: ["dbt"],
    uses: [u("aegis-ai", "A dbt project with 3 staging models, 7 marts and 23 tests on top of the streaming data.")],
    related: ["data-modeling", "sql", "data-quality"],
  },
  {
    id: "data-modeling",
    name: "Data modeling",
    aliases: ["data model", "data models", "dimensional modeling", "staging models", "marts"],
    category: "data",
    uses: [u("aegis-ai", "Staging models and marts in dbt (3 staging models, 7 marts, 23 tests).")],
    related: ["dbt", "sql"],
  },
  {
    id: "kafka",
    name: "Kafka & event streaming (Redpanda)",
    aliases: ["kafka", "apache kafka", "redpanda", "streaming", "event streaming", "confluent", "real time streaming"],
    category: "data",
    uses: [u("aegis-ai", "Idempotent producer to a 3-partition topic on Redpanda (Kafka API), a consumer that commits offsets only after the database commit, and a dead-letter topic.")],
    related: ["etl", "data-quality"],
  },
  {
    id: "duckdb",
    name: "DuckDB",
    aliases: ["duck db"],
    category: "data",
    tech: ["duckdb"],
    uses: [
      u("insightforge", "Locked DuckDB sandbox behind four layers of SQL isolation."),
      u("nexus-ai", "DuckDB sandbox in the Data Lab, with guarded SQL."),
    ],
    related: ["sql", "pandas"],
  },
  {
    id: "pandas",
    name: "pandas & NumPy",
    aliases: ["pandas", "numpy", "dataframes", "scipy", "statsmodels"],
    category: "data",
    tech: ["pandas", "numpy"],
    uses: [
      u("aegis-ai", "pandas in the fraud modelling stack."),
      u("insightforge", "pandas, NumPy, SciPy and statsmodels behind 12 typed statistical operations."),
    ],
    related: ["python", "statistics"],
  },
  {
    id: "data-quality",
    name: "Data quality & validation",
    aliases: ["data validation", "data quality", "data testing", "schema validation", "data quality checks"],
    category: "data",
    uses: [
      u("flare-innovation", "Automated PyTest schema validation that stopped bad records before reporting."),
      u("rightrev", "Automated SQL and JSON validation tests to verify data accuracy and troubleshoot integration failures."),
      u("aegis-ai", "23 dbt tests, a dead-letter topic and a quarantine table for malformed events."),
    ],
    related: ["dbt", "etl", "pytest"],
  },

  /* ---------------------------------------------- Cloud & Databases */
  {
    id: "postgresql",
    name: "PostgreSQL",
    aliases: ["postgres", "postgre", "psql", "pg", "postgres sql"],
    category: "cloud",
    tech: ["postgresql"],
    uses: [
      u("flare-innovation", "PostgreSQL behind the IoT ETL pipelines and Power BI dashboards."),
      u("aegis-ai", "PostgreSQL 16 under the streaming platform and its dbt models."),
      u("sourceatlas", "PostgreSQL 16 with pgvector and full-text search for hybrid retrieval."),
      u("workmesh", "PostgreSQL 16 with row-level security and full-text search."),
      u("reviewpilot", "PostgreSQL 16 through Prisma for a multi-tenant SaaS."),
    ],
    related: ["sql", "pgvector", "redis"],
  },
  {
    id: "redis",
    name: "Redis",
    aliases: ["bullmq", "job queue", "caching"],
    category: "cloud",
    uses: [
      u("aegis-ai", "Redis 7 in the streaming fraud platform."),
      u("reviewpilot", "Redis 7 with BullMQ for review jobs."),
      u("workmesh", "Redis 7 with BullMQ."),
    ],
    related: ["postgresql"],
  },
  {
    id: "sqlite",
    name: "SQLite",
    aliases: ["sqlite3"],
    category: "cloud",
    uses: [u("tunelab", "SQLite in WAL mode stores runs and evaluations.")],
    related: ["postgresql", "sql"],
  },
  {
    id: "azure",
    name: "Microsoft Azure (Azure ML)",
    aliases: ["azure", "azure ml", "azure machine learning", "microsoft azure"],
    category: "cloud",
    tech: ["azure"],
    uses: [u("google-mlops-expo", "Dockerized Azure ML services with autoscaling and automated retraining.")],
    related: ["mlops", "docker"],
  },
  {
    id: "aws",
    name: "AWS (training)",
    aliases: ["aws", "amazon web services", "aws cloud practitioner"],
    category: "cloud",
    tech: ["aws"],
    uses: [u("aws-course", "Completed the AWS Cloud Practitioner Essentials training course (a course, not the AWS certification).")],
    related: ["azure", "docker"],
  },

  /* ---------------------------------------------- Frontend & Software */
  {
    id: "react",
    name: "React",
    aliases: ["react.js", "reactjs", "react js", "react 19", "react 18"],
    category: "software",
    tech: ["react"],
    uses: [
      u("reviewpilot", "React 19 front end for a multi-tenant code-review SaaS."),
      u("workmesh", "React 19 with React Flow, TanStack Query and Table, Zustand and Recharts."),
      u("aegis-ai", "React 18 and TypeScript dashboard."),
      u("nexus-ai", "React 19 workspace UI with Monaco and Radix."),
      u("this-site", "This portfolio is built with React 19 and Next.js."),
    ],
    related: ["typescript", "nextjs", "frontend"],
  },
  {
    id: "typescript",
    name: "TypeScript",
    aliases: ["ts"],
    category: "software",
    tech: ["typescript"],
    uses: [
      u("reviewpilot", "NestJS back end and Next.js front end in TypeScript."),
      u("workmesh", "NestJS back end and Next.js front end in TypeScript."),
      u("aegis-ai", "TypeScript React dashboard."),
      u("this-site", "This portfolio is written in TypeScript."),
    ],
    related: ["react", "nextjs", "javascript"],
  },
  {
    id: "javascript",
    name: "JavaScript",
    aliases: ["js", "ecmascript", "es6"],
    category: "software",
    tech: ["javascript"],
    uses: [
      u("reviewpilot", "JavaScript and TypeScript across the stack."),
      u("workmesh", "JavaScript and TypeScript across the stack."),
      u("this-site", "Interactions and motion on this portfolio."),
    ],
    related: ["typescript", "react"],
  },
  {
    id: "nextjs",
    name: "Next.js",
    aliases: ["next", "nextjs", "next js", "next.js 16"],
    category: "software",
    tech: ["nextjs"],
    uses: [
      u("reviewpilot", "Next.js 16 front end."),
      u("workmesh", "Next.js 16 front end."),
      u("sourceatlas", "Next.js 16 with an evidence graph and a pdf.js viewer."),
      u("tunelab", "Next.js 16 with live loss curves and a base-versus-LoRA playground."),
      u("insightforge", "Next.js 16 with Chart Studio and a Monaco query console."),
      u("nexus-ai", "Next.js 16 workspace."),
      u("this-site", "This portfolio runs on Next.js."),
    ],
    related: ["react", "typescript"],
  },
  {
    id: "nodejs",
    name: "Node.js (NestJS)",
    aliases: ["node", "nodejs", "node.js", "node js", "nestjs", "nest js", "nest"],
    category: "software",
    uses: [
      u("reviewpilot", "NestJS back end with Prisma, BullMQ and Zod."),
      u("workmesh", "NestJS 11 back end with Prisma 6, Socket.IO and Zod."),
    ],
    related: ["typescript", "rest-apis"],
  },
  {
    id: "fastapi",
    name: "FastAPI",
    aliases: ["fast api", "pydantic", "python api"],
    category: "software",
    tech: ["fastapi"],
    uses: [
      u("aegis-ai", "FastAPI back end with Pydantic v2 and SQLAlchemy 2."),
      u("sourceatlas", "FastAPI back end with Pydantic 2, SQLAlchemy 2 and Alembic."),
      u("insightforge", "FastAPI application layer."),
      u("tunelab", "FastAPI with server-sent events for live training."),
      u("nexus-ai", "FastAPI back end for the agent workspace."),
    ],
    related: ["python", "rest-apis"],
  },
  {
    id: "rest-apis",
    name: "REST APIs & integrations",
    aliases: ["rest", "rest api", "restful", "api", "apis", "api integration", "integrations", "airtable"],
    category: "software",
    uses: [
      u("rightrev", "REST APIs and front-end integrations for financial reporting, working with senior engineers."),
      u("flare-innovation", "Airtable API integrations feeding ETL and Power BI."),
    ],
    related: ["salesforce", "fastapi", "nodejs"],
  },
  {
    id: "salesforce",
    name: "Salesforce CRM APIs",
    aliases: ["salesforce", "crm", "salesforce api"],
    category: "software",
    uses: [u("rightrev", "Integrated Salesforce CRM APIs with five AI agents.")],
    related: ["rest-apis", "ai-agents"],
  },
  {
    id: "frontend",
    name: "Frontend development",
    aliases: ["frontend", "front end", "front-end", "ui", "web development", "user interface"],
    category: "software",
    uses: [
      u("rightrev", "Built frontend features and REST API integrations for financial reporting, with senior engineers reviewing changes."),
      u("this-site", "Designed and built this portfolio: motion, theming and the Sree AI interface."),
      u("workmesh", "Interactive company map (React Flow and ELK.js) and five role workspaces."),
    ],
    related: ["react", "nextjs", "tailwind"],
  },
  {
    id: "full-stack",
    name: "Full-stack applications",
    aliases: ["full stack", "fullstack", "full-stack", "full stack development", "saas"],
    category: "software",
    uses: [
      u("reviewpilot", "Multi-tenant SaaS: NestJS, Prisma, PostgreSQL, BullMQ and a Next.js front end."),
      u("workmesh", "Company visibility platform: NestJS, PostgreSQL with row-level security, Socket.IO and Next.js."),
      u("aegis-ai", "Streaming back end, FastAPI and a React dashboard, end to end."),
      u("nexus-ai", "FastAPI agent back end with a Next.js workspace."),
    ],
    related: ["react", "nodejs", "fastapi", "postgresql"],
  },
  {
    id: "tailwind",
    name: "Tailwind CSS",
    aliases: ["tailwind", "tailwindcss", "css"],
    category: "software",
    uses: [
      u("sourceatlas", "Tailwind 4 front end."),
      u("tunelab", "Tailwind 4 front end."),
      u("reviewpilot", "Tailwind 4 front end."),
      u("this-site", "This portfolio is styled with Tailwind CSS."),
    ],
    related: ["frontend", "react"],
  },
  {
    id: "realtime",
    name: "Server-sent events & realtime",
    aliases: ["sse", "server sent events", "websockets", "socket.io", "realtime", "real time", "streaming ui"],
    category: "software",
    uses: [
      u("reviewpilot", "Review findings streamed over SSE."),
      u("tunelab", "Live loss curves over server-sent events."),
      u("workmesh", "Realtime updates with Socket.IO."),
    ],
    related: ["fastapi", "nodejs"],
  },
  {
    id: "auth-rbac",
    name: "OAuth & RBAC",
    aliases: ["oauth", "rbac", "role based access control", "authentication", "authorization", "jwt", "auth"],
    category: "software",
    uses: [
      u("rightrev", "Implemented OAuth, role-based access control and REST APIs to protect customer data."),
      u("aegis-ai", "JWT auth with three RBAC roles."),
      u("reviewpilot", "Owner, Admin, Reviewer and Viewer roles with email-bound invitations and an audit log."),
    ],
    related: ["multi-tenant", "rest-apis"],
  },
  {
    id: "multi-tenant",
    name: "Multi-tenant isolation",
    aliases: ["multi tenant", "multitenancy", "multi-tenancy", "row level security", "rls", "tenant isolation"],
    category: "software",
    uses: [
      u("reviewpilot", "Cross-tenant access returns 404, never 403; plan limits and org API tokens."),
      u("workmesh", "PostgreSQL row-level security, with authorization applied in SQL search."),
    ],
    related: ["auth-rbac", "postgresql"],
  },

  /* ---------------------------------------------- DevOps & Infrastructure */
  {
    id: "docker",
    name: "Docker",
    aliases: ["containers", "containerization", "docker compose", "dockerized"],
    category: "devops",
    tech: ["docker"],
    uses: [
      u("flare-innovation", "Containerized data workflows with Docker for consistent deployments."),
      u("google-mlops-expo", "Dockerized Azure ML services with autoscaling."),
      u("aegis-ai", "Docker Compose for the full streaming platform."),
      u("workmesh", "Docker in the project tooling."),
      u("coursework", "MLOps coursework labs."),
    ],
    related: ["github-actions", "mlops"],
  },
  {
    id: "github-actions",
    name: "GitHub Actions (CI/CD)",
    aliases: ["github actions", "ci", "cd", "ci/cd", "cicd", "continuous integration", "continuous delivery"],
    category: "devops",
    tech: ["github-actions"],
    uses: [
      u("flare-innovation", "CI/CD pipelines for automated testing and builds."),
      u("aegis-ai", "CI for the platform."),
      u("tunelab", "GitHub Actions CI with pytest, Vitest and Playwright suites."),
      u("this-site", "Lint, type checks, unit, end-to-end and privacy checks run on every pull request."),
    ],
    related: ["docker", "git", "testing"],
  },
  {
    id: "git",
    name: "Git & GitHub",
    aliases: ["git", "github", "version control"],
    category: "devops",
    tech: ["github", "git"],
    uses: [
      u("this-site", "Branches, pull requests and reviews for this portfolio."),
      u("aegis-ai", "Public repository with CI."),
      u("sourceatlas", "Public repository with gitleaks and pip-audit checks."),
    ],
    related: ["github-actions"],
  },
  {
    id: "testing",
    name: "Automated testing",
    aliases: ["testing", "unit tests", "test automation", "e2e", "end to end testing", "qa"],
    category: "devops",
    uses: [
      u("rightrev", "Automated SQL and JSON validation tests for financial reporting."),
      u("flare-innovation", "Automated PyTest schema validation."),
      u("sourceatlas", "pytest, Vitest and Playwright, with mypy --strict and ruff."),
      u("workmesh", "Vitest, Jest with Supertest, and Playwright."),
    ],
    related: ["pytest", "playwright", "github-actions"],
  },
  {
    id: "pytest",
    name: "pytest",
    aliases: ["py test", "pytest"],
    category: "devops",
    tech: ["pytest"],
    uses: [
      u("flare-innovation", "Automated PyTest schema validation in the ETL pipelines."),
      u("tunelab", "pytest suite in CI."),
      u("sourceatlas", "pytest suite alongside mypy --strict and ruff."),
      u("insightforge", "Python back end tested with pytest."),
    ],
    related: ["testing", "python"],
  },
  {
    id: "playwright",
    name: "Playwright & Vitest",
    aliases: ["playwright", "vitest", "jest", "supertest"],
    category: "devops",
    uses: [
      u("sourceatlas", "Vitest and Playwright for the front end."),
      u("tunelab", "Vitest and Playwright in CI."),
      u("reviewpilot", "Vitest and Playwright."),
      u("workmesh", "Vitest, Jest with Supertest, and Playwright."),
      u("this-site", "Vitest unit tests and Playwright end-to-end tests on every pull request."),
    ],
    related: ["testing"],
  },
  {
    id: "prometheus",
    name: "Prometheus monitoring",
    aliases: ["prometheus", "monitoring", "observability", "metrics", "alerting"],
    category: "devops",
    uses: [
      u("google-mlops-expo", "Prometheus and Slack alerts surface service failures."),
      u("aegis-ai", "Prometheus metrics from the API."),
    ],
    related: ["mlops", "docker"],
  },
  {
    id: "vercel",
    name: "Vercel",
    aliases: ["vercel deploy"],
    category: "devops",
    tech: ["vercel"],
    uses: [u("this-site", "This portfolio deploys to Vercel from the main branch.")],
    related: ["nextjs", "github-actions"],
  },

  /* ---------------------------------------------- Analytics & Visualization */
  {
    id: "powerbi",
    name: "Power BI",
    aliases: ["power bi", "powerbi", "microsoft power bi"],
    category: "analytics",
    tech: ["powerbi"],
    uses: [u("flare-innovation", "Power BI dashboards integrating PostgreSQL and Airtable APIs to track operational KPIs for engineering and business teams.")],
    related: ["dashboards", "tableau", "sql"],
  },
  {
    id: "tableau",
    name: "Tableau",
    aliases: ["tableau public", "tableau desktop"],
    category: "analytics",
    tech: ["tableau"],
    uses: [u("tableau-public", "Three public dashboards on his Tableau Public profile.")],
    related: ["dashboards", "powerbi"],
  },
  {
    id: "dashboards",
    name: "Dashboards & KPI reporting",
    aliases: ["dashboards", "dashboard", "reporting", "kpis", "kpi", "business intelligence", "bi", "data visualization", "visualization"],
    category: "analytics",
    uses: [
      u("flare-innovation", "Power BI dashboards tracking operational KPIs."),
      u("rightrev", "Automated financial reporting with AI agents, so teams get revenue insights without manual analysis."),
      u("tableau-public", "Three public Tableau dashboards."),
    ],
    related: ["powerbi", "tableau", "plotly"],
  },
  {
    id: "plotly",
    name: "Plotly",
    aliases: ["plotly.js", "plotly js"],
    category: "analytics",
    tech: ["plotly"],
    uses: [
      u("insightforge", "Chart Studio for analysis results."),
      u("tunelab", "Training and evaluation charts."),
    ],
    related: ["dashboards"],
  },
  {
    id: "statistics",
    name: "Statistical analysis",
    aliases: ["statistics", "stats", "statistical analysis", "a/b testing", "hypothesis testing", "data analysis", "analytics"],
    category: "analytics",
    uses: [
      u("insightforge", "12 typed statistical operations (SciPy and statsmodels), with every reported number verified."),
      u("flare-innovation", "Data analyst work: operational KPIs and sensor anomaly detection."),
    ],
    related: ["pandas", "dashboards"],
  },
];

/* ------------------------------------------------------------ related topics */
/**
 * Technologies with no documented usage, mapped to verified skills that
 * overlap in purpose. `kind`: "related" = a close neighbour (same job, a
 * different product); "transferable" = shared concepts, a different tool
 * category. Never presented or announced as direct experience.
 */
export type RelatedTopic = {
  id: string;
  name: string;
  aliases: string[];
  kind: "related" | "transferable";
  /** Verified skill ids that overlap. */
  via: string[];
  /** One sentence for the explorer card, in the "Looking for X?" voice. */
  summary: string;
  /** What overlaps and what does not; shown on the card and given to Sree AI. */
  overlap: string;
};

export const relatedTopics: RelatedTopic[] = [
  {
    id: "databricks",
    name: "Databricks",
    aliases: ["databricks", "data bricks", "delta lake", "lakehouse", "unity catalog", "databricks sql"],
    kind: "related",
    via: ["snowflake", "spark", "dbt"],
    summary: "Looking for Databricks? Sree has worked with Snowflake and Apache Spark in related data engineering workflows.",
    overlap: "Databricks is a Spark-based lakehouse platform. His PySpark processing and his Snowflake warehouse work cover overlapping concepts (distributed processing, SQL transformations, governed data), but they are different platforms and Databricks-specific usage is not documented.",
  },
  {
    id: "cloud-warehouses",
    name: "BigQuery, Redshift or Synapse",
    aliases: ["bigquery", "google bigquery", "redshift", "amazon redshift", "azure synapse", "synapse", "data warehouse", "data warehousing", "cloud data warehouse"],
    kind: "related",
    via: ["snowflake", "sql", "dbt"],
    summary: "Looking for a cloud data warehouse? His documented warehouse work is on Snowflake.",
    overlap: "Snowflake, BigQuery, Redshift and Synapse are all cloud data warehouses queried with SQL. His experience is Snowflake (RightRev) and dbt modelling; the other warehouses are not documented.",
  },
  {
    id: "stream-processing",
    name: "Flink, Kinesis or Pub/Sub",
    aliases: ["flink", "apache flink", "kinesis", "aws kinesis", "pub/sub", "pubsub", "google pub/sub", "spark streaming", "event hubs"],
    kind: "related",
    via: ["kafka", "etl"],
    summary: "Looking for stream processing? Sree built a Kafka-API streaming pipeline on Redpanda.",
    overlap: "His streaming work uses the Kafka API (Redpanda): partitioned topics, idempotent producers, offset commits and a dead-letter topic. Flink, Kinesis and Pub/Sub themselves are not documented.",
  },
  {
    id: "orchestrators",
    name: "Dagster, Prefect or Luigi",
    aliases: ["dagster", "prefect", "luigi", "step functions", "aws step functions", "workflow orchestration", "orchestration", "data orchestration", "argo"],
    kind: "related",
    via: ["airflow"],
    summary: "Looking for workflow orchestration? Sree has used Apache Airflow.",
    overlap: "Airflow, Dagster, Prefect and Luigi all schedule and orchestrate data pipelines. His documented orchestrator is Airflow (Charlie and MLOps coursework); the others are not documented.",
  },
  {
    id: "agent-frameworks",
    name: "LangChain, LlamaIndex, CrewAI or AutoGen",
    aliases: ["langchain", "lang chain", "llamaindex", "llama index", "crewai", "crew ai", "autogen", "semantic kernel", "openai agents sdk"],
    kind: "related",
    via: ["langgraph", "ai-agents", "rag"],
    summary: "Looking for an agent framework? Sree builds agents with LangGraph.",
    overlap: "LangGraph comes from the LangChain ecosystem and solves the same agent-orchestration problems as LlamaIndex, CrewAI and AutoGen. His documented agent work uses LangGraph and Snowflake Cortex; these other frameworks are not documented.",
  },
  {
    id: "vector-dbs",
    name: "Pinecone, Weaviate, Chroma or FAISS",
    aliases: ["pinecone", "weaviate", "chroma", "chromadb", "faiss", "milvus", "qdrant", "elasticsearch", "opensearch"],
    kind: "related",
    via: ["pgvector", "rag"],
    summary: "Looking for a vector database? Sree has built hybrid retrieval on PostgreSQL with pgvector.",
    overlap: "His retrieval systems use pgvector HNSW plus Postgres full-text search with reciprocal rank fusion. Dedicated vector databases are not documented.",
  },
  {
    id: "deep-learning",
    name: "PyTorch, TensorFlow or Keras",
    aliases: ["pytorch", "torch", "tensorflow", "keras", "deep learning", "neural networks", "jax"],
    kind: "transferable",
    via: ["computer-vision", "lora", "machine-learning"],
    summary: "Looking for deep learning? Sree has trained YOLOv5 detectors and LoRA adapters.",
    overlap: "His documented deep-learning work is training YOLOv5 object detectors (with OpenCV) and LoRA fine-tuning with MLX. Writing models directly in PyTorch, TensorFlow or Keras is not documented.",
  },
  {
    id: "ml-platforms",
    name: "SageMaker or Vertex AI",
    aliases: ["sagemaker", "aws sagemaker", "vertex ai", "vertex", "kubeflow"],
    kind: "related",
    via: ["azure", "mlops", "mlflow"],
    summary: "Looking for a managed ML platform? Sree has deployed services on Azure ML.",
    overlap: "SageMaker, Vertex AI and Azure ML are managed ML platforms. His documented work is Dockerized Azure ML services with autoscaling and retraining, plus MLflow tracking; SageMaker and Vertex AI are not documented.",
  },
  {
    id: "kubernetes",
    name: "Kubernetes",
    aliases: ["kubernetes", "k8s", "helm", "eks", "aks", "gke", "container orchestration"],
    kind: "transferable",
    via: ["docker", "azure"],
    summary: "Looking for Kubernetes? Sree has containerized services with Docker.",
    overlap: "Kubernetes orchestrates containers. His documented container work is Docker and Docker Compose, and Dockerized Azure ML services with autoscaling; Kubernetes itself is not documented.",
  },
  {
    id: "aws-services",
    name: "AWS services (EC2, S3, Lambda)",
    aliases: ["ec2", "s3", "lambda", "aws lambda", "aurora", "dynamodb", "cloudwatch", "aws glue", "glue", "athena", "gcp", "google cloud", "google cloud platform"],
    kind: "transferable",
    via: ["azure", "docker", "aws"],
    summary: "Looking for hands-on AWS or Google Cloud? His documented cloud deployment work is on Azure.",
    overlap: "He has deployed Dockerized services on Azure ML and completed the AWS Cloud Practitioner Essentials training course. Hands-on work with these AWS or Google Cloud services is not documented.",
  },
  {
    id: "relational-dbs",
    name: "MySQL, SQL Server or Oracle",
    aliases: ["mysql", "sql server", "mssql", "microsoft sql server", "oracle", "oracle db", "mariadb", "t-sql", "tsql", "pl/sql"],
    kind: "related",
    via: ["postgresql", "sql"],
    summary: "Looking for a relational database? Sree works extensively with PostgreSQL and SQL.",
    overlap: "MySQL, SQL Server and Oracle are relational databases like PostgreSQL. His documented database work is PostgreSQL, Snowflake SQL, DuckDB and SQLite; these engines are not documented.",
  },
  {
    id: "nosql",
    name: "MongoDB or other NoSQL",
    aliases: ["mongodb", "mongo", "nosql", "cassandra", "dynamo", "couchbase", "firestore"],
    kind: "transferable",
    via: ["redis", "postgresql"],
    summary: "Looking for NoSQL? His documented data stores are PostgreSQL and Redis.",
    overlap: "Redis is a key-value store he has used for queues and caching; his primary databases are relational. Document databases such as MongoDB are not documented.",
  },
  {
    id: "frontend-frameworks",
    name: "Vue, Angular or Svelte",
    aliases: ["vue", "vue.js", "vuejs", "angular", "angularjs", "svelte", "sveltekit", "remix", "nuxt"],
    kind: "related",
    via: ["react", "typescript", "nextjs"],
    summary: "Looking for a frontend framework? Sree builds with React, Next.js and TypeScript.",
    overlap: "Vue, Angular and Svelte solve the same component-based UI problems as React. His documented front-end work is React, Next.js and TypeScript; these frameworks are not documented.",
  },
  {
    id: "python-web",
    name: "Django or Flask",
    aliases: ["django", "flask", "django rest framework", "drf"],
    kind: "related",
    via: ["fastapi", "python"],
    summary: "Looking for Django or Flask? Sree builds Python APIs with FastAPI.",
    overlap: "Django, Flask and FastAPI are Python web frameworks. His documented Python APIs use FastAPI with Pydantic and SQLAlchemy; Django and Flask are not documented.",
  },
  {
    id: "node-frameworks",
    name: "Express",
    aliases: ["express", "express.js", "expressjs", "fastify", "koa"],
    kind: "related",
    via: ["nodejs", "typescript"],
    summary: "Looking for Express? Sree builds Node.js back ends with NestJS.",
    overlap: "NestJS is a Node.js framework for the same server-side work as Express. His documented Node.js back ends use NestJS; Express itself is not documented.",
  },
  {
    id: "bi-tools",
    name: "Looker, Qlik or Superset",
    aliases: ["looker", "looker studio", "qlik", "qlikview", "superset", "apache superset", "metabase", "excel dashboards"],
    kind: "related",
    via: ["powerbi", "tableau", "dashboards"],
    summary: "Looking for a BI tool? Sree has built dashboards in Power BI and Tableau.",
    overlap: "Looker, Qlik and Superset are BI tools like Power BI and Tableau. His documented BI work is Power BI (Flare Innovation) and public Tableau dashboards; these tools are not documented.",
  },
  {
    id: "ci-tools",
    name: "Jenkins, GitLab CI or CircleCI",
    aliases: ["jenkins", "gitlab", "gitlab ci", "circleci", "circle ci", "azure devops", "travis"],
    kind: "related",
    via: ["github-actions"],
    summary: "Looking for CI/CD? Sree sets up pipelines with GitHub Actions.",
    overlap: "Jenkins, GitLab CI and CircleCI run the same build and test pipelines as GitHub Actions. His documented CI/CD is GitHub Actions; these tools are not documented.",
  },
  {
    id: "nlp",
    name: "NLP",
    aliases: ["nlp", "natural language processing", "text classification", "spacy", "nltk", "transformers"],
    kind: "related",
    via: ["llm-apps", "rag", "lora"],
    summary: "Looking for NLP? His documented language work is LLM-based: RAG, agents and LoRA fine-tuning.",
    overlap: "His language work uses LLMs (retrieval-augmented generation, agents, LoRA fine-tuning and evaluation). Classical NLP pipelines and libraries such as spaCy or NLTK are not documented.",
  },
];

/* ------------------------------------------------------------ lookup helpers */
export const skillById = new Map(skills.map((s) => [s.id, s]));
export const topicById = new Map(relatedTopics.map((t) => [t.id, t]));

/** Usage contexts for a marquee technology id (logo id), strongest first. */
export function usageForTech(techId: string): string[] {
  const out: string[] = [];
  for (const s of skills) if (s.tech?.includes(techId)) for (const x of s.uses) if (!out.includes(x.at)) out.push(x.at);
  return out;
}

export const categoryLabel = (c: SkillCategory) => SKILL_CATEGORIES.find((x) => x.id === c)!.label;
