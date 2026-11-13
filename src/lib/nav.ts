import { profile } from "@/content/profile";

/**
 * The single navigation registry. Every destination, the primary/More split,
 * which route owns which item, and which homepage section maps to which item
 * are defined here — never inferred from titles or substrings.
 */
export type NavKey = "home" | "about" | "experience" | "projects" | "achievements" | "education" | "certifications" | "lab" | "contact" | "ask";

export type NavItem = { key: NavKey; href: string; label: string };
export type ExternalItem = { key: "tableau"; href: string; label: string; external: true };

export const PRIMARY_NAV: NavItem[] = [
  { key: "about", href: "/about", label: "About" },
  { key: "experience", href: "/experience", label: "Experience" },
  { key: "projects", href: "/projects", label: "Projects" },
  { key: "achievements", href: "/achievements", label: "Achievements" },
];

export const MORE_NAV: (NavItem | ExternalItem)[] = [
  { key: "education", href: "/education", label: "Education" },
  { key: "certifications", href: "/certifications", label: "Certifications" },
  { key: "lab", href: "/lab", label: "Lab" },
  { key: "contact", href: "/contact", label: "Contact" },
  { key: "tableau", href: profile.links.tableau, label: "Tableau Public", external: true },
];

export const MORE_KEYS = new Set<NavKey>(MORE_NAV.filter((i): i is NavItem => !("external" in i)).map((i) => i.key));

/** Which item a route belongs to (nested routes inherit: /projects/x → Projects). */
export function navKeyForPath(pathname: string): NavKey | null {
  if (pathname === "/") return "home";
  const first = "/" + (pathname.split("/")[1] ?? "");
  const all = [...PRIMARY_NAV, ...MORE_NAV.filter((i): i is NavItem => !("external" in i))];
  const hit = all.find((i) => i.href === first);
  if (hit) return hit.key;
  if (first === "/ask") return "ask";
  return null;
}

/**
 * Homepage sections → navigation item. Sections carry `data-nav-section` with
 * one of these ids; the island highlights the owner of the section under the
 * activation line.
 */
export const HOME_SECTIONS = {
  hero: "home",
  build: "about",
  approach: "about",
  tools: "about",
  work: "projects",
  experience: "experience",
  achievements: "achievements",
  education: "education",
  certifications: "certifications",
  lab: "lab",
  ai: "contact",
  contact: "contact",
} as const satisfies Record<string, NavKey>;

export type HomeSection = keyof typeof HOME_SECTIONS;
