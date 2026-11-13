import { profile } from "@/content/profile";
import { projects } from "@/content/projects";
import { experience } from "@/content/experience";
import { achievements, certifications } from "@/content/credentials";

/**
 * URLs a citation may point to: the portfolio's own pages and the public URLs
 * the portfolio itself links (repositories, profiles, proof posts, verified
 * certificates). Anything else is not rendered as a link.
 */
const INTERNAL = new Set([
  "/",
  "/about",
  "/experience",
  "/projects",
  "/achievements",
  "/education",
  "/certifications",
  "/lab",
  "/contact",
  "/ask",
  profile.resumePath,
  ...projects.map((p) => `/projects/${p.slug}`),
]);

const norm = (u: string) => u.replace(/\/+$/, "");
const EXTERNAL = new Set(
  [
    ...Object.values(profile.links),
    ...projects.map((p) => p.repoUrl),
    ...experience.map((e) => e.url ?? ""),
    ...achievements.flatMap((a) => [a.proof?.href ?? "", ...a.evidence.map((e) => e.href ?? "")]),
    ...certifications.map((c) => c.verifyUrl),
  ]
    .filter((u) => /^https:\/\//.test(u))
    .map(norm),
);

export function isAllowedHref(href: string): boolean {
  if (href === `mailto:${profile.email}`) return true;
  if (href.startsWith("/")) return INTERNAL.has(href.replace(/[?#].*$/, ""));
  if (href.startsWith("https://")) return EXTERNAL.has(norm(href));
  return false;
}
