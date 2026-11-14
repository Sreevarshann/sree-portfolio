/**
 * Verified project catalog. Every fact here comes from the public repository
 * (README, docs/, CI) as audited in docs/CONTENT_INVENTORY.md. None of these
 * projects is publicly deployed; each runs locally via Docker Compose or dev servers.
 */
export type Category = "AI/ML" | "Data Engineering" | "Full Stack";

export type ArchNode = {
  id: string;
  label: string;
  sub?: string;
  /** grid column (0-based) and row (0-based) */
  col: number;
  row: number;
  kind?: "client" | "service" | "store" | "model" | "queue";
};

export type Project = {
  slug: string;
  name: string;
  repo: string;
  repoUrl: string;
  liveUrl?: string;
  year: string;
  status: "Complete" | "Complete · actively extended";
  categories: Category[];
  tagline: string;
  oneLiner: string;
  problem: string;
  overview: string;
  features: string[];
  planned: string[];
  stack: { group: string; items: string[] }[];
  architecture: { cols: number; rows: number; nodes: ArchNode[]; edges: [string, string, string?][]; caption: string };
  challenges: { title: string; body: string }[];
  decisions: string[];
  tests: { label: string; value: string }[];
  ci: string;
  metrics: { value: string; label: string }[];
  screenshots: { src: string; alt: string; caption: string; width: number; height: number }[];
  /** Signature hue for this project's showcase (decorative only; text keeps theme colours). */
  accent: string;
  credit?: string;
  runNote: string;
};

const GH = "https://github.com/Sreevarshann";

export const projects: Project[] = [
  {
    slug: "aegis-ai",
    name: "AEGIS AI",
    repo: "aegis-ai-real-time-fraud-platform",
    repoUrl: `${GH}/aegis-ai-real-time-fraud-platform`,
    year: "2026",
    status: "Complete",
    categories: ["AI/ML", "Data Engineering", "Full Stack"],
    tagline: "Real-time fraud detection and autonomous investigation",
    oneLiner:
      "A streaming fraud platform that scores card transactions as they happen and explains every alert, built on synthetic data.",
    problem:
      "Card fraud has to be caught while the payment is in flight, and analysts need to know why something was flagged. That takes a streaming pipeline that stays correct when events arrive duplicated, out of order or malformed, features that are identical offline and online, honest model metrics and an investigation step that never invents evidence.",
    overview:
      "A seeded simulator generates 60,000 customers and 1,200 merchants across two tenants, with five fraud scenarios and deliberately injected defects. Events flow through Redpanda into a consumer that validates, applies watermarks, deduplicates, computes features in Redis, scores with a calibrated model and persists atomically. dbt models the warehouse, LangGraph runs tool-based investigations, and a six-page React dashboard shows it all.",
    features: [
      "Idempotent producer → transactions.v1 (3 partitions) → consumer that commits offsets only after the database commit",
      "Dead-letter topic plus a quarantine table for malformed events",
      "dbt project with 3 staging models, 7 marts and 23 tests",
      "Logistic regression vs. histogram gradient boosting with Platt calibration, MLflow tracking, PSI drift and counterfactual explanations",
      "LangGraph investigations using 6 tools, with an optional local-LLM narration gate",
      "JWT auth with three RBAC roles and Prometheus metrics",
    ],
    planned: ["Incremental dbt models", "Schema registry", "Exactly-once DLQ", "SHAP explanations", "Scheduled retraining", "Kubernetes with autoscaling", "OpenTelemetry tracing"],
    stack: [
      { group: "Streaming & data", items: ["Redpanda (Kafka API)", "PostgreSQL 16", "Redis 7", "dbt Core 1.9"] },
      { group: "ML & agents", items: ["scikit-learn", "pandas", "MLflow 3", "LangGraph", "Ollama (optional)"] },
      { group: "Backend", items: ["Python 3.11", "FastAPI", "Pydantic v2", "SQLAlchemy 2", "confluent-kafka", "Prometheus client"] },
      { group: "Frontend & ops", items: ["React 18", "TypeScript", "Vite", "Tailwind", "TanStack Query", "Recharts", "Docker Compose", "nginx"] },
    ],
    architecture: {
      cols: 5,
      rows: 3,
      nodes: [
        { id: "sim", label: "Simulator", sub: "seeded scenarios", col: 0, row: 0, kind: "client" },
        { id: "topic", label: "Redpanda", sub: "transactions.v1", col: 1, row: 0, kind: "queue" },
        { id: "consumer", label: "Consumer", sub: "validate · dedup · score", col: 2, row: 0, kind: "service" },
        { id: "redis", label: "Redis", sub: "online features", col: 2, row: 1, kind: "store" },
        { id: "dlq", label: "DLQ", sub: "quarantine", col: 1, row: 1, kind: "queue" },
        { id: "pg", label: "PostgreSQL", sub: "events · alerts", col: 3, row: 0, kind: "store" },
        { id: "dbt", label: "dbt", sub: "marts every 2 min", col: 3, row: 1, kind: "service" },
        { id: "trainer", label: "Trainer", sub: "MLflow · model", col: 2, row: 2, kind: "model" },
        { id: "api", label: "FastAPI", sub: "JWT · RBAC", col: 4, row: 0, kind: "service" },
        { id: "agent", label: "LangGraph", sub: "investigations", col: 4, row: 1, kind: "model" },
        { id: "ui", label: "React UI", sub: "6 pages", col: 4, row: 2, kind: "client" },
      ],
      edges: [
        ["sim", "topic"],
        ["topic", "consumer"],
        ["consumer", "redis"],
        ["consumer", "dlq", "rejects"],
        ["consumer", "pg", "atomic write"],
        ["pg", "dbt"],
        ["trainer", "consumer", "model"],
        ["pg", "api"],
        ["api", "agent"],
        ["api", "ui"],
      ],
      caption: "Event path from simulator to dashboard. Offsets are committed only after PostgreSQL commits, so redelivery is safe.",
    },
    challenges: [
      { title: "A label leak hiding in the simulator", body: "Early results looked too good: 41 of 183 normal transactions were alerting for a reason tied to how scenarios were generated. The simulation artifact was removed before any metric was reported." },
      { title: "Train/serve skew", body: "Merchant features were computed differently offline and online. The fix was to share one feature implementation between the trainer and the streaming scorer." },
      { title: "Watermarks per partition", body: "A global watermark wrongly marked 1,918 of 2,796 burst events as late. Watermarks are now tracked per partition." },
      { title: "Hostile bytes", body: "Malformed events with NUL bytes broke inserts into the quarantine table, so they are escaped before storage." },
    ],
    decisions: [
      "Redpanda instead of Kafka for a single-binary, Kafka-compatible local stack",
      "At-least-once delivery with idempotent writes instead of Kafka transactions",
      "The same feature code offline and online",
      "Calibrated probabilities so the alert threshold means something",
    ],
    tests: [
      { label: "Backend unit", value: "42" },
      { label: "Backend integration", value: "14" },
      { label: "Frontend", value: "11" },
      { label: "Playwright", value: "7" },
      { label: "dbt tests", value: "23" },
      { label: "Smoke checks", value: "9" },
    ],
    ci: "Latest GitHub Actions run on main: passing",
    metrics: [
      { value: "0.863", label: "F1, gradient boosting (test split)" },
      { value: "0.926", label: "PR-AUC on 2.18% fraud prevalence" },
      { value: "0.30%", label: "alert rate on normal traffic" },
    ],
    screenshots: [
      { src: "/projects/aegis/01-overview.webp", alt: "AEGIS overview dashboard with live transaction volume and alert counts", caption: "Overview: live volume, alert rate and pipeline health", width: 1600, height: 1789 },
      { src: "/projects/aegis/05-investigation-report.webp", alt: "Investigation report generated by the LangGraph agent", caption: "Investigation report built only from tool evidence", width: 1600, height: 1801 },
      { src: "/projects/aegis/07-model-intelligence.webp", alt: "Model intelligence page comparing models and drift", caption: "Model intelligence: calibration, comparison and drift", width: 1600, height: 1894 },
      { src: "/projects/aegis/02-live-transactions.webp", alt: "Live transactions table with risk scores", caption: "Live transactions with risk scores", width: 1600, height: 1000 },
    ],
    accent: "#FF7A59",
    runNote: "Runs locally with Docker Compose (`make demo`). Synthetic data only; not publicly deployed.",
  },
  {
    slug: "nexus-ai",
    name: "NEXUS AI",
    repo: "nexus-ai-agent-workspace",
    repoUrl: `${GH}/nexus-ai-agent-workspace`,
    year: "2026",
    status: "Complete · actively extended",
    categories: ["AI/ML", "Data Engineering", "Full Stack"],
    tagline: "Multi-agent research and execution workspace",
    oneLiner:
      "A local-first AI workspace where every answer keeps its plan, its agents, its sources and the SQL behind each number.",
    problem:
      "Most AI apps return one opaque answer. NEXUS persists everything that produced it: the plan, the agents that ran, every tool call, the cited passage, the query behind each figure and a verification report - so a result can be inspected, replayed and exported.",
    overview:
      "Missions run as a LangGraph graph: a planner proposes steps, a human approves, research, document and data agents execute, then a synthesizer, an evidence verifier and an artifact generator finish the job. Missions can pause, resume, cancel and retry from a checkpoint. The workspace also includes a knowledge library with hybrid retrieval, a DuckDB data lab, an artifact studio, a workflow builder and an authenticated MCP server.",
    features: [
      "Streaming chat workspace with four modes",
      "Mission Control: Planner → Human approval → Research / Document / Data agents → Synthesizer → Evidence verifier → Artifact generator",
      "Pause, resume, cancel and retry-from-checkpoint via a Postgres checkpointer",
      "Knowledge library with pgvector + full-text retrieval fused by RRF, plus a PDF viewer",
      "Data Lab with a DuckDB sandbox, guarded SQL and typed operations",
      "Authenticated MCP server over Streamable HTTP",
    ],
    planned: ["Consuming external MCP servers", "OCR", "NLI-based verification", "Reranker", "Multi-worker scaling", "OpenTelemetry"],
    stack: [
      { group: "Agents & AI", items: ["LangGraph", "Ollama (qwen3:4b-instruct)", "nomic-embed-text", "MCP", "SearXNG"] },
      { group: "Data", items: ["PostgreSQL + pgvector", "DuckDB", "sqlglot", "Redis", "arq"] },
      { group: "Application", items: ["FastAPI", "Next.js 16", "React 19", "Monaco", "Radix"] },
    ],
    architecture: {
      cols: 4,
      rows: 3,
      nodes: [
        { id: "ui", label: "Next.js UI", sub: "workspace · missions", col: 0, row: 1, kind: "client" },
        { id: "mcp", label: "MCP client", sub: "bearer token", col: 0, row: 2, kind: "client" },
        { id: "api", label: "FastAPI", sub: "REST · SSE", col: 1, row: 1, kind: "service" },
        { id: "worker", label: "arq worker", sub: "LangGraph missions", col: 2, row: 0, kind: "service" },
        { id: "pg", label: "Postgres", sub: "pgvector · checkpoints", col: 2, row: 2, kind: "store" },
        { id: "redis", label: "Redis", sub: "streams · queue", col: 2, row: 1, kind: "queue" },
        { id: "llm", label: "Ollama", sub: "qwen3 · embeddings", col: 3, row: 0, kind: "model" },
        { id: "web", label: "SearXNG", sub: "web research", col: 3, row: 1, kind: "service" },
        { id: "duck", label: "DuckDB", sub: "data lab sandbox", col: 3, row: 2, kind: "store" },
      ],
      edges: [
        ["ui", "api", "SSE"],
        ["mcp", "api"],
        ["api", "redis"],
        ["api", "pg"],
        ["redis", "worker"],
        ["worker", "llm"],
        ["worker", "web"],
        ["worker", "pg"],
        ["api", "duck"],
      ],
      caption: "API and worker share Postgres (vectors, checkpoints) and Redis (chat streams, task queue). Models run locally through Ollama.",
    },
    challenges: [
      { title: "Small models, structured output", body: "A 4B local model doesn't reliably emit valid plans. Constrained decoding plus a single repair retry made outputs dependable without a bigger model." },
      { title: "Plans that stay on the rails", body: "Instead of free-form plans, the analyst agent selects from a derived catalog of operations, which keeps execution safe and testable." },
      { title: "Durable human approval", body: "Missions pause for approval and must survive restarts. A LangGraph Postgres checkpointer makes interrupts durable." },
    ],
    decisions: [
      "Deterministic evidence verifier instead of an LLM judge",
      "Redis streams for chat; Postgres plus pub/sub for tasks",
      "Self-hosted SearXNG for web research",
      "No arbitrary code execution anywhere in the agent loop",
    ],
    tests: [
      { label: "Backend", value: "146" },
      { label: "Frontend (Vitest)", value: "20" },
      { label: "Offline", value: "49" },
      { label: "Playwright journey", value: "1" },
    ],
    ci: "Latest GitHub Actions run on main: passing",
    metrics: [
      { value: "6/6", label: "citation grounding checks" },
      { value: "8/8", label: "unsafe SQL statements blocked" },
      { value: "0/5", label: "canary leaks" },
    ],
    screenshots: [
      { src: "/projects/nexus/mission-control-1440.webp", alt: "Mission Control showing a multi-agent mission timeline", caption: "Mission Control: plan, approval and agent timeline", width: 1440, height: 900 },
      { src: "/projects/nexus/citation-inspector.webp", alt: "Citation inspector highlighting a source passage", caption: "Citation inspector linking claims to passages", width: 1440, height: 900 },
      { src: "/projects/nexus/data-lab-chart.webp", alt: "Data Lab with a generated chart over DuckDB data", caption: "Data Lab: guarded SQL over DuckDB", width: 1440, height: 900 },
      { src: "/projects/nexus/workspace-conversation-1440.webp", alt: "Streaming conversation workspace", caption: "Streaming workspace conversation", width: 1440, height: 900 },
    ],
    accent: "#9B7BFF",
    credit: "Evaluation quality gates were contributed by collaborator rithika-sr (merged PR #1).",
    runNote: "Runs locally with Docker Compose and Ollama. Not publicly deployed.",
  },
  {
    slug: "sourceatlas",
    name: "SourceAtlas",
    repo: "sourceatlas-agentic-rag",
    repoUrl: `${GH}/sourceatlas-agentic-rag`,
    year: "2026",
    status: "Complete",
    categories: ["AI/ML", "Full Stack"],
    tagline: "Agentic RAG with verified citations",
    oneLiner:
      "A research engine that checks every claim against the passage it cites, surfaces conflicts between documents and abstains when it can't verify.",
    problem:
      "\"Chat with your docs\" tools produce fluent prose whose citations often don't support it. SourceAtlas treats an answer as a list of claims, verifies each claim against its cited passage, keeps page, section and version provenance, and refuses to answer when the evidence isn't there.",
    overview:
      "A bounded LangGraph pipeline understands the question, runs hybrid retrieval, checks whether the evidence is sufficient, reformulates up to three times, reranks, detects conflicts, drafts, verifies each claim and either answers or abstains. Retrieved passages are screened for prompt injection, and web ingestion is SSRF-safe.",
    features: [
      "Hybrid search: pgvector HNSW + Postgres full-text (GIN), fused with reciprocal rank fusion (k=60)",
      "Claim-level verification against cited passages",
      "Conflict detection across documents and versions",
      "Prompt-injection quarantine for retrieved text and SSRF-safe web ingestion",
      "Ingestion of PDF, DOCX, HTML and TXT with document versions",
      "Evidence graph (React Flow), pdf.js viewer with cited-passage highlighting and an evaluation dashboard",
    ],
    planned: ["Cross-encoder reranking", "NLI-based claim checking", "OCR", "Queue-based ingestion", "Per-user access control"],
    stack: [
      { group: "Retrieval & agents", items: ["LangGraph", "PostgreSQL 16 + pgvector", "Ollama (qwen3:4b-instruct)", "nomic-embed-text"] },
      { group: "Backend", items: ["Python 3.13", "FastAPI", "Pydantic 2", "SQLAlchemy 2", "Alembic", "PyMuPDF", "httpx"] },
      { group: "Frontend", items: ["Next.js 16", "React 19", "Tailwind 4", "React Flow", "pdf.js", "Plotly"] },
      { group: "Quality", items: ["ruff", "mypy --strict", "pytest", "Vitest", "Playwright", "pip-audit", "gitleaks"] },
    ],
    architecture: {
      cols: 4,
      rows: 3,
      nodes: [
        { id: "ui", label: "Research UI", sub: "REST · SSE", col: 0, row: 1, kind: "client" },
        { id: "api", label: "FastAPI", col: 1, row: 1, kind: "service" },
        { id: "ingest", label: "Ingestion", sub: "extract · chunk · embed", col: 2, row: 0, kind: "service" },
        { id: "graph", label: "LangGraph", sub: "retrieve → verify", col: 2, row: 2, kind: "model" },
        { id: "pg", label: "Postgres", sub: "pgvector + tsvector", col: 3, row: 1, kind: "store" },
        { id: "llm", label: "Ollama", sub: "qwen3 · nomic", col: 3, row: 2, kind: "model" },
      ],
      edges: [
        ["ui", "api"],
        ["api", "ingest"],
        ["api", "graph"],
        ["ingest", "pg", "chunks"],
        ["graph", "pg", "RRF"],
        ["graph", "llm"],
      ],
      caption: "One Postgres holds metadata, vectors and full text. The agent is bounded: at most three reformulation rounds.",
    },
    challenges: [
      { title: "From 190 seconds to 13", body: "An unbounded agent loop was too slow. Bounding the graph cut median latency from about 190 s to about 13 s." },
      { title: "Verifying without another LLM", body: "Claims are checked deterministically against their passages rather than by an LLM judge, so verification is reproducible." },
      { title: "Hostile passages", body: "Injected instructions inside documents are sanitised and quarantined rather than silently dropped, keeping provenance intact." },
    ],
    decisions: [
      "One Postgres for metadata, vectors and full-text search",
      "Reciprocal rank fusion rather than tuned score weights",
      "Answers as lists of claims, not paragraphs",
      "The model's collection guess is a hint, not a filter",
    ],
    tests: [
      { label: "pytest", value: "76 passed" },
      { label: "Playwright E2E", value: "7/7" },
      { label: "Vitest", value: "2/2" },
    ],
    ci: "Latest GitHub Actions run on main: passing",
    metrics: [
      { value: "92.3%", label: "answer correctness, live eval (16 questions)" },
      { value: "95.8%", label: "citation correctness, live eval" },
      { value: "1.00", label: "Recall@5" },
    ],
    screenshots: [
      { src: "/projects/sourceatlas/03-research-answer.webp", alt: "Research answer broken into verified claims with citations", caption: "Answers as verified claims with citations", width: 1440, height: 900 },
      { src: "/projects/sourceatlas/04-evidence-graph.webp", alt: "Evidence graph connecting claims, passages and documents", caption: "Evidence graph", width: 1440, height: 900 },
      { src: "/projects/sourceatlas/06-pdf-highlight.webp", alt: "PDF viewer highlighting the cited passage", caption: "Cited passage highlighted in the source PDF", width: 1440, height: 900 },
      { src: "/projects/sourceatlas/07-evaluation.webp", alt: "Evaluation dashboard with retrieval and answer metrics", caption: "Evaluation dashboard", width: 1440, height: 2426 },
    ],
    accent: "#2FC4B2",
    runNote: "Runs locally with Docker Compose and Ollama. Single-tenant, not publicly deployed.",
  },
  {
    slug: "tunelab",
    name: "TuneLab",
    repo: "tunelab-llm-finetuning",
    repoUrl: `${GH}/tunelab-llm-finetuning`,
    year: "2026",
    status: "Complete",
    categories: ["AI/ML", "Full Stack"],
    tagline: "LoRA fine-tuning with honest evaluation",
    oneLiner:
      "Trains LoRA adapters for a small LLM on Apple Silicon and proves what changed by evaluating against the frozen base model on identical prompts.",
    problem:
      "Fine-tuning demos usually show a loss curve and a cherry-picked example. TuneLab trains LoRA adapters with MLX-LM and evaluates each one against the frozen base model on the same data, prompt and decoding, including a held-out split of phrasings the model never saw during training.",
    overview:
      "A FastAPI backend dispatches training and evaluation jobs to an isolated worker subprocess, streams live loss curves over SSE and records everything in SQLite. Each run verifies that weights actually changed (lora_b norm from 0 to above 0) and stores the adapter's SHA-256. A Next.js UI compares runs, shows base-vs-LoRA outputs side by side and offers a playground.",
    features: [
      "Deterministic synthetic ticket-triage dataset, plus chat JSONL upload with validation and hash-based splits",
      "LoRA training in a worker subprocess with live SSE loss curves, cancel and crash recovery",
      "Weight-update verification and adapter SHA-256",
      "Automatic baseline and tuned evaluation: JSON validity, per-field accuracy, teacher-forced loss",
      "Run comparison, base-vs-LoRA playground and adapter download",
    ],
    planned: ["More paraphrase diversity for urgency phrasing", "Multiple seeds per configuration"],
    stack: [
      { group: "Training", items: ["MLX 0.32", "mlx-lm", "Qwen2.5-0.5B-Instruct (4-bit)", "LoRA"] },
      { group: "Backend", items: ["FastAPI", "SQLAlchemy", "SQLite (WAL)", "SSE"] },
      { group: "Frontend", items: ["Next.js 16", "React 19", "TanStack Query", "Tailwind 4", "Plotly"] },
      { group: "Quality", items: ["pytest", "Vitest", "Playwright", "Docker", "GitHub Actions"] },
    ],
    architecture: {
      cols: 4,
      rows: 2,
      nodes: [
        { id: "ui", label: "Next.js", sub: "runs · compare · playground", col: 0, row: 0, kind: "client" },
        { id: "api", label: "FastAPI", sub: "jobs · SSE", col: 1, row: 0, kind: "service" },
        { id: "db", label: "SQLite", sub: "datasets · jobs · events", col: 1, row: 1, kind: "store" },
        { id: "disp", label: "Dispatcher", sub: "one job at a time", col: 2, row: 0, kind: "queue" },
        { id: "worker", label: "Worker process", sub: "train · evaluate", col: 3, row: 0, kind: "model" },
        { id: "files", label: "Adapters", sub: "safetensors · SHA-256", col: 3, row: 1, kind: "store" },
      ],
      edges: [
        ["ui", "api", "/api"],
        ["api", "db"],
        ["api", "disp"],
        ["disp", "worker"],
        ["worker", "files"],
        ["worker", "db", "events"],
      ],
      caption: "Each job runs in its own subprocess for memory isolation and safe cancellation; SSE replays stored job events.",
    },
    challenges: [
      { title: "Proving the adapter learned", body: "Loss alone can mislead, so every run checks the LoRA weight norm moved from zero and evaluates on held-out phrasings the model never trained on." },
      { title: "Real training in CI", body: "Instead of mocking training, Linux CI runs genuine LoRA steps on MLX's CPU backend with a tiny random model." },
      { title: "Fitting on a laptop", body: "A frozen 4-bit base with LoRA (QLoRA-style) kept peak memory under 3 GB on a 16 GB M4." },
    ],
    decisions: [
      "MLX on Apple Silicon rather than cloud GPUs",
      "Pinned base-model revision for reproducibility",
      "Identical prompt and decoding for base and tuned models",
      "One worker subprocess per job",
    ],
    tests: [
      { label: "pytest (incl. real LoRA training)", value: "27" },
      { label: "Vitest", value: "8" },
      { label: "Playwright (incl. a 10-step LoRA run)", value: "7" },
    ],
    ci: "Latest GitHub Actions run on main: passing",
    metrics: [
      { value: "8.3% → 100%", label: "all-fields exact match, test split" },
      { value: "5.0% → 63.3%", label: "on held-out phrasings" },
      { value: "0.59%", label: "of parameters trained (2.93M of 494M)" },
    ],
    screenshots: [
      { src: "/projects/tunelab/02-run-loss-verification.webp", alt: "Training run with live loss curve and weight verification", caption: "Live loss curve with weight-update verification", width: 1440, height: 900 },
      { src: "/projects/tunelab/03-base-vs-lora.webp", alt: "Base model versus LoRA adapter comparison", caption: "Base vs. LoRA on identical prompts", width: 1440, height: 900 },
      { src: "/projects/tunelab/05-compare.webp", alt: "Comparison of multiple fine-tuning runs", caption: "Run comparison", width: 1440, height: 1100 },
      { src: "/projects/tunelab/08-playground.webp", alt: "Playground for trying the base and tuned model", caption: "Playground", width: 1440, height: 900 },
    ],
    accent: "#F2B544",
    runNote: "Runs locally on Apple Silicon. Synthetic task, single seed per configuration; not publicly deployed.",
  },
  {
    slug: "insightforge",
    name: "InsightForge",
    repo: "insightforge-analyst-agent",
    repoUrl: `${GH}/insightforge-analyst-agent`,
    year: "2026",
    status: "Complete",
    categories: ["AI/ML", "Data Engineering", "Full Stack"],
    tagline: "An autonomous data analyst with sandboxed SQL",
    oneLiner:
      "Ask a question of your data; the LLM plans, typed operations and sandboxed SQL execute, and every number in the explanation is verified.",
    problem:
      "\"Chat with your data\" tools risk unsafe execution, wrong analysis and prose containing numbers nobody computed. InsightForge treats the model as a planner whose proposals are validated, runs everything in an OS-level sandbox and checks every number in the explanation against computed facts.",
    overview:
      "A LangGraph agent proposes typed statistical operations first and SQL second, with up to three repair attempts. Model-written SQL passes four layers of isolation before it touches data. Explanations are written with fact placeholders that a verifier fills from computed results, and charts are built server-side with Plotly.",
    features: [
      "Four-layer SQL isolation: SQLGlot AST policy → isolated Python worker → sandbox-exec / bubblewrap → locked DuckDB",
      "12 typed statistical operations",
      "Fact-placeholder explanations checked by a number verifier",
      "Ingestion of CSV, TSV, XLSX, Parquet and SQLite into versioned Parquet with profiling",
      "Chart Studio, Monaco query console with an audit log, saved analyses and export",
    ],
    planned: ["Warm sandbox pool", "PostgreSQL connector", "PDF export", "Larger-model evaluation", "Cross-filtering"],
    stack: [
      { group: "Analysis", items: ["DuckDB", "SQLGlot", "pandas", "NumPy", "SciPy", "statsmodels", "scikit-learn"] },
      { group: "Agent", items: ["LangGraph", "Ollama (qwen3:4b-instruct)"] },
      { group: "Application", items: ["FastAPI", "Pydantic 2", "SQLAlchemy 2", "Next.js 16", "Plotly", "Monaco"] },
    ],
    architecture: {
      cols: 4,
      rows: 3,
      nodes: [
        { id: "ui", label: "Next.js UI", sub: "REST · SSE", col: 0, row: 1, kind: "client" },
        { id: "api", label: "FastAPI", col: 1, row: 1, kind: "service" },
        { id: "agent", label: "LangGraph agent", sub: "plan · repair ×3", col: 2, row: 1, kind: "model" },
        { id: "llm", label: "Ollama", sub: "plan · explain", col: 2, row: 0, kind: "model" },
        { id: "policy", label: "SQLGlot policy", sub: "AST allow-list", col: 3, row: 0, kind: "service" },
        { id: "sandbox", label: "Sandboxed DuckDB", sub: "OS-level isolation", col: 3, row: 1, kind: "store" },
        { id: "verify", label: "Verifier", sub: "numbers · charts", col: 3, row: 2, kind: "service" },
        { id: "meta", label: "SQLite", sub: "metadata · audit", col: 1, row: 2, kind: "store" },
      ],
      edges: [
        ["ui", "api"],
        ["api", "agent"],
        ["api", "meta"],
        ["agent", "llm"],
        ["agent", "policy", "SQL"],
        ["policy", "sandbox"],
        ["agent", "verify"],
      ],
      caption: "The model never executes anything directly: proposals pass a policy check and run in an isolated worker against versioned Parquet.",
    },
    challenges: [
      { title: "Streaming through Next.js", body: "Next.js gzip buffered the SSE stream, so progress arrived all at once. A no-transform middleware fixed it." },
      { title: "Isolation that holds", body: "A query filter alone isn't a sandbox. Process-per-query isolation adds roughly 100-300 ms per statement, a deliberate trade for safety." },
      { title: "Numbers you can trust", body: "Explanations reference facts by placeholder, so the model cannot invent a figure that wasn't computed." },
    ],
    decisions: [
      "Typed operations first, SQL second",
      "Process-level sandbox rather than query filtering",
      "Parquet as the canonical store",
      "Server-built charts",
    ],
    tests: [
      { label: "pytest", value: "170 passed, 1 skipped" },
      { label: "Playwright E2E", value: "6/6" },
      { label: "Vitest", value: "12/12" },
    ],
    ci: "Latest GitHub Actions run on main: passing",
    metrics: [
      { value: "100%", label: "unsafe-SQL rejection and injection safety" },
      { value: "66.7%", label: "numerical correctness with a local 4B model" },
      { value: "4", label: "layers of SQL isolation" },
    ],
    screenshots: [
      { src: "/projects/insightforge/04-copilot-trend.webp", alt: "Analyst copilot answering a trend question with a chart", caption: "Copilot answer with a verified trend chart", width: 1440, height: 900 },
      { src: "/projects/insightforge/06-trace.webp", alt: "Execution trace of the analyst agent", caption: "Agent trace: plan, policy check, execution", width: 1440, height: 900 },
      { src: "/projects/insightforge/05-chart-studio.webp", alt: "Chart Studio for building Plotly charts", caption: "Chart Studio", width: 1440, height: 900 },
      { src: "/projects/insightforge/07-query-console.webp", alt: "Monaco SQL query console", caption: "Query console with audit log", width: 1440, height: 900 },
    ],
    accent: "#4C8DFF",
    runNote: "Runs locally with Ollama. No authentication; not publicly deployed.",
  },
  {
    slug: "reviewpilot",
    name: "ReviewPilot",
    repo: "reviewpilot-genai-saas",
    repoUrl: `${GH}/reviewpilot-genai-saas`,
    year: "2026",
    status: "Complete",
    categories: ["AI/ML", "Full Stack"],
    tagline: "Multi-tenant GenAI code-review SaaS",
    oneLiner:
      "Teams submit diffs; deterministic rules and a local LLM review them, and every model finding must quote the lines it cites or it is discarded.",
    problem:
      "AI code review is only useful if findings point at real code. ReviewPilot runs 17 deterministic rules first, then a grounded model pass whose findings must quote the exact diff lines they reference. Usage is metered against plan limits in a multi-tenant SaaS shell.",
    overview:
      "A NestJS API with session auth and tenant guards accepts diffs by paste, upload or HMAC-signed webhook. A BullMQ worker runs the review pipeline (parse, static rules, model, validate, persist) and streams progress over SSE. Findings can be triaged, commented on, compared across versions and exported to JSON, CSV, Markdown or SARIF 2.1.0.",
    features: [
      "Organizations with Owner, Admin, Reviewer and Viewer roles; email-bound invitations; audit log",
      "Cross-tenant access returns 404, never 403",
      "17 deterministic rules followed by a grounded model pass, streamed over SSE",
      "Triage (accept, dismiss, false positive, reopen), comments, versions and compare",
      "Export to JSON, CSV, Markdown and SARIF 2.1.0",
      "Plan limits, usage metering, org API tokens, idempotent submissions and retention",
    ],
    planned: ["MFA / SSO", "Real billing provider", "Production mail transport", "Git-host write-back", "Cloud deployment"],
    stack: [
      { group: "Backend", items: ["NestJS", "Prisma", "PostgreSQL 16", "BullMQ", "Redis 7", "Zod", "argon2id"] },
      { group: "AI", items: ["Ollama (qwen3:4b-instruct)", "Grounding validator"] },
      { group: "Frontend", items: ["Next.js 16", "React 19", "TanStack Query", "Tailwind 4", "Plotly"] },
      { group: "Quality", items: ["Vitest", "Playwright", "GitHub Actions", "gitleaks"] },
    ],
    architecture: {
      cols: 4,
      rows: 3,
      nodes: [
        { id: "ui", label: "Next.js", sub: "dashboard · triage", col: 0, row: 1, kind: "client" },
        { id: "ci", label: "CI webhook", sub: "HMAC-signed", col: 0, row: 2, kind: "client" },
        { id: "api", label: "NestJS API", sub: "auth · tenant guard", col: 1, row: 1, kind: "service" },
        { id: "queue", label: "BullMQ", sub: "review jobs", col: 2, row: 0, kind: "queue" },
        { id: "orch", label: "Orchestrator", sub: "rules → model → validate", col: 2, row: 1, kind: "service" },
        { id: "pg", label: "PostgreSQL", sub: "Prisma", col: 2, row: 2, kind: "store" },
        { id: "redis", label: "Redis", sub: "queue · pub/sub", col: 3, row: 0, kind: "store" },
        { id: "llm", label: "Ollama", sub: "qwen3:4b", col: 3, row: 1, kind: "model" },
      ],
      edges: [
        ["ui", "api"],
        ["ci", "api"],
        ["api", "queue"],
        ["queue", "orch"],
        ["queue", "redis"],
        ["orch", "llm"],
        ["orch", "pg"],
        ["api", "pg"],
      ],
      caption: "Rules run first; the model's findings are kept only if they quote the diff lines they cite.",
    },
    challenges: [
      { title: "A validator that was too strict", body: "The first grounding validator rejected all five suggestions from the model. After fixing how quotes were matched, four were kept and one was correctly rejected." },
      { title: "Failing safely", body: "If the model is unavailable, reviews degrade to rule-only results instead of failing." },
      { title: "Tenant isolation", body: "Cross-tenant requests return 404 so resource existence is never leaked." },
    ],
    decisions: [
      "Server-side sessions instead of JWTs",
      "Rules first, model second, and the model must quote the diff",
      "Custom unified-diff viewer instead of Monaco",
      "A labelled fixture LLM for deterministic tests",
    ],
    tests: [
      { label: "Backend unit", value: "43" },
      { label: "Backend integration (real Postgres + Redis)", value: "63" },
      { label: "Frontend unit", value: "8" },
      { label: "Playwright", value: "9" },
    ],
    ci: "Latest GitHub Actions run on main: passing",
    metrics: [
      { value: "17", label: "deterministic review rules" },
      { value: "4", label: "tenant roles with server-side enforcement" },
      { value: "123", label: "automated tests across layers" },
    ],
    screenshots: [
      { src: "/projects/reviewpilot/03-review-detail.webp", alt: "Review detail page with findings on a diff", caption: "Review detail with grounded findings", width: 1440, height: 900 },
      { src: "/projects/reviewpilot/04-finding-evidence-triage.webp", alt: "Finding evidence and triage controls", caption: "Evidence quoting the diff, with triage", width: 1440, height: 900 },
      { src: "/projects/reviewpilot/14-review-dark.webp", alt: "Review page in dark theme", caption: "Dark theme", width: 1440, height: 900 },
      { src: "/projects/reviewpilot/08-live-progress.webp", alt: "Live review progress streamed over SSE", caption: "Live progress over SSE", width: 1200, height: 420 },
    ],
    accent: "#FF6FA8",
    runNote: "Runs locally with Docker Compose. Billing is a mock; not publicly deployed.",
  },
  {
    slug: "workmesh",
    name: "WorkMesh",
    repo: "workmesh-company-visibility-platform",
    repoUrl: `${GH}/workmesh-company-visibility-platform`,
    year: "2026",
    status: "Complete",
    categories: ["Full Stack"],
    tagline: "Permission-aware company visibility",
    oneLiner:
      "Connects org structure to the work happening inside it, so people can see who is doing what, within the permissions they actually have.",
    problem:
      "In a small company, managers often don't know what everyone is working on and employees know the work of only a handful of colleagues. WorkMesh connects company → departments → teams → people with goals → initiatives → projects → milestones → work items, with permission-aware visibility and no surveillance.",
    overview:
      "A modular NestJS monolith on PostgreSQL with row-level security powers an interactive Company Map, five role-based workspaces, roadmaps, a blocker state machine, a dependency graph with impact analysis and deterministic meeting briefs. Notifications flow through a transactional outbox, BullMQ and Socket.IO, re-authorizing every recipient before delivery.",
    features: [
      "Interactive Company Map (React Flow + ELK) with People and Work modes",
      "Five role workspaces: Employee, Manager, Project lead, Leadership, Admin",
      "Blocker state machine, roadmaps (timeline, board, list) and a dependency DAG with cycle prevention",
      "Deterministic meeting briefs with Markdown and print export",
      "Full-text search with authorization applied in SQL",
      "Admin permission inspector",
    ],
    planned: ["Read-only calendar integration", "Per-field visibility policies", "SSO / SCIM", "Slack and Teams digests", "Historical health trends"],
    stack: [
      { group: "Backend", items: ["NestJS 11", "Prisma 6", "PostgreSQL 16 (RLS, FTS)", "Redis 7", "BullMQ", "Socket.IO", "Zod", "Argon2id"] },
      { group: "Frontend", items: ["Next.js 16", "React 19", "React Flow + ELK.js", "TanStack Query & Table", "Zustand", "Recharts"] },
      { group: "Quality", items: ["Vitest", "Jest + Supertest", "Playwright", "gitleaks", "Docker"] },
    ],
    architecture: {
      cols: 4,
      rows: 3,
      nodes: [
        { id: "web", label: "Next.js", sub: "cookie + CSRF", col: 0, row: 1, kind: "client" },
        { id: "guard", label: "Guards", sub: "auth · CSRF · tenant tx", col: 1, row: 1, kind: "service" },
        { id: "policy", label: "Policy engine", sub: "@workmesh/core", col: 2, row: 0, kind: "service" },
        { id: "pg", label: "PostgreSQL", sub: "FORCE RLS", col: 2, row: 1, kind: "store" },
        { id: "outbox", label: "Outbox → BullMQ", sub: "re-authorize", col: 2, row: 2, kind: "queue" },
        { id: "socket", label: "Socket.IO", sub: "IDs only", col: 3, row: 2, kind: "service" },
      ],
      edges: [
        ["web", "guard", "REST"],
        ["guard", "policy"],
        ["guard", "pg", "SET app.org_id"],
        ["guard", "outbox"],
        ["outbox", "socket"],
        ["socket", "web"],
      ],
      caption: "Every request runs inside a tenant transaction; row-level security backs the policy engine as defense in depth.",
    },
    challenges: [
      { title: "Authorization everywhere", body: "Visibility rules apply to search, graphs, notifications and dashboards alike, so one pure policy engine is shared across the API and workers." },
      { title: "Realtime without leaks", body: "Realtime events carry only IDs; clients fetch data through the same authorized API, and each recipient is re-authorized before delivery." },
      { title: "Defense in depth", body: "35 tenant tables run with FORCE row-level security beneath the application-level checks." },
    ],
    decisions: [
      "Modular monolith over microservices",
      "Pure shared policy engine instead of an external authorization service",
      "Opaque sessions instead of JWTs",
      "Deterministic meeting briefs; no LLM",
    ],
    tests: [
      { label: "Core (Vitest)", value: "91" },
      { label: "API integration", value: "54" },
      { label: "Web", value: "16" },
      { label: "Playwright", value: "9" },
    ],
    ci: "Latest GitHub Actions run on main: passing",
    metrics: [
      { value: "80 ms", label: "p50, employee dashboard (300 requests, concurrency 10)" },
      { value: "0", label: "errors across the latency benchmark" },
      { value: "35", label: "tenant tables under row-level security" },
    ],
    screenshots: [
      { src: "/projects/workmesh/05-company-map-people.webp", alt: "Company Map showing people and teams as a graph", caption: "Company Map in People mode", width: 1600, height: 1000 },
      { src: "/projects/workmesh/03-manager-team-pulse.webp", alt: "Manager Team Pulse workspace", caption: "Manager workspace: Team Pulse", width: 1600, height: 1000 },
      { src: "/projects/workmesh/24-dependency-impact-mode.webp", alt: "Dependency graph in impact mode", caption: "Dependency impact analysis", width: 1600, height: 1000 },
      { src: "/projects/workmesh/08-roadmap-timeline.webp", alt: "Roadmap timeline view", caption: "Roadmap timeline", width: 1600, height: 1000 },
    ],
    accent: "#58C27D",
    runNote: "Runs locally with Docker Compose. Not publicly deployed.",
  },
];

export const categories: Category[] = ["AI/ML", "Data Engineering", "Full Stack"];

export function getProject(slug: string) {
  return projects.find((p) => p.slug === slug);
}
