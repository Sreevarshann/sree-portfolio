"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { ChatContext, ChatLink, ChatMode, ChatSource, FallbackReason, SourceRef, StreamEvent } from "@/lib/ai/protocol";

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  status?: "streaming" | "done" | "stopped" | "error";
  error?: string;
  sources?: ChatSource[];
  /** Sources this answer may cite by id; markers render against it. */
  sourceMap?: SourceRef[];
  /** Set when no written answer was possible: why, and the pages to read instead. */
  fallback?: { reason: FallbackReason; links: ChatLink[] };
  /** Follow-up questions offered under the answer. */
  suggestions?: string[];
  /** Catalog ids this question was asked about (Skill Explorer hand-off, job description mapping). */
  context?: ChatContext;
  /** Set on a job-description mapping card (rendered locally, never sent to the model). */
  report?: import("@/lib/skillSearch").JdReport;
};

type Ctx = {
  open: boolean;
  openChat: (prefill?: string) => void;
  closeChat: () => void;
  messages: ChatMessage[];
  busy: boolean;
  send: (text: string, context?: ChatContext) => void;
  /** Open the assistant and ask at once (Skill Explorer hand-off). */
  ask: (text: string, context?: ChatContext) => void;
  /** Adds a locally built job-description mapping to the conversation. */
  addReport: (report: import("@/lib/skillSearch").JdReport) => void;
  mode: ChatMode;
  setMode: (m: ChatMode) => void;
  stop: () => void;
  retry: () => void;
  clear: () => void;
  draft: string;
  setDraft: (s: string) => void;
  launcherRef: React.RefObject<HTMLButtonElement | null>;
};

const AskCtx = createContext<Ctx | null>(null);
const STORAGE_KEY = "ask-sree:v3";
const MODE_KEY = "ask-sree:mode";
export const MAX_INPUT = 4000;
/** Longer than the server's model timeout, so the server's own message normally arrives first. */
const CLIENT_TIMEOUT_MS = 75_000;

const uid = () => Math.random().toString(36).slice(2, 10);

export function AskSreeProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [mode, setModeState] = useState<ChatMode>("general");
  const modeRef = useRef<ChatMode>("general");
  const abortRef = useRef<AbortController | null>(null);
  const launcherRef = useRef<HTMLButtonElement | null>(null);
  const loaded = useRef(false);

  // Session-scoped history (cleared when the tab closes).
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as ChatMessage[];
        // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrate from sessionStorage once on mount
        setMessages(parsed.map((m) => (m.status === "streaming" ? { ...m, status: "stopped" } : m)));
      }
      if (sessionStorage.getItem(MODE_KEY) === "recruiter") {
        modeRef.current = "recruiter";
        setModeState("recruiter");
      }
    } catch {}
    loaded.current = true;
  }, []);
  useEffect(() => {
    if (!loaded.current) return;
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-40)));
    } catch {}
  }, [messages]);

  const patch = useCallback((id: string, fn: (m: ChatMessage) => ChatMessage) => {
    setMessages((ms) => ms.map((m) => (m.id === id ? fn(m) : m)));
  }, []);

  const run = useCallback(
    async (history: ChatMessage[]) => {
      const assistantId = uid();
      setMessages([...history, { id: assistantId, role: "assistant", content: "", status: "streaming" }]);
      setBusy(true);
      const ctrl = new AbortController();
      abortRef.current = ctrl;
      // A stalled connection never leaves the visitor waiting forever.
      let timedOut = false;
      const watchdog = window.setTimeout(() => {
        timedOut = true;
        ctrl.abort();
      }, CLIENT_TIMEOUT_MS);
      const payload = history
        .filter((m) => m.content.trim() && m.status !== "error" && !m.fallback && !m.report)
        .slice(-12)
        .map((m) => (m.context && m.role === "user" ? { role: m.role, content: m.content, context: m.context } : { role: m.role, content: m.content }));

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: payload, mode: modeRef.current }),
          signal: ctrl.signal,
        });
        if (!res.body) throw new Error("No response body");
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buf = "";
        let gotDone = false;
        for (;;) {
          const { value, done } = await reader.read();
          if (done) break;
          buf += decoder.decode(value, { stream: true });
          let nl: number;
          while ((nl = buf.indexOf("\n")) >= 0) {
            const line = buf.slice(0, nl).trim();
            buf = buf.slice(nl + 1);
            if (!line) continue;
            let ev: StreamEvent;
            try {
              ev = JSON.parse(line);
            } catch {
              continue;
            }
            if (ev.type === "sourceMap") patch(assistantId, (m) => ({ ...m, sourceMap: ev.items }));
            else if (ev.type === "sources") patch(assistantId, (m) => ({ ...m, sources: ev.sources }));
            else if (ev.type === "suggestions") patch(assistantId, (m) => ({ ...m, suggestions: ev.items }));
            else if (ev.type === "delta") patch(assistantId, (m) => ({ ...m, content: m.content + ev.text }));
            else if (ev.type === "fallback")
              patch(assistantId, (m) => ({ ...m, content: "", fallback: { reason: ev.reason, links: ev.links }, status: "done" }));
            else if (ev.type === "error") {
              gotDone = true;
              patch(assistantId, (m) => ({ ...m, status: "error", error: ev.message }));
            } else if (ev.type === "done") {
              gotDone = true;
              patch(assistantId, (m) => (m.status === "streaming" ? { ...m, status: "done" } : m));
            }
          }
        }
        // The stream ended without its closing event: keep any words already
        // shown, and say plainly that the answer is incomplete or missing.
        if (!gotDone)
          patch(assistantId, (m) =>
            m.status !== "streaming" ? m
            : m.content ? { ...m, status: "error", error: "The connection dropped before the answer finished. Try again for the full answer." }
            : { ...m, status: "error", error: "I couldn't get an answer back that time. Please try again." },
          );
      } catch (err) {
        if (timedOut) {
          patch(assistantId, (m) => ({ ...m, status: "error", error: "That took longer than it should. Please try again in a moment." }));
        } else if (ctrl.signal.aborted) {
          patch(assistantId, (m) => ({ ...m, status: "stopped" }));
        } else {
          const offline = typeof navigator !== "undefined" && navigator.onLine === false;
          patch(assistantId, (m) => ({
            ...m,
            status: "error",
            error: offline ? "You seem to be offline. Reconnect and try again." : "I couldn't connect. Check your connection and try again.",
          }));
          console.error(err);
        }
      } finally {
        window.clearTimeout(watchdog);
        setBusy(false);
        abortRef.current = null;
      }
    },
    [patch],
  );

  const send = useCallback(
    (text: string, context?: ChatContext) => {
      const t = text.trim().slice(0, MAX_INPUT);
      if (!t || busy) return;
      setDraft("");
      setOpen(true);
      void run([...messages, { id: uid(), role: "user", content: t, status: "done", ...(context ? { context } : {}) }]);
    },
    [busy, messages, run],
  );
  const ask = useCallback(
    (text: string, context?: ChatContext) => {
      setOpen(true);
      send(text, context);
    },
    [send],
  );
  const addReport = useCallback((report: import("@/lib/skillSearch").JdReport) => {
    setOpen(true);
    setMessages((ms) => [...ms, { id: uid(), role: "assistant", content: "", status: "done", report }]);
  }, []);
  const setMode = useCallback((m: ChatMode) => {
    modeRef.current = m;
    setModeState(m);
    try {
      sessionStorage.setItem(MODE_KEY, m);
    } catch {}
  }, []);

  const stop = useCallback(() => abortRef.current?.abort(), []);

  const retry = useCallback(() => {
    if (busy) return;
    const lastUser = [...messages].reverse().findIndex((m) => m.role === "user");
    if (messages[messages.length - 1]?.report) return;
    if (lastUser < 0) return;
    const idx = messages.length - 1 - lastUser;
    void run(messages.slice(0, idx + 1));
  }, [busy, messages, run]);

  const clear = useCallback(() => {
    abortRef.current?.abort();
    setMessages([]);
  }, []);

  const openChat = useCallback((prefill?: string) => {
    if (prefill) setDraft(prefill);
    setOpen(true);
  }, []);
  const closeChat = useCallback(() => {
    setOpen(false);
    window.setTimeout(() => launcherRef.current?.focus(), 0);
  }, []);

  // Warm the chat bundle once the page is idle so the first open is instant.
  useEffect(() => {
    const ric = window.requestIdleCallback ?? ((cb: () => void) => window.setTimeout(cb, 3000));
    const id = ric(() => void import("./ChatView"), { timeout: 6000 } as IdleRequestOptions);
    return () => (window.cancelIdleCallback ?? window.clearTimeout)(id as number);
  }, []);

  // Keyboard shortcuts: Cmd+K (Ctrl+K on Windows and Linux) toggles Sree AI
  // from anywhere; "/" opens it when not typing elsewhere. This is the only
  // handler for either key on the site. On the full-page view (/ask) the
  // floating panel is not rendered, so the shortcut focuses that page's composer.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if ((e.metaKey || e.ctrlKey) && !e.altKey && !e.shiftKey && e.key.toLowerCase() === "k") {
        e.preventDefault();
        const page = document.getElementById("ask-input-page");
        if (page) {
          page.focus();
          return;
        }
        setOpen((o) => !o);
        return;
      }
      if (e.key === "/" && !e.metaKey && !e.ctrlKey && !t.closest("input, textarea, [contenteditable='true']")) {
        e.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const value = useMemo(
    () => ({ open, openChat, closeChat, messages, busy, send, ask, addReport, mode, setMode, stop, retry, clear, draft, setDraft, launcherRef }),
    [open, openChat, closeChat, messages, busy, send, ask, addReport, mode, setMode, stop, retry, clear, draft],
  );
  return <AskCtx.Provider value={value}>{children}</AskCtx.Provider>;
}

export function useAskSree() {
  const ctx = useContext(AskCtx);
  if (!ctx) throw new Error("useAskSree must be used inside AskSreeProvider");
  return ctx;
}
