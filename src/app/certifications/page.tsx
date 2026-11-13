import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/PageHeader";
import { certifications } from "@/content/credentials";
import { BrandIcon } from "@/components/ui/BrandIcon";

export const metadata: Metadata = {
  title: "Certifications",
  description: "Google Data Analytics Professional Certificate, Cisco Data Analytics Essentials, and AWS Cloud Practitioner Essentials training.",
  alternates: { canonical: "/certifications" },
};

export default function CertificationsPage() {
  return (
    <>
      <PageHeader index="F" eyebrow="Certifications" title="Credentials," accent="verifiable." lede="Each entry links to the certificate document. Training courses are labelled as training." />
      <section className="container-x pb-16" aria-label="Certifications">
        <ul className="grid gap-6 md:grid-cols-3">
          {certifications.map((c, i) => (
            <li key={c.name} data-reveal style={{ ["--i" as string]: i } as React.CSSProperties}>
              <article className="cert panel group relative flex h-full flex-col overflow-hidden p-7 transition-[transform,border-color] duration-500 hover:-translate-y-1 hover:border-accent">
                <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full border border-line" aria-hidden="true" />
                <div className="pointer-events-none absolute -right-4 -top-4 h-28 w-28 rounded-full border border-line" aria-hidden="true" />
                <div className="flex items-center justify-between">
                  <span className="issuer-badge inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-line-strong bg-bg text-fg-soft transition-[transform,border-color,color] duration-500 ease-[var(--ease-spring)] group-hover:-rotate-3 group-hover:scale-105 group-hover:border-accent group-hover:text-fg" aria-hidden="true">
                    {c.issuerIcon ? <BrandIcon name={c.issuerIcon} size={26} /> : <span className="text-[1.05rem] font-semibold lowercase tracking-[-0.04em]">{c.issuerMark}</span>}
                  </span>
                  <span className="mono text-xs text-fg-muted">0{i + 1}</span>
                </div>
                <p className="eyebrow mt-8">{c.kind}</p>
                <h2 className="mt-2 text-xl font-medium leading-snug tracking-[-0.02em]">{c.name}</h2>
                <p className="mt-1 text-sm text-fg-muted">{c.issuer}</p>
                {c.note && <p className="mt-4 rounded-xl border border-line bg-bg px-3 py-2 text-xs leading-relaxed text-fg-soft">{c.note}</p>}
                <div className="mt-auto pt-8">
                  <a href={c.verifyUrl} target="_blank" rel="noopener noreferrer" className="btn btn-ghost w-full">
                    {c.verifyLabel} ↗
                  </a>
                </div>
              </article>
            </li>
          ))}
        </ul>
        <p className="mt-8 max-w-2xl text-sm text-fg-muted">
          Credential IDs and issue dates are shown on the linked documents. Issuer marks are monochrome brand icons from Simple Icons (CC0); AWS is shown as text. Trademarks belong to their owners.
        </p>
      </section>
    </>
  );
}
