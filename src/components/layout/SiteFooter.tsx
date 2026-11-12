import Link from "next/link";
import { profile } from "@/content/profile";
import { navLinks } from "./navLinks";
import { BostonLine } from "@/components/ui/BostonLine";
import { BostonClock } from "./BostonClock";

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
              {[{ href: "/", label: "Home" }, ...navLinks, { href: "/ask", label: "Ask Sree" }].map((l) => (
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
              <li><a className="link-u text-fg-soft hover:text-fg" href={profile.links.github} target="_blank" rel="noopener noreferrer">GitHub ↗</a></li>
              <li><a className="link-u text-fg-soft hover:text-fg" href={profile.links.linkedin} target="_blank" rel="noopener noreferrer">LinkedIn ↗</a></li>
              <li><a className="link-u text-fg-soft hover:text-fg" href={profile.links.scholar} target="_blank" rel="noopener noreferrer">Google Scholar ↗</a></li>
              <li><a className="link-u text-fg-soft hover:text-fg" href={profile.resumePath} target="_blank" rel="noopener">Resume (PDF) ↗</a></li>
            </ul>
          </div>
        </div>
      </div>
      <div className="relative mt-16 text-fg-muted">
        <BostonLine className="mx-auto block h-auto w-full max-w-[1400px] px-[var(--gutter)]" />
      </div>
      <div className="container-x flex flex-col gap-3 border-t border-line py-6 text-xs text-fg-muted sm:flex-row sm:items-center sm:justify-between">
        <p className="mono">
          {profile.coordinates.lat}, {profile.coordinates.lng} · <BostonClock />
        </p>
        <p className="mono">© 2026 {profile.name}. Designed and engineered by Sree.</p>
      </div>
    </footer>
  );
}
