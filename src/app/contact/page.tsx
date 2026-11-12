import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/PageHeader";
import { CopyEmail } from "@/components/ui/CopyEmail";
import { profile } from "@/content/profile";
import { BrandIcon } from "@/components/ui/BrandIcon";

export const metadata: Metadata = {
  title: "Contact",
  description: "Email Sree at sreevarshan.dev@gmail.com, or find him on LinkedIn, GitHub and Google Scholar.",
  alternates: { canonical: "/contact" },
};

const channels = [
  { label: "LinkedIn", value: "in/sreevarshansathiyamurthy", href: profile.links.linkedin, icon: null, mark: "profile" },
  { label: "GitHub", value: "@Sreevarshann", href: profile.links.github, icon: "github", mark: "" },
  { label: "Google Scholar", value: "Scholar profile", href: profile.links.scholar, icon: "googlescholar", mark: "" },
  { label: "Resume", value: "PDF, one page", href: profile.resumePath, icon: null, mark: "CV" },
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
                <span className="flex items-center justify-between">
                  <span className="eyebrow">{c.label}</span>
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-line text-fg-muted transition-[color,border-color,transform] duration-500 ease-[var(--ease-spring)] group-hover:-translate-y-0.5 group-hover:border-accent group-hover:text-fg" aria-hidden="true">
                    {c.icon ? <BrandIcon name={c.icon} size={18} /> : c.mark === "profile" ? <svg width="18" height="18" viewBox="0 0 16 16" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.4"><circle cx="8" cy="5.5" r="2.6" /><path d="M2.8 14c.6-2.8 2.7-4.3 5.2-4.3s4.6 1.5 5.2 4.3" strokeLinecap="round" /></svg> : <span className="text-[0.8rem] font-semibold tracking-[-0.02em]">{c.mark}</span>}
                  </span>
                </span>
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
