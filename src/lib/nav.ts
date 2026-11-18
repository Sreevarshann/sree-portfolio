/**
 * The single navigation registry. The items follow the order of the
 * homepage sections exactly, and each one points at its section on the
 * homepage (`/#id`). Which route owns which item, and which homepage section
 * maps to which item, are defined here - never inferred from titles.
 */
export type NavKey = "about" | "achievements" | "education" | "experience" | "tools" | "projects" | "certifications" | "contact";

export type NavItem = { key: NavKey; href: string; label: string };

/** Homepage order: About (the hero), Achievements, Education, Experience, Tech Stack, Projects, Certifications, Contact. */
export const NAV: NavItem[] = [
  { key: "about", href: "/#about", label: "About" },
  { key: "achievements", href: "/#achievements", label: "Achievements" },
  { key: "education", href: "/#education", label: "Education" },
  { key: "experience", href: "/#experience", label: "Experience" },
  { key: "tools", href: "/#tools", label: "Tech Stack" },
  { key: "projects", href: "/#projects", label: "Projects" },
  { key: "certifications", href: "/#certifications", label: "Certifications" },
  { key: "contact", href: "/#contact", label: "Contact" },
];

/** Dedicated pages and the item that owns them (nested routes inherit: /projects/x → Projects). */
const ROUTE_OWNER: Record<string, NavKey> = {
  "/about": "about",
  "/achievements": "achievements",
  "/education": "education",
  "/experience": "experience",
  "/projects": "projects",
  "/certifications": "certifications",
  "/contact": "contact",
};

export function navKeyForPath(pathname: string): NavKey | null {
  const first = "/" + (pathname.split("/")[1] ?? "");
  return ROUTE_OWNER[first] ?? null;
}

/**
 * Homepage sections → navigation item. Sections carry `data-nav-section` with
 * one of these ids (and the same `id`, so `/#id` links land on them); the
 * island highlights the owner of the section under the activation line.
 */
export const HOME_SECTIONS = {
  about: "about",
  achievements: "achievements",
  education: "education",
  experience: "experience",
  tools: "tools",
  projects: "projects",
  certifications: "certifications",
  contact: "contact",
} as const satisfies Record<NavKey, NavKey>;

export type HomeSection = keyof typeof HOME_SECTIONS;
