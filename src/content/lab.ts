/**
 * Datasets for the Lab visualizations. Every number is copied from a public
 * repository's README or docs (see `source`). Nothing here is simulated.
 */

export const tunelab = {
  source: {
    label: "tunelab-llm-finetuning · README.md, docs/RESULTS.md",
    href: "https://github.com/Sreevarshann/tunelab-llm-finetuning/blob/main/docs/RESULTS.md",
  },
  note: "Synthetic ticket-triage task, n = 120 per split, one seed per configuration. Base model: Qwen2.5-0.5B-Instruct (4-bit).",
  runs: [
    { id: "base", label: "Base model", test: 8.3, heldout: 5.0, priority: 46.7, minutes: null as number | null, params: 0 },
    { id: "r8-300", label: "LoRA r8 · 300 steps", test: 100.0, heldout: 63.3, priority: 69.2, minutes: 9.7, params: 2.93 },
    { id: "r8-100", label: "LoRA r8 · 100 steps", test: 100.0, heldout: 50.0, priority: 50.0, minutes: 4.4, params: 2.93 },
    { id: "r16", label: "LoRA r16 · dropout 0.1", test: 99.2, heldout: 40.0, priority: 40.0, minutes: 10.1, params: 5.87 },
  ],
};

export const aegis = {
  source: {
    label: "aegis-ai-real-time-fraud-platform · README.md, docs/ML_MODEL.md",
    href: "https://github.com/Sreevarshann/aegis-ai-real-time-fraud-platform",
  },
  note: "Synthetic transactions. Test split: 25,877 transactions, 564 fraudulent (2.18%). Threshold 0.432.",
  models: [
    { model: "Logistic regression", precision: 0.564, recall: 0.601, f1: 0.582, prAuc: 0.614, rocAuc: 0.976 },
    { model: "Hist. gradient boosting", precision: 0.842, recall: 0.885, f1: 0.863, prAuc: 0.926, rocAuc: 0.997 },
  ],
  confusion: { tn: 25219, fp: 94, fn: 65, tp: 499 },
  scenarios: [
    { name: "Impossible travel", kind: "fraud", rate: 100.0 },
    { name: "Card testing", kind: "fraud", rate: 98.7 },
    { name: "Account takeover", kind: "fraud", rate: 83.6 },
    { name: "Collusive merchant", kind: "fraud", rate: 81.8 },
    { name: "High-value anomaly", kind: "fraud", rate: 60.0 },
    { name: "Legit new device", kind: "legit", rate: 8.8 },
    { name: "Legit large purchase", kind: "legit", rate: 0.95 },
    { name: "Legit travel", kind: "legit", rate: 0.57 },
    { name: "Normal", kind: "legit", rate: 0.3 },
  ] as { name: string; kind: "fraud" | "legit"; rate: number }[],
};

export const workmesh = {
  source: {
    label: "workmesh-company-visibility-platform · README.md",
    href: "https://github.com/Sreevarshann/workmesh-company-visibility-platform",
  },
  note: "300 requests per endpoint at concurrency 10 on seeded data (51 people, 12 projects, 98 work items). Local machine, zero errors.",
  endpoints: [
    { name: "Health", p50: 15.8, p95: 59.5, p99: 108.9, rps: 478 },
    { name: "Employee dashboard", p50: 80.2, p95: 101.5, p99: 174.2, rps: 118 },
    { name: "Team Pulse", p50: 68.9, p95: 121.7, p99: 138.3, rps: 129 },
    { name: "Leadership dashboard", p50: 83.3, p95: 164.2, p99: 252.3, rps: 105 },
    { name: "Project list", p50: 32.7, p95: 38.0, p99: 40.5, rps: 298 },
    { name: "People graph", p50: 54.0, p95: 63.7, p99: 68.5, rps: 182 },
    { name: "Work graph", p50: 39.8, p95: 53.7, p99: 57.6, rps: 242 },
    { name: "Update feed", p50: 31.0, p95: 37.5, p99: 39.4, rps: 314 },
    { name: "Search", p50: 54.9, p95: 62.6, p99: 88.2, rps: 177 },
  ],
};

export const sourceatlas = {
  source: {
    label: "sourceatlas-agentic-rag · README.md, eval/results/",
    href: "https://github.com/Sreevarshann/sourceatlas-agentic-rag",
  },
  note: "16-question synthetic evaluation set. “Live” uses qwen3:4b + nomic-embed-text; “Fixture” uses deterministic stand-ins.",
  progression: [
    { run: "Live run 1", answer: 53.8 },
    { run: "Live run 2", answer: 69.2 },
    { run: "Live run 3", answer: 92.3 },
  ],
  metrics: [
    { metric: "Answer correct", live: 92.3, fixture: 84.6 },
    { metric: "Citation correct", live: 95.8, fixture: 69.2 },
    { metric: "Abstention", live: 87.5, fixture: 93.8 },
    { metric: "Conflict detection", live: 100, fixture: 100 },
    { metric: "Injection handling", live: 100, fixture: 100 },
  ],
};
