import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ViewTransition } from "react";
import { KineticText } from "@/components/motion/KineticText";
import { ArchitectureDiagram } from "@/components/projects/ArchitectureDiagram";
import { TechChip } from "@/components/ui/TechChip";
import { getProject, projects } from "@/content/projects";

const labAnchors: Record<string, string> = {
  "aegis-ai": "aegis",
  tunelab: "tunelab",
  workmesh: "workmesh",
  sourceatlas: "sourceatlas",
};

export const dynamicParams = false;

export function generateStaticParams() {
  return projects.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps<"/projects/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const p = getProject(slug);
  if (!p) return {};
  return {
    title: `${p.name} — ${p.tagline}`,
    description: p.oneLiner,
    alternates: { canonical: `/projects/${p.slug}` },
    openGraph: { title: `${p.name} · Sreevarshan Sathiyamurthy`, description: p.oneLiner, images: [{ url: p.screenshots[0].src }] },
  };
}

function Block({ n, title, children }: { n: string; title: string; children: React.ReactNode }) {
  return (
    <section className="grid gap-6 border-t border-line py-14 md:grid-cols-[220px_1fr] md:gap-12 md:py-20" aria-label={title}>
      <h2 className="eyebrow flex items-baseline gap-3 md:sticky md:top-28 md:self-start" data-reveal>
        <span className="text-accent">{n}</span> {title}
      </h2>
      <div className="min-w-0" data-reveal>{children}</div>
    </section>
  );
}

export default async function CaseStudy({ params }: PageProps<"/projects/[slug]">) {
  const { slug } = await params;
  const p = getProject(slug);
  if (!p) notFound();
  const idx = projects.findIndex((x) => x.slug === p.slug);
  const next = projects[(idx + 1) % projects.length];
  const hero = p.screenshots[0];

  return (
    <article>
      <header className="container-x pt-32 md:pt-40">
        <Link href="/projects" className="eyebrow link-u inline-flex items-center gap-2 hover:text-fg">
          ← All projects
        </Link>
        <div className="mt-10 grid gap-8 lg:grid-cols-[1.4fr_1fr] lg:items-end">
          <div>
            <p className="eyebrow">{p.categories.join(" · ")}</p>
            <KineticText as="h1" trigger="css" className="display mt-5 text-[clamp(3.2rem,11vw,9rem)]" segments={[p.name]} />
            <p className="mt-6 max-w-xl text-xl text-fg-soft md:text-2xl">{p.tagline}</p>
          </div>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-5 text-sm" data-reveal>
            <div>
              <dt className="eyebrow">Status</dt>
              <dd className="mt-1 flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-[var(--success)]" aria-hidden="true" />{p.status}</dd>
            </div>
            <div>
              <dt className="eyebrow">Year</dt>
              <dd className="mt-1">{p.year}</dd>
            </div>
            <div className="col-span-2">
              <dt className="eyebrow">Repository</dt>
              <dd className="mt-1">
                <a href={p.repoUrl} target="_blank" rel="noopener noreferrer" className="link-u break-all text-accent-fg">github.com/Sreevarshann/{p.repo} ↗</a>
              </dd>
            </div>
            <div className="col-span-2">
              <dt className="eyebrow">Live application</dt>
              <dd className="mt-1 text-fg-muted">{p.liveUrl ? <a href={p.liveUrl} className="link-u text-accent-fg" target="_blank" rel="noopener noreferrer">{p.liveUrl}</a> : p.runNote}</dd>
            </div>
          </dl>
        </div>
      </header>

      <div className="container-x mt-14">
        <ViewTransition name={`project-${p.slug}`} share="morph" default="none">
          <div className="relative aspect-[16/9] overflow-hidden rounded-[22px] border border-line bg-surface">
            <Image src={hero.src} alt={hero.alt} fill priority sizes="(min-width: 1360px) 1280px, 100vw" className="object-cover object-top" />
          </div>
        </ViewTransition>
        <dl className="mt-6 grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-3">
          {p.metrics.map((m) => (
            <div key={m.label} className="bg-bg px-6 py-5">
              <dt className="sr-only">{m.label}</dt>
              <dd className="text-3xl font-medium tracking-[-0.03em] text-accent-fg">{m.value}</dd>
              <dd className="mt-1 text-sm text-fg-muted">{m.label}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="container-x mt-10">
        <Block n="01" title="Problem">
          <p className="max-w-3xl text-[clamp(1.25rem,2.2vw,1.75rem)] font-medium leading-snug tracking-[-0.02em]">{p.problem}</p>
        </Block>

        <Block n="02" title="Product overview">
          <p className="max-w-3xl text-lg leading-relaxed text-fg-soft">{p.overview}</p>
          <div className="mt-10 grid gap-8 md:grid-cols-2">
            <div>
              <h3 className="eyebrow !text-fg">Implemented</h3>
              <ul className="mt-4 space-y-3">
                {p.features.map((f) => (
                  <li key={f} className="flex gap-3 leading-relaxed text-fg-soft">
                    <span className="mt-1 text-[var(--success)]" aria-hidden="true">✓</span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="eyebrow">Planned — not yet built</h3>
              <ul className="mt-4 space-y-3">
                {p.planned.map((f) => (
                  <li key={f} className="flex gap-3 leading-relaxed text-fg-muted">
                    <span className="mt-0.5" aria-hidden="true">○</span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          {p.credit && <p className="mt-8 rounded-xl border border-line px-4 py-3 text-sm text-fg-muted">Credit: {p.credit}</p>}
        </Block>

        <Block n="03" title="System architecture">
          <ArchitectureDiagram arch={p.architecture} name={p.name} />
        </Block>

        <Block n="04" title="Core technologies">
          <div className="grid gap-8 sm:grid-cols-2">
            {p.stack.map((g) => (
              <div key={g.group}>
                <h3 className="text-sm font-medium text-fg">{g.group}</h3>
                <ul className="mt-3 flex flex-wrap gap-1.5">
                  {g.items.map((i) => (
                    <li key={i}>
                      <TechChip name={i} />
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </Block>

        <Block n="05" title="Engineering challenges">
          <div className="grid gap-px overflow-hidden rounded-[18px] border border-line bg-line md:grid-cols-2">
            {p.challenges.map((c) => (
              <div key={c.title} className="bg-bg p-6 md:p-7">
                <h3 className="text-lg font-medium tracking-[-0.02em]">{c.title}</h3>
                <p className="mt-2 leading-relaxed text-fg-soft">{c.body}</p>
              </div>
            ))}
          </div>
        </Block>

        <Block n="06" title="Technical decisions">
          <ol className="space-y-4">
            {p.decisions.map((d, i) => (
              <li key={d} className="flex gap-5 border-b border-line pb-4 text-lg text-fg-soft last:border-0">
                <span className="mono pt-1 text-xs text-accent">{String(i + 1).padStart(2, "0")}</span>
                {d}
              </li>
            ))}
          </ol>
        </Block>

        <Block n="07" title="Verified test results">
          <dl className="grid grid-cols-2 gap-4 md:grid-cols-3">
            {p.tests.map((t) => (
              <div key={t.label} className="flex flex-col-reverse rounded-2xl border border-line p-5">
                <dt className="mt-1 text-sm text-fg-muted">{t.label}</dt>
                <dd className="text-2xl font-medium tracking-[-0.03em]">{t.value}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-6 flex items-center gap-2 text-sm text-fg-soft">
            <span className="h-2 w-2 rounded-full bg-[var(--success)]" aria-hidden="true" />
            {p.ci} — counts as reported in the repository&apos;s README and testing docs.
          </p>
          {labAnchors[p.slug] && (
            <Link href={`/lab#${labAnchors[p.slug]}`} className="btn btn-ghost mt-8">
              Explore the results interactively in the Lab <span className="arrow" aria-hidden="true">→</span>
            </Link>
          )}
        </Block>

        <Block n="08" title="Screenshots">
          <div className="grid gap-6 md:grid-cols-2">
            {p.screenshots.map((s) => (
              <figure key={s.src} className="group">
                <a href={s.src} target="_blank" rel="noopener" className="block overflow-hidden rounded-[16px] border border-line bg-surface" aria-label={`Open full-size screenshot: ${s.caption}`}>
                  <div className="relative aspect-[16/10]">
                    <Image src={s.src} alt={s.alt} fill sizes="(min-width: 768px) 50vw, 100vw" className="object-cover object-top transition-transform duration-700 group-hover:scale-[1.02]" />
                  </div>
                </a>
                <figcaption className="mt-3 text-sm text-fg-muted">{s.caption}</figcaption>
              </figure>
            ))}
          </div>
          <p className="mt-6 text-xs text-fg-muted">Screenshots captured from the running application and published in the repository&apos;s docs.</p>
        </Block>

        <Block n="09" title="Links">
          <div className="flex flex-wrap gap-3">
            <a href={p.repoUrl} target="_blank" rel="noopener noreferrer" className="btn btn-primary">View repository on GitHub ↗</a>
            {p.liveUrl && <a href={p.liveUrl} target="_blank" rel="noopener noreferrer" className="btn btn-ghost">Live application ↗</a>}
          </div>
          {!p.liveUrl && <p className="mt-4 text-sm text-fg-muted">No public deployment. {p.runNote}</p>}
        </Block>
      </div>

      <nav aria-label="Next project" className="container-x mt-10">
        <Link href={`/projects/${next.slug}`} className="group block border-t border-line py-14">
          <span className="eyebrow">Next project</span>
          <span className="mt-4 flex items-center justify-between gap-6">
            <span className="text-[clamp(2.4rem,7vw,5.5rem)] font-medium leading-none tracking-[-0.045em] transition-colors group-hover:text-accent-fg">{next.name}</span>
            <span className="text-4xl text-fg-muted transition-transform duration-500 group-hover:translate-x-2" aria-hidden="true">→</span>
          </span>
          <span className="mt-3 block text-fg-muted">{next.tagline}</span>
        </Link>
      </nav>
    </article>
  );
}
