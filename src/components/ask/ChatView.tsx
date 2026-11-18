"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ComponentProps } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { SreeMark } from "@/components/ui/SreeMark";
import { MAX_INPUT, useAskSree, type ChatMessage } from "./AskSreeProvider";
import { MORE_QUESTIONS, SUGGESTED_QUESTIONS, type FallbackReason } from "@/lib/ai/protocol";
import { normalizeMarkdown } from "@/lib/ai/markdown";
import { renderCitationMarkers, resolveCitations, stripCitationMarkers, type Citation } from "@/lib/ai/citations";
import type { SourceRef } from "@/lib/ai/protocol";
import { profile } from "@/content/profile";

export const NAME = "My AI";
export const GREETING = "Hey! Curious about Sree's work? Ask me anything.";
export const SUBTITLE = "Explore Sree's work";

const FALLBACK_COPY: Record<FallbackReason, string> = {
  unavailable: "I can't write an answer right now because my connection to the language model is down. These pages from the portfolio cover your question:",
  busy: "I'm getting a lot of questions at the moment, so I couldn't write an answer. Try again in a few seconds, or start with these pages:",
  budget: "I've reached today's answer limit. These pages from the portfolio cover your question:",
};

/**
 * Link renderer for answers. Citation markers become numbered chips that point
 * at their verified source. Any other link is rendered only if it targets a
 * page in this answer's source map or the public email address; otherwise its
 * text is shown without a link.
 */
function makeLinkRenderer(cites: Citation[], map: SourceRef[] | undefined) {
  const allowed = new Set([`mailto:${profile.email}`, ...(map ?? []).map((s) => s.href)]);
  return function AnswerLink({ href = "", children, ...rest }: ComponentProps<"a">) {
    const cite = /^#cite-(\d+)$/.exec(href);
    if (cite) {
      const c = cites.find((x) => x.n === Number(cite[1]));
      if (!c) return null;
      const label = `Source ${c.n}: ${c.label}`;
      return (
        <sup className="cite">
          {c.href.startsWith("/") ? (
            <Link href={c.href} aria-label={label} title={c.label}>{c.n}</Link>
          ) : (
            <a href={c.href} target="_blank" rel="noopener noreferrer" aria-label={label} title={c.label}>{c.n}</a>
          )}
        </sup>
      );
    }
    // Messages saved before source maps existed keep internal links.
    const ok = map ? allowed.has(href) : href.startsWith("/") || allowed.has(href);
    if (!ok) return <span>{children}</span>;
    if (href.startsWith("/")) return <Link href={href} {...rest}>{children}</Link>;
    if (href.startsWith("mailto:")) return <a href={href} {...rest}>{children}</a>;
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" {...rest}>
        {children}
        <span className="sr-only"> (opens in a new tab)</span>
      </a>
    );
  };
}

function IconButton({ label, onClick, children, disabled }: { label: string; onClick: () => void; children: React.ReactNode; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className="inline-flex h-8 items-center gap-1.5 rounded-full px-2.5 text-[0.75rem] text-fg-muted transition-colors hover:bg-[var(--glass-lo)] hover:text-fg disabled:opacity-40"
    >
      {children}
    </button>
  );
}

function CopyButton({ text }: { text: string }) {
  const [done, setDone] = useState(false);
  return (
    <IconButton
      label={done ? "Copied" : "Copy response"}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setDone(true);
          window.setTimeout(() => setDone(false), 1600);
        } catch {}
      }}
    >
      <svg width="13" height="13" viewBox="0 0 16 16" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.5">
        {done ? <path d="M3 8.5l3 3 7-7" strokeLinecap="round" strokeLinejoin="round" /> : <><rect x="5" y="5" width="8" height="8" rx="2" /><path d="M3 10V4a1 1 0 011-1h6" /></>}
      </svg>
      {done ? "Copied" : "Copy"}
    </IconButton>
  );
}

function Typing() {
  return (
    <span className="inline-flex items-center gap-1 py-2">
      {[0, 1, 2].map((i) => (
        <span key={i} aria-hidden="true" className="typing-dot h-1.5 w-1.5 rounded-full bg-accent" style={{ animationDelay: `${i * 0.16}s` }} />
      ))}
      <span className="ml-1.5 text-[0.86rem] text-fg-muted">Thinking…</span>
    </span>
  );
}

function FallbackCard({ reason, links }: { reason: FallbackReason; links: { title: string; href: string; blurb: string }[] }) {
  return (
    <div className="rounded-[18px] rounded-tl-[6px] bg-[var(--glass-lo)] px-4 py-3 ring-1 ring-line" data-fallback={reason}>
      <p className="text-[0.95rem] leading-relaxed text-fg">{FALLBACK_COPY[reason]}</p>
      {links.length > 0 && (
        <ul className="mt-3 space-y-1.5">
          {links.map((l) => (
            <li key={l.href}>
              <Link href={l.href} className="group block rounded-xl px-2.5 py-2 -mx-2.5 transition-colors hover:bg-accent-soft">
                <span className="text-[0.9rem] font-medium text-fg underline decoration-accent/40 underline-offset-4 group-hover:decoration-accent">{l.title}</span>
                <span className="mt-0.5 block text-[0.8rem] leading-snug text-fg-muted line-clamp-2">{l.blurb}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
      <p className="mt-3 text-[0.8rem] text-fg-muted">
        Or email Sree at <a href={`mailto:${profile.email}`} className="text-accent underline underline-offset-4">{profile.email}</a>.
      </p>
    </div>
  );
}

function Suggestions({ items }: { items: string[] }) {
  const { send, busy } = useAskSree();
  return (
    <ul className="mt-3 flex flex-wrap gap-1.5" aria-label="Suggested follow-up questions">
      {items.map((q) => (
        <li key={q}>
          <button
            type="button"
            disabled={busy}
            onClick={() => send(q)}
            className="ask-chip"
          >
            {q}
          </button>
        </li>
      ))}
    </ul>
  );
}

function Message({ m, isLast }: { m: ChatMessage; isLast: boolean }) {
  const { retry, busy } = useAskSree();
  if (m.role === "user") {
    return (
      <div className="msg-in flex justify-end">
        <p className="ask-user-msg max-w-[84%] whitespace-pre-wrap">
          {m.content}
        </p>
      </div>
    );
  }
  const streaming = m.status === "streaming";
  const cites = m.sourceMap ? resolveCitations(m.content, m.sourceMap) : [];
  const markdown = m.sourceMap ? renderCitationMarkers(normalizeMarkdown(m.content), m.sourceMap, streaming) : normalizeMarkdown(m.content);
  // Numbered sources from the answer's own markers; older messages fall back to the server list.
  const sourceList = m.sourceMap ? cites.map((c) => ({ key: c.id, n: c.n as number | undefined, title: c.label, href: c.href })) : (m.sources ?? []).map((s) => ({ key: s.href, n: undefined as number | undefined, title: s.title, href: s.href }));
  return (
    <div className="msg-in flex gap-3">
      <div className="mt-0.5 shrink-0">
        <SreeMark size={26} state={streaming ? "thinking" : "idle"} />
      </div>
      <div className="min-w-0 flex-1">
        {m.fallback ? (
          <FallbackCard reason={m.fallback.reason} links={m.fallback.links} />
        ) : m.content ? (
          <div className={`md ${streaming ? "caret" : ""}`}>
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={{ a: makeLinkRenderer(cites, m.sourceMap) }} skipHtml>
              {markdown}
            </ReactMarkdown>
          </div>
        ) : streaming ? (
          <Typing />
        ) : null}
        {m.status === "stopped" && <p className="mt-2 text-xs text-fg-muted">Stopped. Ask again or retry.</p>}
        {m.status === "error" && (
          <p role="alert" className="mt-1 rounded-xl border border-[color-mix(in_oklab,var(--warn)_40%,transparent)] px-3 py-2 text-sm text-[var(--warn)]">
            {m.error ?? "Something went wrong."}
          </p>
        )}
        {!!sourceList.length && !streaming && !m.fallback && (
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            <p className="text-[0.72rem] text-fg-muted">Sources</p>
            <ul className="flex flex-wrap gap-1.5" aria-label="Sources">
              {sourceList.map((s) => (
                <li key={s.key}>
                  {s.href.startsWith("/") ? (
                    <Link href={s.href} className="chip !py-1 !text-[0.72rem]">
                      {s.n !== undefined && <span className="cite-n" aria-hidden="true">{s.n}</span>}
                      {s.title}
                    </Link>
                  ) : (
                    <a href={s.href} target="_blank" rel="noopener noreferrer" className="chip !py-1 !text-[0.72rem]">
                      {s.n !== undefined && <span className="cite-n" aria-hidden="true">{s.n}</span>}
                      {s.title} ↗
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
        {!streaming && (m.content || m.status === "error" || m.fallback) && (
          <div className="-ml-2 mt-2 flex gap-0.5">
            {m.content && !m.fallback && <CopyButton text={stripCitationMarkers(m.content)} />}
            {isLast && (
              <IconButton label={m.fallback || m.status === "error" ? "Try again" : "Retry"} onClick={retry} disabled={busy}>
                <svg width="13" height="13" viewBox="0 0 16 16" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M13 8a5 5 0 11-1.5-3.6M13 2.5V5h-2.5" /></svg>
                {m.fallback || m.status === "error" ? "Try again" : "Retry"}
              </IconButton>
            )}
          </div>
        )}
        {isLast && !streaming && !!m.suggestions?.length && <Suggestions items={m.suggestions} />}
      </div>
    </div>
  );
}

export function ChatView({ variant, onClose }: { variant: "floating" | "page"; onClose?: () => void }) {
  const { open, messages, busy, send, stop, clear, draft, setDraft } = useAskSree();
  const scroller = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLTextAreaElement>(null);
  const stick = useRef(true);
  const last = messages[messages.length - 1];
  const status = busy ? "My AI is answering…" : last?.role === "assistant" && last.status === "done" ? "Answer ready." : "";

  useEffect(() => {
    const el = scroller.current;
    if (el && stick.current) el.scrollTo?.({ top: el.scrollHeight, behavior: busy ? "auto" : "smooth" });
  }, [messages, busy]);

  // Focus the composer when the panel opens (it stays mounted between opens).
  useEffect(() => {
    if (variant === "page" || open) input.current?.focus({ preventScroll: true });
  }, [open, variant]);

  useEffect(() => {
    const el = input.current;
    if (!el) return;
    el.style.height = "0px";
    el.style.height = Math.min(el.scrollHeight, 168) + "px";
  }, [draft]);

  return (
    <div className="ask-chat flex h-full min-h-0 flex-col">
      <header className="ask-head flex items-center gap-3 px-5 pb-3.5 pt-4 max-sm:pt-[calc(env(safe-area-inset-top)+0.9rem)]">
        <SreeMark size={38} state={busy ? "thinking" : "idle"} />
        <div className="min-w-0 flex-1">
          <h2 className="text-[1.05rem] font-semibold leading-tight tracking-[-0.015em] text-fg">{NAME}</h2>
          <p className="truncate text-[0.8rem] leading-snug text-fg-muted">{SUBTITLE}</p>
        </div>
        {messages.length > 0 && (
          <IconButton label="Start a new conversation" onClick={clear}>
            <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M8 3v10M3 8h10" /></svg>
            <span className="hidden sm:inline">New chat</span>
          </IconButton>
        )}
        {variant === "floating" && (
          <>
            <Link href="/ask" onClick={onClose} className="ask-icon hidden sm:inline-flex" aria-label="Open My AI full page" title="Full page">
              <svg width="13" height="13" viewBox="0 0 16 16" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M9.5 2.5h4v4M13.5 2.5L9 7M6.5 13.5h-4v-4M2.5 13.5L7 9" /></svg>
            </Link>
            <button type="button" onClick={onClose} className="ask-icon" aria-label="Close My AI">
              <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
            </button>
          </>
        )}
      </header>

      <div
        ref={scroller}
        onScroll={(e) => {
          const el = e.currentTarget;
          stick.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
        }}
        className="thin-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5"
      >
        {messages.length === 0 ? (
          <div className="ask-welcome msg-in">
            <SreeMark size={44} />
            <p className="ask-welcome-name">{NAME}</p>
            <p className="ask-welcome-text">{GREETING}</p>
            <ul className="mt-5 flex flex-wrap justify-center gap-2" aria-label="Suggested questions">
              {SUGGESTED_QUESTIONS.map((q, i) => (
                <li key={q} className="msg-in" style={{ animationDelay: `${80 + i * 50}ms` }}>
                  <button type="button" onClick={() => send(q)} className="ask-chip">
                    {q}
                  </button>
                </li>
              ))}
            </ul>
            {variant === "page" && (
              <>
                <p className="eyebrow mt-10">More to ask</p>
                <ul className="mt-3 flex flex-wrap justify-center gap-2">
                  {MORE_QUESTIONS.map((q) => (
                    <li key={q}>
                      <button type="button" onClick={() => send(q)} className="ask-chip">
                        {q}
                      </button>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-7">
            {messages.map((m, i) => (
              <Message key={m.id} m={m} isLast={i === messages.length - 1} />
            ))}
          </div>
        )}
      </div>

      <p className="sr-only" role="status" aria-live="polite">
        {status}
      </p>

      <form
        className="ask-compose px-4 pb-4 pt-2 max-sm:pb-[calc(env(safe-area-inset-bottom)+0.75rem)]"
        onSubmit={(e) => {
          e.preventDefault();
          send(draft);
        }}
      >
        <div className="ask-field">
          <label htmlFor={`ask-input-${variant}`} className="sr-only">
            Ask My AI about Sree
          </label>
          <textarea
            id={`ask-input-${variant}`}
            ref={input}
            rows={1}
            value={draft}
            maxLength={MAX_INPUT}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault();
                send(draft);
              }
            }}
            placeholder="Ask about Sree's work…"
            className="chat-input max-h-[168px] min-h-[26px] flex-1 resize-none bg-transparent py-1.5 text-[16px] leading-[1.55] text-fg outline-none placeholder:text-fg-muted focus-visible:outline-none"
          />
          {busy ? (
            <button type="button" onClick={stop} className="ask-send ask-stop" aria-label="Stop generating" title="Stop">
              <span className="h-2.5 w-2.5 rounded-[2px] bg-current" aria-hidden="true" />
            </button>
          ) : (
            <button type="submit" disabled={!draft.trim()} className="ask-send" aria-label="Send question" title="Send">
              <svg width="17" height="17" viewBox="0 0 16 16" aria-hidden="true"><path d="M8 13V3M3.5 7.5L8 3l4.5 4.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>
          )}
        </div>
        <p className="mt-2 flex justify-between gap-3 px-2 text-[0.7rem] text-fg-muted">
          <span>AI answers can be wrong. Check important details with Sree.</span>
          {draft.length > MAX_INPUT * 0.8 && <span className="mono tabular-nums">{draft.length}/{MAX_INPUT}</span>}
        </p>
      </form>
      <style>{`
        .ask-head{border-bottom:1px solid color-mix(in oklab,var(--line) 80%,transparent)}
        .ask-icon{display:inline-flex;align-items:center;justify-content:center;width:36px;height:36px;border-radius:999px;color:var(--fg-soft);transition:background-color .2s,color .2s}
        .ask-icon:hover{background:var(--glass-lo);color:var(--fg)}
        .ask-icon:focus-visible,.ask-chip:focus-visible,.ask-send:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
        .ask-chat .md{font-size:15.5px;line-height:1.62;color:var(--fg)}
        .ask-chat .md > * + *{margin-top:.75em}
        .ask-chat .md li + li{margin-top:.35em}
        .ask-chat .md code{font-size:.86em}
        .ask-chat .md pre{font-size:13.5px;line-height:1.55}
        .ask-chat .md h1,.ask-chat .md h2,.ask-chat .md h3{font-size:1.02em;margin-top:1.1em}
        .ask-user-msg{padding:.6rem .95rem;border-radius:18px 18px 6px 18px;font-size:15.5px;line-height:1.55;color:var(--fg);background:color-mix(in oklab,var(--accent) 16%,var(--bg-elev));box-shadow:inset 0 0 0 1px color-mix(in oklab,var(--accent) 30%,transparent)}
        .ask-welcome{display:flex;min-height:100%;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:1.5rem .5rem}
        .ask-welcome-name{margin-top:.9rem;font-size:1.15rem;font-weight:600;letter-spacing:-.015em;color:var(--fg)}
        .ask-welcome-text{margin-top:.35rem;max-width:22rem;font-size:15.5px;line-height:1.55;color:var(--fg-soft)}
        .ask-chip{display:inline-flex;align-items:center;min-height:34px;padding:.4rem .85rem;border-radius:999px;border:1px solid var(--line);background:var(--glass-lo);font-size:.86rem;line-height:1.3;text-align:left;color:var(--fg-soft);transition:border-color .2s,background-color .2s,color .2s,transform .3s var(--ease-spring)}
        .ask-chip:hover{border-color:var(--accent);background:var(--accent-soft);color:var(--fg);transform:translateY(-1px)}
        .ask-chip:disabled{opacity:.5;transform:none}
        .ask-compose{border-top:1px solid color-mix(in oklab,var(--line) 70%,transparent)}
        .ask-field{display:flex;align-items:flex-end;gap:.5rem;padding:.45rem .45rem .45rem 1rem;border-radius:22px;border:1px solid var(--line);background:var(--bg-elev);transition:border-color .2s,box-shadow .2s}
        .ask-field:focus-within{border-color:var(--accent);box-shadow:0 0 0 4px color-mix(in oklab,var(--accent) 16%,transparent)}
        .ask-send{display:inline-flex;flex-shrink:0;align-items:center;justify-content:center;width:38px;height:38px;border-radius:999px;color:#fff;background:var(--accent-solid);transition:opacity .2s,transform .3s var(--ease-spring),background-color .2s}
        .ask-send:hover:not(:disabled){transform:scale(1.05)}
        .ask-send:disabled{opacity:.35;cursor:not-allowed}
        .ask-stop{background:var(--fg);color:var(--bg)}
        @media (prefers-reduced-motion: no-preference){
          .msg-in{animation:msgIn 320ms var(--ease-out) both}
          .typing-dot{animation:typing 1.1s var(--ease-in-out) infinite}
        }
        @keyframes msgIn{from{opacity:0;transform:translateY(6px)}}
        @keyframes typing{0%,100%{opacity:.25;transform:translateY(0)}40%{opacity:1;transform:translateY(-3px)}}
      `}</style>
    </div>
  );
}
