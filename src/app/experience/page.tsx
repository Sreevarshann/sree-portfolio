import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/PageHeader";
import { ExperienceTimeline } from "@/components/experience/ExperienceTimeline";
import { profile } from "@/content/profile";

export const metadata: Metadata = {
  title: "Experience",
  description: "Software & Data Engineer Intern at RightRev, Data Analyst & Engineer at Flare Innovation, Machine Learning Engineer at Sri Sairam Techno Incubator Foundation.",
  alternates: { canonical: "/experience" },
};

export default function ExperiencePage() {
  return (
    <>
      <PageHeader
        index="B"
        eyebrow="Experience"
        title="Work that"
        accent="shipped."
        lede="AI agents on Snowflake, IoT data pipelines and autonomous underwater robotics — each role with its actual scope, stack and verified outcomes."
      >
        <div className="mt-8 flex flex-wrap gap-3" data-reveal>
          <a href={profile.resumePath} target="_blank" rel="noopener" className="btn btn-ghost">Download resume (PDF)</a>
        </div>
      </PageHeader>
      <section className="container-x pb-16" aria-label="Work history">
        <ExperienceTimeline headingLevel={2} />
      </section>
    </>
  );
}
