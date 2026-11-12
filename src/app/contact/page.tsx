import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/PageHeader";
import { CopyEmail } from "@/components/ui/CopyEmail";
import { profile } from "@/content/profile";

export const metadata: Metadata = {
  title: "Contact",
  description: "Email Sree at sreevarshan.dev@gmail.com, or find him on LinkedIn, GitHub and Google Scholar.",
  alternates: { canonical: "/contact" },
};

const channels = [
  { label: "LinkedIn", value: "in/sreevarshansathiyamurthy", href: profile.links.linkedin },
  { label: "GitHub", value: "@Sreevarshann", href: profile.links.github },
  { label: "Google Scholar", value: "Scholar profile", href: profile.links.scholar },
  { label: "Resume", value: "PDF, one page", href: profile.resumePath },
];

export default function ContactPage() {
  return (
    <>
      <PageHeader index="G" eyebrow="Contact" title="Say" accent="hello." lede="Open to conversations about AI engineering, data engineering and software roles. Email is the fastest way to reach me." />
      <section className="container-x pb-16" aria-label="Contact channels">
        <div className="panel p-8 md:p-12" data-reveal>
          <p className="eyebrow">Email</p>
          <a href={`mailto:${profile.email}`} className="mt-4 block break-all text-[clamp(1.8rem,5.5vw,4.5rem)] font-medium leading-none tracking-[-0.045em] transition-colors hover:text-accent-fg">
            {profile.email}
          </a>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href={`mailto:${profile.email}`} className="btn btn-primary">Write an email <span className="arrow" aria-hidden="true">→</span></a>
            <CopyEmail email={profile.email} />
          </div>
        </div>
        <ul className="mt-6 grid gap-px overflow-hidden rounded-[22px] border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
          {channels.map((c) => (
            <li key={c.label} data-reveal>
              <a href={c.href} target="_blank" rel={c.href.startsWith("/") ? "noopener" : "noopener noreferrer"} className="group flex h-full flex-col justify-between gap-10 bg-bg p-7 transition-colors hover:bg-bg-elev">
                <span className="eyebrow">{c.label}</span>
                <span className="flex items-end justify-between gap-3">
                  <span className="text-lg">{c.value}</span>
                  <span className="text-fg-muted transition-transform duration-500 group-hover:-translate-y-1 group-hover:translate-x-1" aria-hidden="true">↗</span>
                </span>
              </a>
            </li>
          ))}
        </ul>
        <p className="mt-6 text-sm text-fg-muted">Based in {profile.location} · {profile.coordinates.lat}, {profile.coordinates.lng}</p>
      </section>
    </>
  );
}
