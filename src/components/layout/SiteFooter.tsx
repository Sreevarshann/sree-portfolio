import Link from "next/link";
import { profile } from "@/content/profile";
import { navLinks } from "./navLinks";
import { BostonLine } from "@/components/ui/BostonLine";
import { ContourEcho } from "@/components/ui/ContourEcho";
import { BostonClock } from "./BostonClock";
import { BrandIcon } from "@/components/ui/BrandIcon";

export function SiteFooter() {
  return (
    <footer className="relative mt-24 border-t border-line">
      <div className="container-x pt-16">
        <div className="grid gap-12 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <p className="eyebrow">Based in Boston</p>
            <p className="mt-4 max-w-md text-2xl font-medium tracking-[-0.03em] text-fg md:text-3xl">
              Building intelligent systems, data infrastructure and software people can trust.
            </p>
            <a href={`mailto:${profile.email}`} className="link-u mt-6 inline-block text-lg text-accent-fg">
              {profile.email}
            </a>
          </div>
          <nav aria-label="Footer">
            <p className="eyebrow">Index</p>
            <ul className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
              {[{ href: "/", label: "Home" }, ...navLinks, { href: "/ask", label: "Sree AI" }].map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="link-u text-fg-soft hover:text-fg">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <div>
            <p className="eyebrow">Elsewhere</p>
            <ul className="mt-4 space-y-2 text-sm">
              <li><a className="group inline-flex items-center gap-2 text-fg-soft hover:text-fg" href={profile.links.github} target="_blank" rel="noopener noreferrer"><BrandIcon name="github" size={14} /><span className="link-u">GitHub ↗</span></a></li>
              <li><a className="group inline-flex items-center gap-2 text-fg-soft hover:text-fg" href={profile.links.linkedin} target="_blank" rel="noopener noreferrer"><svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.4"><circle cx="8" cy="5.5" r="2.6" /><path d="M2.8 14c.6-2.8 2.7-4.3 5.2-4.3s4.6 1.5 5.2 4.3" strokeLinecap="round" /></svg><span className="link-u">LinkedIn ↗</span></a></li>
              <li><a className="group inline-flex items-center gap-2 text-fg-soft hover:text-fg" href={profile.links.scholar} target="_blank" rel="noopener noreferrer"><BrandIcon name="googlescholar" size={14} /><span className="link-u">Google Scholar ↗</span></a></li>
              <li><a className="link-u text-fg-soft hover:text-fg" href={profile.resumePath} target="_blank" rel="noopener">Resume (PDF) ↗</a></li>
            </ul>
          </div>
        </div>
      </div>
      <div className="relative mt-16 overflow-hidden text-fg-muted">
        <ContourEcho className="pointer-events-none absolute inset-x-0 bottom-0 h-[70%] w-full text-accent opacity-25" />
        <BostonLine className="relative mx-auto block h-auto w-full max-w-[1400px] px-[var(--gutter)]" />
      </div>
      <div className="container-x flex flex-col gap-3 border-t border-line pb-24 pt-6 text-xs text-fg-muted sm:flex-row sm:items-center sm:justify-between sm:pb-6">
        <p className="mono">
          {profile.coordinates.lat}, {profile.coordinates.lng} · <BostonClock />
        </p>
        <p className="mono sm:mr-[190px] xl:mr-[150px]">© 2026 {profile.name}. Designed and engineered by me.</p>
      </div>
    </footer>
  );
}
