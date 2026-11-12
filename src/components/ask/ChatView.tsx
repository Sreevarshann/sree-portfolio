"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ComponentProps } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { SreeMark } from "@/components/ui/SreeMark";
import { MAX_INPUT, useAskSree, type ChatMessage } from "./AskSreeProvider";
import { MORE_QUESTIONS, SUGGESTED_QUESTIONS } from "@/lib/ai/protocol";

export const GREETING = "Hey, I'm Sree's AI. Ask me about his experience, projects, or what he's been building.";
export const SUBTITLE = "My digital twin — ask about my work, projects, and experience.";

function MdLink({ href = "", children, ...rest }: ComponentProps<"a">) {
  if (href.startsWith("/") || href.startsWith("#")) {
    return (
      <Link href={href} {...rest}>
        {children}
      </Link>
    );
  }
  const safe = /^(https?:|mailto:)/i.test(href) ? href : undefined;
  if (!safe) return <span>{children}</span>;
  return (
    <a href={safe} target={safe.startsWith("mailto:") ? undefined : "_blank"} rel="noopener noreferrer" {...rest}>
      {children}
    </a>
  );
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
    <span className="inline-flex items-center gap-1 py-2" aria-label="Sree AI is thinking">
      {[0, 1, 2].map((i) => (
        <span key={i} className="typing-dot h-1.5 w-1.5 rounded-full bg-accent" style={{ animationDelay: `${i * 0.16}s` }} />
      ))}
    </span>
  );
}

function Message({ m, isLast }: { m: ChatMessage; isLast: boolean }) {
  const { retry, busy } = useAskSree();
  if (m.role === "user") {
    return (
      <div className="msg-in flex justify-end">
        <p className="max-w-[86%] whitespace-pre-wrap rounded-[20px] rounded-br-[6px] bg-gradient-to-br from-[var(--accent-solid)] to-[#1d47b0] px-4 py-2.5 text-[0.94rem] leading-relaxed text-white shadow-[0_8px_24px_-12px_rgb(31_95_224/0.7)]">
          {m.content}
        </p>
      </div>
    );
  }
  const streaming = m.status === "streaming";
  return (
    <div className="msg-in flex gap-3">
      <div className="mt-0.5 shrink-0">
        <SreeMark size={28} state={streaming ? "thinking" : "idle"} />
      </div>
      <div className="min-w-0 flex-1">
        {m.fallback && (
          <p className="mb-2 inline-flex items-center gap-2 rounded-full border border-line px-2.5 py-1 text-[0.7rem] text-fg-muted">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--warn)]" aria-hidden="true" /> Search results · AI model offline
          </p>
        )}
        {m.content ? (
          <div className={`md ${streaming ? "caret" : ""}`}>
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={{ a: MdLink }}>
              {m.content}
            </ReactMarkdown>
          </div>
        ) : streaming ? (
          <Typing />
        ) : null}
        {m.status === "stopped" && <p className="mt-2 text-xs text-fg-muted">Stopped — ask again or retry.</p>}
        {m.status === "error" && (
          <p role="alert" className="mt-1 rounded-xl border border-[color-mix(in_oklab,var(--warn)_40%,transparent)] px-3 py-2 text-sm text-[var(--warn)]">
            {m.error ?? "Something went wrong."}
          </p>
        )}
        {!!m.sources?.length && !streaming && (
          <div className="mt-3">
            <p className="eyebrow !text-[0.6rem]">Sources</p>
            <ul className="mt-1.5 flex flex-wrap gap-1.5">
              {m.sources.map((s) => (
                <li key={s.href + s.title}>
                  {s.href.startsWith("/") ? (
                    <Link href={s.href} className="chip !py-1 !text-[0.68rem]">{s.title}</Link>
                  ) : (
                    <a href={s.href} target="_blank" rel="noopener noreferrer" className="chip !py-1 !text-[0.68rem]">{s.title} ↗</a>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
        {!streaming && (m.content || m.status === "error") && (
          <div className="-ml-2 mt-2 flex gap-0.5">
            {m.content && <CopyButton text={m.content} />}
            {isLast && (
              <IconButton label="Retry" onClick={retry} disabled={busy}>
                <svg width="13" height="13" viewBox="0 0 16 16" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M13 8a5 5 0 11-1.5-3.6M13 2.5V5h-2.5" /></svg>
                Retry
              </IconButton>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export function ChatView({ variant, onClose }: { variant: "floating" | "page"; onClose?: () => void }) {
  const { messages, busy, send, stop, clear, draft, setDraft } = useAskSree();
  const scroller = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLTextAreaElement>(null);
  const stick = useRef(true);
  const last = messages[messages.length - 1];
  const status = busy ? "Sree AI is answering…" : last?.role === "assistant" && last.status === "done" ? "Answer ready." : "";

  useEffect(() => {
    const el = scroller.current;
    if (el && stick.current) el.scrollTo?.({ top: el.scrollHeight, behavior: busy ? "auto" : "smooth" });
  }, [messages, busy]);

  useEffect(() => {
    input.current?.focus({ preventScroll: true });
  }, []);

  useEffect(() => {
    const el = input.current;
    if (!el) return;
    el.style.height = "0px";
    el.style.height = Math.min(el.scrollHeight, 160) + "px";
  }, [draft]);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center gap-3 px-4 pb-3 pt-4">
        <div className="relative">
          <SreeMark size={40} state={busy ? "thinking" : "idle"} />
          <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-[var(--bg)] bg-[var(--success)]" aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-[1.02rem] font-semibold tracking-[-0.015em]">Sree AI</h2>
          <p className="truncate text-[0.74rem] text-fg-muted">{SUBTITLE}</p>
        </div>
        {messages.length > 0 && (
          <IconButton label="Clear conversation" onClick={clear}>
            <svg width="13" height="13" viewBox="0 0 16 16" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M3 4.5h10M6.5 4.5V3h3v1.5M4.5 4.5l.7 8.5h5.6l.7-8.5" /></svg>
            <span className="hidden sm:inline">New chat</span>
          </IconButton>
        )}
        {variant === "floating" && (
          <>
            <Link href="/ask" onClick={onClose} className="hidden h-8 w-8 items-center justify-center rounded-full text-fg-muted hover:bg-[var(--glass-lo)] hover:text-fg sm:inline-flex" aria-label="Open full-page conversation" title="Full page">
              <svg width="13" height="13" viewBox="0 0 16 16" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M9.5 2.5h4v4M13.5 2.5L9 7M6.5 13.5h-4v-4M2.5 13.5L7 9" /></svg>
            </Link>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full text-fg-soft hover:bg-[var(--glass-lo)] hover:text-fg"
              aria-label="Close Sree AI"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
            </button>
          </>
        )}
      </div>
      <div className="mx-4 h-px bg-gradient-to-r from-transparent via-line-strong to-transparent" aria-hidden="true" />

      <div
        ref={scroller}
        onScroll={(e) => {
          const el = e.currentTarget;
          stick.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
        }}
        className="thin-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-5"
      >
        {messages.length === 0 ? (
          <div className="msg-in">
            <div className="flex gap-3">
              <div className="mt-0.5 shrink-0">
                <SreeMark size={28} />
              </div>
              <p className="rounded-[20px] rounded-tl-[6px] bg-[var(--glass-lo)] px-4 py-3 text-[0.98rem] leading-relaxed text-fg ring-1 ring-line">{GREETING}</p>
            </div>
            <ul className="mt-5 grid grid-cols-2 gap-2" aria-label="Suggested questions">
              {SUGGESTED_QUESTIONS.map((q, i) => (
                <li key={q} className="msg-in" style={{ animationDelay: `${120 + i * 60}ms` }}>
                  <button
                    type="button"
                    onClick={() => send(q)}
                    className="group flex h-full w-full items-center justify-between gap-2 rounded-2xl border border-line bg-[var(--glass-lo)] px-3.5 py-3 text-left text-[0.88rem] text-fg-soft transition-[border-color,background-color,color,transform] duration-300 hover:-translate-y-0.5 hover:border-accent hover:bg-accent-soft hover:text-fg active:translate-y-0"
                  >
                    <span>{q}</span>
                    <span className="shrink-0 text-accent transition-transform duration-300 group-hover:translate-x-0.5" aria-hidden="true">→</span>
                  </button>
                </li>
              ))}
            </ul>
            {variant === "page" && (
              <>
                <p className="eyebrow mt-8">More to ask</p>
                <ul className="mt-3 flex flex-wrap gap-2">
                  {MORE_QUESTIONS.map((q) => (
                    <li key={q}>
                      <button type="button" onClick={() => send(q)} className="chip !py-1.5 hover:!border-accent">
                        {q}
                      </button>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-6">
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
        className="px-3 pb-3"
        onSubmit={(e) => {
          e.preventDefault();
          send(draft);
        }}
      >
        <div className="flex items-end gap-2 rounded-[22px] border border-line bg-bg-elev px-3 py-2 shadow-[inset_0_1px_0_var(--glass-lo)] transition-[border-color,box-shadow] focus-within:border-accent focus-within:ring-4 focus-within:ring-accent/15">
          <label htmlFor={`ask-input-${variant}`} className="sr-only">
            Ask a question about Sree
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
            placeholder="Ask about his work…"
            className="chat-input max-h-40 min-h-[28px] flex-1 resize-none bg-transparent py-1 text-[16px] leading-6 text-fg outline-none placeholder:text-fg-muted focus-visible:outline-none sm:text-[0.95rem]"
          />
          {busy ? (
            <button type="button" onClick={stop} className="inline-flex h-9 shrink-0 items-center gap-2 rounded-full border border-line px-3 text-sm hover:border-accent" aria-label="Stop generating">
              <span className="h-2.5 w-2.5 rounded-[2px] bg-fg" aria-hidden="true" /> Stop
            </button>
          ) : (
            <button
              type="submit"
              disabled={!draft.trim()}
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent-solid text-white transition-[opacity,transform] duration-300 ease-[var(--ease-spring)] hover:scale-105 active:scale-95 disabled:scale-100 disabled:opacity-35"
              aria-label="Send question"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M8 13V3M3.5 7.5L8 3l4.5 4.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>
          )}
        </div>
        <p className="mt-2 flex justify-between gap-3 px-2 text-[0.66rem] text-fg-muted">
          <span>AI assistant · may be wrong, can&apos;t make commitments for Sree</span>
          <span className="mono hidden tabular-nums sm:inline">{draft.length > 0 ? `${draft.length}/${MAX_INPUT}` : "Enter ↵ · Shift+Enter newline"}</span>
        </p>
      </form>
      <style>{`
        @media (prefers-reduced-motion: no-preference){
          .msg-in{animation:msgIn 520ms var(--ease-spring) both}
          .typing-dot{animation:typing 1.1s var(--ease-in-out) infinite}
        }
        @keyframes msgIn{from{opacity:0;transform:translateY(10px) scale(.985)}}
        @keyframes typing{0%,100%{opacity:.25;transform:translateY(0)}40%{opacity:1;transform:translateY(-3px)}}
      `}</style>
    </div>
  );
}
