import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/PageHeader";
import { tableauProfile, tableauVizzes } from "@/content/tableau";
import { AegisExperience, SourceAtlasExperience, TuneLabExperience, WorkMeshExperience } from "@/components/lab/LabExperiences";

export const metadata: Metadata = {
  title: "Lab: interactive results",
  description: "Interactive Plotly explorations of real results from Sreevarshan Sathiyamurthy's projects: LoRA evaluation, fraud-model metrics, API latency and RAG evaluation.",
  alternates: { canonical: "/lab" },
};

export default function LabPage() {
  return (
    <>
      <PageHeader
        index="H"
        eyebrow="Lab"
        title="Results, not"
        accent="adjectives."
        lede="Interactive views of numbers published in the project repositories. Every chart names its source, and every dataset is available as a table."
      />
      <div className="container-x pb-10">
        <TuneLabExperience />
        <AegisExperience />
        <WorkMeshExperience />
        <SourceAtlasExperience />
      </div>
      <section className="container-x section" aria-labelledby="tableau-heading">
        <div className="panel overflow-hidden p-7 md:p-10" data-reveal>
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div className="max-w-xl">
              <p className="eyebrow flex items-center gap-2.5">
                {/* eslint-disable-next-line @next/next/no-img-element -- 1 KB static brand SVG */}
                <img src="/tech/tableau.svg" alt="" width={16} height={16} className="h-4 w-4" />
                Tableau Public
              </p>
              <h2 id="tableau-heading" className="mt-4 text-[clamp(1.8rem,3.4vw,2.6rem)] font-medium leading-tight tracking-[-0.035em]">
                Dashboards on <span className="serif-accent text-accent-fg">Tableau Public.</span>
              </h2>
              <p className="mt-3 text-fg-soft">Published on my Tableau Public profile. They open on Tableau&apos;s site.</p>
            </div>
            <a href={tableauProfile} target="_blank" rel="noopener noreferrer" className="btn btn-ghost">
              Explore my data visualizations <span aria-hidden="true">↗</span>
              <span className="sr-only"> on Tableau Public (opens in a new tab)</span>
            </a>
          </div>
          <ul className="mt-8 grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-3">
            {tableauVizzes.map((v) => (
              <li key={v.href}>
                <a href={v.href} target="_blank" rel="noopener noreferrer" className="group flex h-full items-center justify-between gap-4 bg-bg px-5 py-5 transition-colors hover:bg-bg-elev">
                  <span className="font-medium text-fg">{v.title}</span>
                  <span className="text-fg-muted transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden="true">↗</span>
                  <span className="sr-only"> (opens on Tableau Public in a new tab)</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
