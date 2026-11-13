import Link from "next/link";

const caps = [
  {
    n: "01",
    title: "Intelligent systems",
    short: "AI agents and retrieval that cite their sources and get measured.",
    body: "AI agents, retrieval and evaluation built to be checked: grounded citations, abstention, guarded tools and measured results.",
    proof: [
      { label: "Snowflake Cortex agents at RightRev", href: "/experience#rightrev" },
      { label: "SourceAtlas: verified-citation RAG", href: "/projects/sourceatlas" },
      { label: "TuneLab: LoRA with honest evals", href: "/projects/tunelab" },
    ],
    art: "agents",
  },
  {
    n: "02",
    title: "Data infrastructure",
    short: "Pipelines with quality gates, so the data downstream can be trusted.",
    body: "Streaming and batch pipelines with schema checks, quality gates and models that make downstream analytics trustworthy.",
    proof: [
      { label: "1M+ IoT records through Python ETL", href: "/experience#flare-innovation" },
      { label: "AEGIS: Kafka-compatible streaming + dbt", href: "/projects/aegis-ai" },
      { label: "InsightForge: sandboxed DuckDB analysis", href: "/projects/insightforge" },
    ],
    art: "pipeline",
  },
  {
    n: "03",
    title: "Full-stack software",
    short: "Products with real auth and interfaces that explain what happened.",
    body: "Multi-tenant products with real auth, RBAC and realtime UX, with interfaces that explain what the system did and why.",
    proof: [
      { label: "ReviewPilot: GenAI code-review SaaS", href: "/projects/reviewpilot" },
      { label: "WorkMesh: permission-aware visibility", href: "/projects/workmesh" },
      { label: "NEXUS AI: multi-agent workspace", href: "/projects/nexus-ai" },
    ],
    art: "stack",
  },
] as const;

function Art({ kind }: { kind: (typeof caps)[number]["art"] }) {
  if (kind === "agents")
    return (
      <svg viewBox="0 0 120 80" className="h-20 w-auto text-accent" aria-hidden="true">
        {[[20, 40], [60, 18], [60, 62], [100, 40]].map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="6" fill="none" stroke="currentColor" strokeWidth="1.2" className="cap-node" style={{ animationDelay: `${i * 0.4}s` }} />
        ))}
        <path d="M26 40 L54 20 M26 40 L54 60 M66 20 L94 38 M66 60 L94 42 M60 24 V56" stroke="currentColor" strokeWidth="1" opacity=".45" strokeDasharray="3 4" className="cap-flow" />
      </svg>
    );
  if (kind === "pipeline")
    return (
      <svg viewBox="0 0 120 80" className="h-20 w-auto text-accent" aria-hidden="true">
        {[16, 40, 64].map((y) => (
          <path key={y} d={`M4 ${y} H116`} stroke="currentColor" strokeWidth="1" opacity=".35" />
        ))}
        {[16, 40, 64].map((y, i) => (
          <rect key={y} x="0" y={y - 3} width="14" height="6" rx="3" fill="currentColor" className="cap-packet" style={{ animationDelay: `${i * 0.7}s` }} />
        ))}
        <rect x="52" y="6" width="16" height="68" rx="4" fill="none" stroke="currentColor" strokeWidth="1.2" />
      </svg>
    );
  return (
    <svg viewBox="0 0 120 80" className="h-20 w-auto text-accent" aria-hidden="true">
      {[0, 1, 2].map((i) => (
        <rect key={i} x={20 + i * 8} y={10 + i * 14} width="72" height="34" rx="6" fill="var(--bg)" stroke="currentColor" strokeWidth="1.2" opacity={0.4 + i * 0.3} className="cap-layer" style={{ animationDelay: `${i * 0.3}s` }} />
      ))}
    </svg>
  );
}

export function Capabilities() {
  return (
    <div className="grid gap-px overflow-hidden rounded-[22px] border border-line bg-line lg:grid-cols-3">
      {caps.map((c, i) => (
        <article key={c.n} className="group relative flex flex-col bg-bg p-7 transition-colors duration-500 hover:bg-bg-elev md:p-9" data-reveal style={{ ["--i" as string]: i } as React.CSSProperties}>
          <div className="flex items-start justify-between">
            <span className="mono text-xs text-fg-muted">{c.n}</span>
            <Art kind={c.art} />
          </div>
          <h3 className="mt-8 text-2xl font-medium tracking-[-0.03em] md:text-3xl">{c.title}</h3>
          <p className="v-quick mt-3 text-[0.98rem] leading-relaxed text-fg-soft">{c.short}</p>
          <p className="v-detailed mt-3 text-[0.98rem] leading-relaxed text-fg-soft">{c.body}</p>
          <ul className="mt-6 space-y-2 border-t border-line pt-5 text-sm">
            {c.proof.map((p, pi) => (
              <li key={p.href} className={pi > 0 ? "v-detailed" : undefined}>
                <Link href={p.href} className="group/l flex items-center justify-between gap-3 text-fg-soft hover:text-fg">
                  <span className="link-u">{p.label}</span>
                  <span className="text-fg-muted transition-transform group-hover/l:translate-x-1" aria-hidden="true">→</span>
                </Link>
              </li>
            ))}
          </ul>
        </article>
      ))}
      <style>{`
        @media (prefers-reduced-motion: no-preference){
          .cap-node{animation:capPulse 2.4s ease-in-out infinite;transform-box:fill-box;transform-origin:center}
          .cap-flow{animation:capFlow 1.6s linear infinite}
          .cap-packet{animation:capMove 2.8s cubic-bezier(.65,0,.35,1) infinite}
          .group:hover .cap-layer{transform:translateY(-3px)}
          .cap-layer{transition:transform .6s cubic-bezier(.22,1,.36,1)}
        }
        @keyframes capPulse{50%{transform:scale(1.25);opacity:.6}}
        @keyframes capFlow{to{stroke-dashoffset:-14}}
        @keyframes capMove{0%{transform:translateX(0);opacity:0}10%{opacity:1}90%{opacity:1}100%{transform:translateX(104px);opacity:0}}
      `}</style>
    </div>
  );
}
