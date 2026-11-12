import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/PageHeader";
import { AegisExperience, SourceAtlasExperience, TuneLabExperience, WorkMeshExperience } from "@/components/lab/LabExperiences";

export const metadata: Metadata = {
  title: "Lab — interactive results",
  description: "Interactive Plotly explorations of real results from Sree's projects: LoRA evaluation, fraud-model metrics, API latency and RAG evaluation.",
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
    </>
  );
}
