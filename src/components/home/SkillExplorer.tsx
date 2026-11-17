"use client";

import Link from "next/link";
import { useDeferredValue, useEffect, useId, useMemo, useRef, useState } from "react";
import { EVIDENCE_KIND_LABEL, SKILL_CATEGORIES, evidence, skills, skillById, type Skill, type SkillCategory } from "@/content/skillCatalog";
import { technologies } from "@/content/technologies";
import { askQuestionFor, searchSkills, type SkillHit, type TopicHit } from "@/lib/skillSearch";
import { useAskSree } from "@/components/ask/AskSreeProvider";
import { TechLogo } from "./TechLogo";

const techById = new Map(technologies.map((t) => [t.id, t]));
const LEVEL_LABEL: Record<SkillHit["level"], string> = { exact: "Exact match", alias: "Alias match", partial: "Matches your search", context: "Used there" };

/** A skill's mark: its marquee logo, or a quiet category glyph. */
function SkillMark({ skill }: { skill: Skill }) {
  const tech = skill.tech?.map((id) => techById.get(id)).find(Boolean);
  if (tech) return <TechLogo tech={tech} />;
  return (
    <svg className="tech-logo skill-glyph" viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      {skill.category === "ai" && <path d="M12 3v4M12 17v4M3 12h4M17 12h4M6.3 6.3l2.5 2.5M15.2 15.2l2.5 2.5M6.3 17.7l2.5-2.5M15.2 8.8l2.5-2.5" />}
      {skill.category === "data" && <><ellipse cx="12" cy="6" rx="7" ry="2.6" /><path d="M5 6v6c0 1.4 3.1 2.6 7 2.6s7-1.2 7-2.6V6M5 12v6c0 1.4 3.1 2.6 7 2.6s7-1.2 7-2.6v-6" /></>}
      {skill.category === "cloud" && <path d="M7 18h10a4 4 0 0 0 .6-7.95A5.5 5.5 0 0 0 7.1 9.1 4.5 4.5 0 0 0 7 18z" />}
      {skill.category === "software" && <path d="M8.5 7 4 12l4.5 5M15.5 7 20 12l-4.5 5M13.5 5l-3 14" />}
      {skill.category === "devops" && <><circle cx="12" cy="12" r="3" /><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1" /></>}
      {skill.category === "analytics" && <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />}
    </svg>
  );
}

function EvidenceLink({ at, className = "tech-index-link" }: { at: string; className?: string }) {
  const ev = evidence[at];
  if (!ev) return null;
  return ev.href.startsWith("/") ? (
    <Link href={ev.href} className={className}>{ev.label}</Link>
  ) : (
    <a href={ev.href} target="_blank" rel="noopener noreferrer" className={className}>
      {ev.label}
      <span className="sr-only"> (opens in a new tab)</span>
    </a>
  );
}

function AskButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button type="button" className="skill-ask" onClick={onClick}>
      <svg width="13" height="13" viewBox="0 0 16 16" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M8 1.8l1.4 3.6 3.8.3-2.9 2.5.9 3.7L8 9.9l-3.2 2 .9-3.7-2.9-2.5 3.8-.3z" />
      </svg>
      {label}
    </button>
  );
}

/** A verified skill with its usage contexts (search result). */
function SkillCard({ hit, onAsk, onPick }: { hit: SkillHit; onAsk: (s: Skill) => void; onPick: (name: string) => void }) {
  const { skill, level, matched } = hit;
  const [all, setAll] = useState(false);
  const uses = all ? skill.uses : skill.uses.slice(0, 3);
  const cat = SKILL_CATEGORIES.find((c) => c.id === skill.category)!.label;
  return (
    <li className="skill-card" data-level={level} data-skill={skill.id}>
      <div className="skill-card-head">
        <SkillMark skill={skill} />
        <h4 className="skill-card-name">{skill.name}</h4>
        <span className="skill-badge" data-kind="verified">
          <svg width="11" height="11" viewBox="0 0 12 12" aria-hidden="true"><path d="M2.5 6.2 5 8.6l4.5-5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
          Verified
        </span>
      </div>
      <p className="skill-card-meta">
        {cat}
        {level === "alias" && matched && <> · searched as “{matched}”</>}
        {level === "context" && matched && <> · used at {matched}</>}
        <span className="sr-only">. {LEVEL_LABEL[level]}.</span>
      </p>
      <ul className="skill-uses">
        {uses.map((x) => (
          <li key={x.at}>
            <span className="skill-kind">{EVIDENCE_KIND_LABEL[evidence[x.at]?.kind ?? "project"]}</span>
            <span className="skill-use-text">
              <EvidenceLink at={x.at} className="skill-use-link" />
              <span className="skill-use-what">{x.what}</span>
            </span>
          </li>
        ))}
      </ul>
      <div className="skill-card-foot">
        {skill.uses.length > 3 && (
          <button type="button" className="skill-more" onClick={() => setAll((v) => !v)} aria-expanded={all}>
            {all ? "Show fewer" : `+${skill.uses.length - 3} more`}
          </button>
        )}
        {!!skill.related?.length && (
          <span className="skill-related-inline">
            <span className="skill-related-label">Related:</span>
            {skill.related.slice(0, 3).map((r) => {
              const rs = skillById.get(r);
              return rs ? (
                <button key={r} type="button" className="skill-chip" onClick={() => onPick(rs.name.replace(/\s*\(.*\)\s*$/, ""))}>
                  {rs.name.replace(/\s*\(.*\)\s*$/, "")}
                </button>
              ) : null;
            })}
          </span>
        )}
        <AskButton label="Ask AI about this" onClick={() => onAsk(skill)} />
      </div>
    </li>
  );
}

/** A technology without documented usage, shown with verified neighbours. Never presented as direct experience. */
function TopicCard({ hit, onAsk }: { hit: TopicHit; onAsk: (h: TopicHit) => void }) {
  const { topic, via } = hit;
  return (
    <li className="skill-card skill-card-related" data-topic={topic.id} data-relation={topic.kind}>
      <div className="skill-card-head">
        <h4 className="skill-card-name">{topic.name}</h4>
        <span className="skill-badge" data-kind="related">{topic.kind === "related" ? "Related experience" : "Transferable experience"}</span>
      </div>
      <p className="skill-card-meta">Not documented as direct experience</p>
      <p className="skill-topic-summary">{topic.summary}</p>
      <p className="skill-topic-overlap">{topic.overlap}</p>
      <ul className="skill-via" aria-label="Related verified skills">
        {via.map((s) => (
          <li key={s.id}>
            <SkillMark skill={s} />
            <span className="skill-via-name">{s.name}</span>
            <span className="skill-via-where">
              {s.uses.slice(0, 2).map((x, i) => (
                <span key={x.at}>
                  {i > 0 && <span aria-hidden="true"> · </span>}
                  <EvidenceLink at={x.at} />
                </span>
              ))}
            </span>
          </li>
        ))}
      </ul>
      <div className="skill-card-foot">
        <AskButton label="Ask AI about related experience" onClick={() => onAsk(hit)} />
      </div>
    </li>
  );
}

/** Browse mode: the compact usage index, grouped by category. A row expands to its usage details. */
function BrowseRow({ skill, onAsk }: { skill: Skill; onAsk: (s: Skill) => void }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  return (
    <li className="tech-index-row" data-open={open || undefined}>
      <button type="button" className="tech-index-name skill-row-toggle" aria-expanded={open} aria-controls={id} onClick={() => setOpen((v) => !v)}>
        {skill.name}
      </button>
      <span className="tech-index-where">
        {/* At most three contexts per row, strongest first, so rows stay compact. */}
        {skill.uses.slice(0, 3).map((x, i) => (
          <span key={x.at}>
            {i > 0 && <span className="tech-index-sep" aria-hidden="true"> · </span>}
            {i > 0 && <span className="sr-only">, </span>}
            <EvidenceLink at={x.at} />
          </span>
        ))}
      </span>
      {open && (
        <div className="skill-row-detail" id={id}>
          <ul className="skill-uses">
            {skill.uses.map((x) => (
              <li key={x.at}>
                <span className="skill-kind">{EVIDENCE_KIND_LABEL[evidence[x.at]?.kind ?? "project"]}</span>
                <span className="skill-use-text">
                  <EvidenceLink at={x.at} className="skill-use-link" />
                  <span className="skill-use-what">{x.what}</span>
                </span>
              </li>
            ))}
          </ul>
          <AskButton label="Ask AI about this" onClick={() => onAsk(skill)} />
        </div>
      )}
    </li>
  );
}

/**
 * Skill Explorer: search, category filters and evidence for every verified
 * skill, from the shared catalog (the same records Sree AI answers from).
 * Search is local and deterministic: no network request per keystroke.
 * "Ask AI about this" hands the canonical skill id to the existing assistant,
 * which looks up the verified facts server-side.
 * Deep link: /?stack=<query>#tools opens the explorer with that search.
 */
export function SkillExplorer() {
  const { ask } = useAskSree();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<SkillCategory | "all">("all");
  const deferred = useDeferredValue(query);
  const input = useRef<HTMLInputElement>(null);
  const inputId = useId();
  const result = useMemo(() => searchSkills(deferred, category), [deferred, category]);
  const searching = deferred.trim().length > 0;

  // Deep link from a Sree AI citation or a shared URL.
  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get("stack");
    if (!q) return;
    const details = document.getElementById("explore-stack") as HTMLDetailsElement | null;
    if (details) details.open = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time read of the URL on mount
    setQuery(q.slice(0, 60));
    window.requestAnimationFrame(() => details?.scrollIntoView({ block: "start" }));
  }, []);

  const askSkill = (s: Skill) => ask(askQuestionFor({ kind: "skill", skill: s }), { skills: [s.id] });
  const askTopic = (h: TopicHit) => ask(askQuestionFor({ kind: "topic", topic: h.topic, via: h.via, asked: deferred }), { topics: [h.topic.id], skills: h.via.map((s) => s.id) });
  const askOpen = () => ask(`Has Sree worked with ${deferred.trim().slice(0, 40)}?`);

  const groups = SKILL_CATEGORIES.filter((c) => category === "all" || c.id === category).map((c) => ({ ...c, items: skills.filter((s) => s.category === c.id) }));
  const count = result.hits.length + result.related.length;
  const status = !searching
    ? ""
    : count === 0
      ? "No verified match found."
      : [result.hits.length && `${result.hits.length} verified ${result.hits.length === 1 ? "skill" : "skills"}`, result.related.length && `${result.related.length} related, not direct, ${result.related.length === 1 ? "match" : "matches"}`].filter(Boolean).join(", ") + ".";

  return (
    <div className="skill-explorer">
      <div className="skill-search-row">
        <div className="skill-search">
          <label htmlFor={inputId} className="sr-only">Search skills, tools, or technologies</label>
          <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><circle cx="7" cy="7" r="4.6" /><path d="M10.5 10.5 14 14" /></svg>
          <input
            ref={input}
            id={inputId}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value.slice(0, 60))}
            onKeyDown={(e) => {
              if (e.key === "Escape" && query) {
                e.preventDefault();
                e.stopPropagation();
                setQuery("");
              }
            }}
            placeholder="Search skills, tools, or technologies..."
            autoComplete="off"
            spellCheck={false}
            enterKeyHint="search"
          />
          {query && (
            <button type="button" className="skill-clear" aria-label="Clear search" onClick={() => { setQuery(""); input.current?.focus(); }}>
              <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true"><path d="M1.5 1.5l7 7M8.5 1.5l-7 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
            </button>
          )}
        </div>
      </div>
      <div className="skill-filters" role="group" aria-label="Filter skills by category">
        {[{ id: "all" as const, label: "All" }, ...SKILL_CATEGORIES].map((c) => (
          <button key={c.id} type="button" className="skill-filter" aria-pressed={category === c.id} onClick={() => setCategory(c.id)}>
            {c.label}
          </button>
        ))}
      </div>
      <p className="sr-only" role="status" aria-live="polite">{status}</p>

      {!searching ? (
        <div className="tech-index-groups">
          {groups.map(({ id, label, items }) => (
            <section key={id} className="tech-index-group" aria-label={label}>
              <h3 className="tech-index-heading">{label}</h3>
              <ul>
                {items.map((s) => <BrowseRow key={s.id} skill={s} onAsk={askSkill} />)}
              </ul>
            </section>
          ))}
        </div>
      ) : (
        <div className="skill-results" data-count={count}>
          {result.hits.length > 0 && (
            <section aria-label="Verified skills">
              <h3 className="skill-results-heading">Verified skills</h3>
              <ul className="skill-grid">
                {result.hits.slice(0, 12).map((h) => <SkillCard key={h.skill.id} hit={h} onAsk={askSkill} onPick={setQuery} />)}
              </ul>
            </section>
          )}
          {result.hiddenByCategory > 0 && (
            <p className="skill-hidden-note">
              {result.hiddenByCategory} more {result.hiddenByCategory === 1 ? "match is" : "matches are"} in other categories.{" "}
              <button type="button" className="skill-inline-btn" onClick={() => setCategory("all")}>Show all categories</button>
            </p>
          )}
          {result.related.length > 0 && (
            <section aria-label="Related experience available">
              <h3 className="skill-results-heading">Related experience available</h3>
              <ul className="skill-grid">
                {result.related.map((h) => <TopicCard key={h.topic.id} hit={h} onAsk={askTopic} />)}
              </ul>
            </section>
          )}
          {count === 0 && result.hiddenByCategory === 0 && (
            <div className="skill-empty">
              <p className="skill-empty-title">No verified match found.</p>
              <p className="skill-empty-body">You can explore related skills or ask about Sree&apos;s engineering background.</p>
              <div className="skill-empty-actions">
                <button type="button" className="skill-inline-btn" onClick={() => { setQuery(""); setCategory("all"); input.current?.focus(); }}>Browse all skills</button>
                <AskButton label="Ask AI" onClick={askOpen} />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
