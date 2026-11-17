"use client";

import Link from "next/link";
import { useId, useState } from "react";
import { EVIDENCE_KIND_LABEL, evidence, type Skill } from "@/content/skillCatalog";
import { analyzeJobDescription, type JdReport } from "@/lib/skillSearch";
import { useAskSree } from "./AskSreeProvider";

export const JD_MAX = 6000;

/** General | Recruiter: changes starter prompts and answer framing, nothing else. */
export function ModeSwitch() {
  const { mode, setMode, busy } = useAskSree();
  return (
    <div className="ask-mode" role="group" aria-label="Answer mode">
      {(["general", "recruiter"] as const).map((m) => (
        <button key={m} type="button" className="ask-mode-btn" aria-pressed={mode === m} disabled={busy} onClick={() => setMode(m)}>
          {m === "general" ? "General" : "Recruiter"}
        </button>
      ))}
    </div>
  );
}

/**
 * Paste a job description; requirements are mapped to the verified skill
 * catalog right here in the browser. The text is never sent, stored or
 * logged: only the resulting map is added to the conversation, and only
 * canonical skill names reach the AI if the visitor asks for a summary.
 */
export function JobDescriptionPanel({ onDone }: { onDone: () => void }) {
  const { addReport } = useAskSree();
  const [text, setText] = useState("");
  const id = useId();
  return (
    <form
      className="jd-panel"
      onSubmit={(e) => {
        e.preventDefault();
        if (!text.trim()) return;
        addReport(analyzeJobDescription(text));
        setText("");
        onDone();
      }}
    >
      <label htmlFor={id} className="jd-label">Paste a job description</label>
      <textarea
        id={id}
        value={text}
        maxLength={JD_MAX}
        onChange={(e) => setText(e.target.value)}
        rows={6}
        className="jd-input"
        placeholder="Requirements, responsibilities, tech stack..."
      />
      <p className="jd-note">Mapped in your browser against Sree&apos;s verified skills. The text is not sent or stored. No scores, only evidence.</p>
      <div className="jd-actions">
        <button type="button" className="jd-cancel" onClick={onDone}>Cancel</button>
        <button type="submit" className="jd-submit" disabled={!text.trim()}>Map requirements</button>
      </div>
    </form>
  );
}

const plain = (s: Skill) => s.name.replace(/\s*\(.*\)\s*$/, "");

function Evidence({ skill }: { skill: Skill }) {
  return (
    <span className="jd-ev">
      {skill.uses.slice(0, 2).map((x, i) => {
        const ev = evidence[x.at];
        if (!ev) return null;
        return (
          <span key={x.at}>
            {i > 0 && <span aria-hidden="true"> · </span>}
            {ev.href.startsWith("/") ? <Link href={ev.href}>{ev.label}</Link> : <a href={ev.href} target="_blank" rel="noopener noreferrer">{ev.label}</a>}
            {["work", "project", "competition"].includes(ev.kind) && <span className="jd-kind"> ({EVIDENCE_KIND_LABEL[ev.kind].toLowerCase()})</span>}
          </span>
        );
      })}
    </span>
  );
}

/** The local mapping card, with a hand-off to Sree AI for a written summary. */
export function JdReportCard({ report }: { report: JdReport }) {
  const { send, busy } = useAskSree();
  const empty = !report.direct.length && !report.partial.length && !report.related.length && !report.missing.length;
  const summarize = () => {
    const names = [...report.direct.map((d) => plain(d.skill)), ...report.partial.map((d) => plain(d.skill)), ...report.related.map((r) => r.topic.name.split(/,| or /)[0].trim()), ...report.missing];
    const q = `Summarize how Sree's verified experience maps to a role asking for: ${names.slice(0, 24).join(", ")}. Separate direct evidence, related experience and what is not documented.`;
    send(q.slice(0, 990), { skills: [...report.direct, ...report.partial].map((d) => d.skill.id).slice(0, 16), topics: report.related.map((r) => r.topic.id).slice(0, 8) });
  };
  return (
    <section className="jd-report" aria-labelledby="jd-report-title">
      <h3 id="jd-report-title" className="jd-title">Job description: requirement map</h3>
      {empty ? (
        <p className="jd-text">I couldn&apos;t find technical requirements I recognise in that text. Try pasting the requirements or tech stack section.</p>
      ) : (
        <>
          {!!report.direct.length && (
            <div className="jd-group" data-group="direct">
              <h4>Directly evidenced</h4>
              <ul>{report.direct.map((d) => <li key={d.skill.id}><strong>{plain(d.skill)}</strong> <Evidence skill={d.skill} /></li>)}</ul>
            </div>
          )}
          {!!report.partial.length && (
            <div className="jd-group" data-group="partial">
              <h4>Partially evidenced (training only)</h4>
              <ul>{report.partial.map((d) => <li key={d.skill.id}><strong>{plain(d.skill)}</strong> <Evidence skill={d.skill} /></li>)}</ul>
            </div>
          )}
          {!!report.related.length && (
            <div className="jd-group" data-group="related">
              <h4>Related, transferable experience</h4>
              <ul>
                {report.related.map((r) => (
                  <li key={r.topic.id}>
                    <strong>{r.topic.name}</strong>: not documented. Closest verified work: {r.via.map(plain).join(", ")}.
                  </li>
                ))}
              </ul>
            </div>
          )}
          {!!report.missing.length && (
            <div className="jd-group" data-group="missing">
              <h4>Not documented</h4>
              <p className="jd-text">{report.missing.join(", ")}</p>
            </div>
          )}
          {!!report.questions.length && (
            <div className="jd-group" data-group="questions">
              <h4>Worth asking in an interview</h4>
              <ul>{report.questions.map((q) => <li key={q}>{q}</li>)}</ul>
            </div>
          )}
          <button type="button" className="jd-summarize" onClick={summarize} disabled={busy}>Ask AI to summarize this</button>
        </>
      )}
    </section>
  );
}
