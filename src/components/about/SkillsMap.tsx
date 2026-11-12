"use client";

import Link from "next/link";
import { useState } from "react";
import { skillClusters, evidenceLabels } from "@/content/skills";

/**
 * Interactive capability map. Selecting a skill draws its connections to the
 * roles and projects where it was actually used — evidence, not percentages.
 */
export function SkillsMap() {
  const [sel, setSel] = useState({ cluster: 0, skill: 0 });
  const skill = skillClusters[sel.cluster].skills[sel.skill];
  const ev = skill.usedIn;
  const R = 112;
  const nodes = ev.map((id, i) => {
    const a = -Math.PI / 2 + (i / ev.length) * Math.PI * 2;
    return { id, x: 160 + Math.cos(a) * R, y: 150 + Math.sin(a) * R * 0.86 };
  });

  return (
    <div className="grid gap-8 lg:grid-cols-[1.35fr_1fr]">
      <div className="grid gap-8 sm:grid-cols-2">
        {skillClusters.map((c, ci) => (
          <div key={c.id} data-reveal>
            <h3 className="text-lg font-medium tracking-[-0.02em]">{c.title}</h3>
            <p className="mt-1 text-sm text-fg-muted">{c.blurb}</p>
            <ul className="mt-4 flex flex-wrap gap-1.5">
              {c.skills.map((s, si) => {
                const on = sel.cluster === ci && sel.skill === si;
                return (
                  <li key={s.name}>
                    <button
                      type="button"
                      aria-pressed={on}
                      onClick={() => setSel({ cluster: ci, skill: si })}
                      className={`rounded-full border px-3 py-1.5 text-[0.82rem] transition-colors ${
                        on ? "border-accent-solid bg-accent-solid text-white" : "border-line text-fg-soft hover:border-accent hover:text-fg"
                      }`}
                    >
                      {s.name}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>

      <div className="lg:sticky lg:top-28 lg:self-start">
        <div className="panel p-5 md:p-6" aria-live="polite">
          <p className="eyebrow">Evidence</p>
          <p className="mt-2 text-xl font-medium tracking-[-0.02em]">{skill.name}</p>
          <svg key={skill.name} viewBox="0 0 320 300" className="mt-2 h-auto w-full" aria-hidden="true">
            {nodes.map((n, i) => (
              <line key={n.id} x1="160" y1="150" x2={n.x} y2={n.y} stroke="var(--accent)" strokeOpacity="0.5" strokeDasharray="140" strokeDashoffset="140" style={{ animation: `skDraw 700ms ${i * 70}ms cubic-bezier(.22,1,.36,1) forwards` }} />
            ))}
            <circle cx="160" cy="150" r="30" fill="var(--accent-soft)" stroke="var(--accent)" />
            <text x="160" y="154" textAnchor="middle" fontSize="11" fill="var(--fg)" className="mono">
              {ev.length} {ev.length === 1 ? "use" : "uses"}
            </text>
            {nodes.map((n, i) => (
              <g key={n.id} style={{ opacity: 0, animation: `skIn 500ms ${200 + i * 70}ms ease-out forwards` }}>
                <circle cx={n.x} cy={n.y} r="5" fill="var(--accent)" />
                <text x={n.x} y={n.y + (n.y < 150 ? -12 : 20)} textAnchor="middle" fontSize="11" fill="var(--fg-soft)">
                  {evidenceLabels[n.id]?.label ?? n.id}
                </text>
              </g>
            ))}
          </svg>
          <ul className="mt-2 space-y-1.5 text-sm">
            {ev.map((id) => (
              <li key={id}>
                <Link href={evidenceLabels[id]?.href ?? "/"} className="group flex items-center justify-between gap-3 rounded-lg px-2 py-1.5 text-fg-soft hover:bg-accent-soft hover:text-fg">
                  {evidenceLabels[id]?.label ?? id}
                  <span className="text-fg-muted transition-transform group-hover:translate-x-1" aria-hidden="true">→</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <style>{`@keyframes skDraw{to{stroke-dashoffset:0}}@keyframes skIn{to{opacity:1}}@media (prefers-reduced-motion: reduce){svg line{stroke-dashoffset:0!important}svg g{opacity:1!important}}`}</style>
    </div>
  );
}
