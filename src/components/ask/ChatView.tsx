"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ComponentProps } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { SreeMark } from "@/components/ui/SreeMark";
import { MAX_INPUT, useAskSree, type ChatMessage } from "./AskSreeProvider";
import { SUGGESTED_QUESTIONS } from "@/lib/ai/protocol";

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

function CopyButton({ text }: { text: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      className="chip !py-1"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setDone(true);
          window.setTimeout(() => setDone(false), 1600);
        } catch {}
      }}
      aria-label={done ? "Copied" : "Copy response"}
    >
      {done ? "Copied" : "Copy"}
    </button>
  );
}

function Message({ m, isLast }: { m: ChatMessage; isLast: boolean }) {
  const { retry, busy } = useAskSree();
  if (m.role === "user") {
    return (
      <div className="flex justify-end">
        <p className="max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-br-md bg-accent-soft px-4 py-2.5 text-[0.94rem] text-fg">{m.content}</p>
      </div>
    );
  }
  const streaming = m.status === "streaming";
  return (
    <div className="flex gap-3">
      <div className="mt-0.5 shrink-0">
        <SreeMark size={26} state={streaming ? "thinking" : "idle"} />
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
          <p className="text-sm text-fg-muted">
            Thinking<span className="caret" />
          </p>
        ) : null}
        {m.status === "stopped" && <p className="mt-2 text-xs text-fg-muted">Stopped.</p>}
        {m.status === "error" && (
          <p role="alert" className="mt-1 text-sm text-[var(--warn)]">
            {m.error ?? "Something went wrong."}
          </p>
        )}
        {!!m.sources?.length && !streaming && (
          <div className="mt-3">
            <p className="eyebrow !text-[0.62rem]">Sources</p>
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
          <div className="mt-3 flex gap-1.5">
            {m.content && <CopyButton text={m.content} />}
            {isLast && (
              <button type="button" className="chip !py-1" onClick={retry} disabled={busy}>
                Retry
              </button>
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
  const status = busy ? "Ask Sree is answering…" : last?.role === "assistant" && last.status === "done" ? "Answer ready." : "";

  useEffect(() => {
    const el = scroller.current;
    if (el && stick.current) el.scrollTo?.({ top: el.scrollHeight, behavior: busy ? "auto" : "smooth" });
  }, [messages, busy]);

  useEffect(() => {
    input.current?.focus({ preventScroll: true });
  }, []);

  // Auto-size the textarea.
  useEffect(() => {
    const el = input.current;
    if (!el) return;
    el.style.height = "0px";
    el.style.height = Math.min(el.scrollHeight, 160) + "px";
  }, [draft]);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center gap-3 border-b border-line px-4 py-3">
        <SreeMark size={34} state={busy ? "thinking" : "idle"} />
        <div className="min-w-0 flex-1">
          <h2 className="text-[0.98rem] font-semibold tracking-[-0.01em]">Ask Sree</h2>
          <p className="truncate text-xs text-fg-muted">AI assistant · answers from Sree&apos;s verified portfolio</p>
        </div>
        {messages.length > 0 && (
          <button type="button" onClick={clear} className="chip" aria-label="Clear conversation">
            Clear
          </button>
        )}
        {variant === "floating" && (
          <>
            <Link href="/ask" onClick={onClose} className="chip hidden sm:inline-flex" aria-label="Open full-page conversation">
              Expand
            </Link>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-line text-fg-soft hover:border-accent hover:text-fg"
              aria-label="Close Ask Sree"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
            </button>
          </>
        )}
      </div>

      <div
        ref={scroller}
        onScroll={(e) => {
          const el = e.currentTarget;
          stick.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
        }}
        className="thin-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-5"
      >
        {messages.length === 0 ? (
          <div>
            <p className="text-[0.95rem] leading-relaxed text-fg-soft">
              Hi — I&apos;m an AI assistant that answers questions about Sree&apos;s work, using only his verified resume, projects and public repositories. I&apos;m not Sree, but I can point you to the right place.
            </p>
            <p className="eyebrow mt-6">Try asking</p>
            <ul className={`mt-3 grid gap-2 ${variant === "page" ? "sm:grid-cols-2" : ""}`}>
              {SUGGESTED_QUESTIONS.map((q) => (
                <li key={q}>
                  <button
                    type="button"
                    onClick={() => send(q)}
                    className="group flex w-full items-center justify-between gap-3 rounded-xl border border-line px-3.5 py-2.5 text-left text-sm text-fg-soft transition-colors hover:border-accent hover:bg-accent-soft hover:text-fg"
                  >
                    <span>{q}</span>
                    <span className="shrink-0 text-fg-muted transition-transform group-hover:translate-x-0.5" aria-hidden="true">→</span>
                  </button>
                </li>
              ))}
            </ul>
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
        className="border-t border-line p-3"
        onSubmit={(e) => {
          e.preventDefault();
          send(draft);
        }}
      >
        <div className="flex items-end gap-2 rounded-2xl border border-line bg-bg-elev px-3 py-2 focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/30">
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
            placeholder="Ask about experience, projects, skills…"
            className="max-h-40 min-h-[28px] flex-1 resize-none bg-transparent py-1 focus-visible:outline-none text-[16px] leading-6 text-fg outline-none placeholder:text-fg-muted sm:text-[0.95rem]"
          />
          {busy ? (
            <button type="button" onClick={stop} className="inline-flex h-9 shrink-0 items-center gap-2 rounded-full border border-line px-3 text-sm hover:border-accent" aria-label="Stop generating">
              <span className="h-2.5 w-2.5 rounded-[2px] bg-fg" aria-hidden="true" /> Stop
            </button>
          ) : (
            <button
              type="submit"
              disabled={!draft.trim()}
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent-solid text-white transition-opacity disabled:opacity-35"
              aria-label="Send question"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M8 13V3M3.5 7.5L8 3l4.5 4.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>
          )}
        </div>
        <p className="mt-2 flex justify-between gap-3 px-1 text-[0.68rem] text-fg-muted">
          <span>AI can make mistakes — check the linked sources.</span>
          <span className="mono tabular-nums">{draft.length}/{MAX_INPUT}</span>
        </p>
      </form>
    </div>
  );
}
