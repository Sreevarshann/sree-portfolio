import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/PageHeader";
import { ProjectCatalog } from "@/components/projects/ProjectCatalog";
import { projects } from "@/content/projects";

export const metadata: Metadata = {
  title: "Projects",
  description: "Verified project catalog: AEGIS AI, NEXUS AI, SourceAtlas, TuneLab, InsightForge, ReviewPilot and WorkMesh — with architecture, tests and real screenshots.",
  alternates: { canonical: "/projects" },
};

export default function ProjectsPage() {
  return (
    <>
      <PageHeader
        index="C"
        eyebrow={`Projects · ${projects.length} verified`}
        title="Built, tested,"
        accent="measured."
        lede="Every project here has a public repository, a passing CI run and documented results. Each runs locally with Docker Compose or dev servers — none is presented as a hosted product."
      />
      <section className="container-x pb-10" aria-label="Project catalog">
        <ProjectCatalog />
      </section>
    </>
  );
}
