import { profile } from "@/content/profile";
import { experience } from "@/content/experience";
import { education, certifications, achievements } from "@/content/credentials";
import { projects } from "@/content/projects";
import { skillClusters, evidenceLabels } from "@/content/skills";

/**
 * The Sree AI knowledge base, built only from the typed portfolio content
 * (itself sourced from the sanitized resume and public repositories).
 * PRIVACY: the phone number is not present in any source module, and
 * `assertNoPrivateData` guards against it being added by mistake.
 */
export type KnowledgeChunk = {
  id: string;
  title: string;
  section: string;
  href: string;
  text: string;
};

const chunks: KnowledgeChunk[] = [];
const add = (c: KnowledgeChunk) => chunks.push(c);

add({
  id: "profile",
  title: "Who Sree is",
  section: "About",
  href: "/about",
  text: [
    `${profile.name} (preferred name: ${profile.displayName}) is based in ${profile.location}.`,
    `Positioning: ${profile.roles.join(", ")}.`,
    profile.summary,
    profile.headline,
    ...profile.about,
    `Current focus: ${profile.focus.join("; ")}.`,
    `Engineering values: ${profile.values.map((v) => `${v.title} — ${v.body}`).join(" ")}`,
  ].join(" "),
});

add({
  id: "contact",
  title: "Contact",
  section: "Contact",
  href: "/contact",
  text: `The best way to contact Sree is email: ${profile.email} (mailto:${profile.email}). LinkedIn: ${profile.links.linkedin}. GitHub: ${profile.links.github}. Google Scholar: ${profile.links.scholar}. A resume PDF is at ${profile.resumePath}. He is based in Boston, Massachusetts. Phone numbers are not shared publicly; use email.`,
});

for (const e of experience) {
  add({
    id: `exp-${e.slug}`,
    title: `${e.role} at ${e.company}`,
    section: "Experience",
    href: `/experience#${e.slug}`,
    text: [
      `${e.role} at ${e.company}, ${e.period}, ${e.location}.`,
      e.summary,
      ...e.highlights,
      `Outcomes: ${e.outcomes.map((o) => `${o.value} ${o.label}`).join("; ")}.`,
      `Technologies: ${e.stack.join(", ")}.`,
      e.url ? `Company website: ${e.url}.` : "",
    ].join(" "),
  });
}

for (const ed of education) {
  add({
    id: `edu-${ed.institution}`,
    title: ed.institution,
    section: "Education",
    href: "/education",
    text: `${ed.degree} in ${ed.field} at ${ed.institution}${ed.affiliation ? ` (affiliated to ${ed.affiliation})` : ""}, ${ed.location}. GPA ${ed.gpa}. ${ed.date}. ${ed.notes.join(" ")}`,
  });
}

add({
  id: "certifications",
  title: "Certifications",
  section: "Certifications",
  href: "/certifications",
  text: certifications
    .map((c) => `${c.name} — ${c.issuer} (${c.kind}).${c.note ? " " + c.note : ""} Verification: ${c.verifyUrl}.`)
    .join(" "),
});

for (const a of achievements) {
  add({
    id: `ach-${a.slug}`,
    title: `${a.event}: ${a.result}`,
    section: "Achievements",
    href: `/achievements#${a.slug}`,
    text: [
      `${a.event} — ${a.result}${a.rank.field ? ` among ${a.rank.field}` : ""}. Project: ${a.project}.`,
      a.summary,
      ...a.details,
      `Technologies: ${a.stack.join(", ")}.`,
      a.stages ? `Competition stages: ${a.stages.map((st) => `${st.value} ${st.label}`).join(" → ")}.` : "",
      `Evidence: ${a.evidence.map((e) => `${e.label}${e.note ? ` (${e.note})` : ""}${e.href ? `: ${e.href}` : ""}`).join("; ")}.`,
    ].join(" "),
  });
}

add({
  id: "resume-event-processing",
  title: "Event Processing & Monitoring Dashboard (resume project)",
  section: "Projects",
  href: "/projects",
  text: "Listed on Sree's resume: a Python simulator and dashboard for 143K synthetic transaction events, validated with 11 passing unit tests and 5 passing CI jobs. A React and TypeScript dashboard, Django API and Go event worker on AWS EC2 with Amazon Aurora provisioned via Terraform is a PLANNED extension and has not been built. This item does not have a case-study page on the portfolio.",
});

for (const p of projects) {
  const base = { section: "Projects", href: `/projects/${p.slug}` };
  add({
    ...base,
    id: `proj-${p.slug}-overview`,
    title: `${p.name} — ${p.tagline}`,
    text: [
      `${p.name}: ${p.oneLiner}`,
      `Problem: ${p.problem}`,
      `Overview: ${p.overview}`,
      `Status: ${p.status}. ${p.runNote} Repository: ${p.repoUrl}. Categories: ${p.categories.join(", ")}.`,
      p.credit ?? "",
    ].join(" "),
  });
  add({
    ...base,
    id: `proj-${p.slug}-features`,
    title: `${p.name} — features and roadmap`,
    text: `${p.name} implemented features: ${p.features.join("; ")}. Planned / not yet built: ${p.planned.join("; ")}.`,
  });
  add({
    ...base,
    id: `proj-${p.slug}-engineering`,
    title: `${p.name} — architecture and engineering decisions`,
    text: [
      `${p.name} architecture: ${p.architecture.caption} Components: ${p.architecture.nodes.map((n) => `${n.label}${n.sub ? ` (${n.sub})` : ""}`).join(", ")}.`,
      `Engineering challenges: ${p.challenges.map((c) => `${c.title}: ${c.body}`).join(" ")}`,
      `Key decisions: ${p.decisions.join("; ")}.`,
    ].join(" "),
  });
  add({
    ...base,
    id: `proj-${p.slug}-results`,
    title: `${p.name} — tests, results and stack`,
    text: [
      `${p.name} tests: ${p.tests.map((t) => `${t.label}: ${t.value}`).join("; ")}. ${p.ci}.`,
      `Reported results: ${p.metrics.map((m) => `${m.value} ${m.label}`).join("; ")}.`,
      `Tech stack: ${p.stack.map((s) => `${s.group}: ${s.items.join(", ")}`).join(". ")}.`,
    ].join(" "),
  });
}

for (const c of skillClusters) {
  add({
    id: `skills-${c.id}`,
    title: `Skills — ${c.title}`,
    section: "About",
    href: "/about#skills",
    text: `${c.title}: ${c.blurb} ${c.skills
      .map((s) => `${s.name} (used in: ${s.usedIn.map((u) => evidenceLabels[u]?.label ?? u).join(", ")})`)
      .join("; ")}.`,
  });
}

add({
  id: "site-map",
  title: "Portfolio pages",
  section: "Site",
  href: "/",
  text: "Portfolio pages: /about (story, values, skills map), /experience (work history), /projects (catalog with case studies at /projects/<slug>), /achievements (Singapore AUV Challenge, Google MLOps Expo), /education, /certifications, /lab (interactive Plotly charts from project results), /contact, /ask (full-page Sree AI).",
});

const PHONE_LIKE = /(?<![\d\w-])\+?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}(?![\d\w])/;
export function assertNoPrivateData(list: KnowledgeChunk[]) {
  for (const c of list) {
    if (PHONE_LIKE.test(c.text)) throw new Error(`Knowledge chunk ${c.id} contains a phone-like number`);
  }
}
assertNoPrivateData(chunks);

export const knowledge: readonly KnowledgeChunk[] = chunks;
