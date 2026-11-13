"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { ChatLink, ChatSource, FallbackReason, SourceRef, StreamEvent } from "@/lib/ai/protocol";

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
};

type Ctx = {
  open: boolean;
  openChat: (prefill?: string) => void;
  closeChat: () => void;
  messages: ChatMessage[];
  busy: boolean;
  send: (text: string) => void;
  stop: () => void;
  retry: () => void;
  clear: () => void;
  draft: string;
  setDraft: (s: string) => void;
  launcherRef: React.RefObject<HTMLButtonElement | null>;
};

const AskCtx = createContext<Ctx | null>(null);
const STORAGE_KEY = "ask-sree:v3";
export const MAX_INPUT = 1000;

const uid = () => Math.random().toString(36).slice(2, 10);

export function AskSreeProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
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
      const payload = history
        .filter((m) => m.content.trim() && m.status !== "error" && !m.fallback)
        .slice(-12)
        .map((m) => ({ role: m.role, content: m.content }));

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: payload }),
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
        if (!gotDone) patch(assistantId, (m) => (m.status === "streaming" ? { ...m, status: "done" } : m));
      } catch (err) {
        if (ctrl.signal.aborted) {
          patch(assistantId, (m) => ({ ...m, status: "stopped" }));
        } else {
          patch(assistantId, (m) => ({
            ...m,
            status: "error",
            error: "I couldn't connect. Check your connection and try again.",
          }));
          console.error(err);
        }
      } finally {
        setBusy(false);
        abortRef.current = null;
      }
    },
    [patch],
  );

  const send = useCallback(
    (text: string) => {
      const t = text.trim().slice(0, MAX_INPUT);
      if (!t || busy) return;
      setDraft("");
      setOpen(true);
      void run([...messages, { id: uid(), role: "user", content: t, status: "done" }]);
    },
    [busy, messages, run],
  );

  const stop = useCallback(() => abortRef.current?.abort(), []);

  const retry = useCallback(() => {
    if (busy) return;
    const lastUser = [...messages].reverse().findIndex((m) => m.role === "user");
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

  // Keyboard shortcut: "/" opens Sree AI when not typing elsewhere.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
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
    () => ({ open, openChat, closeChat, messages, busy, send, stop, retry, clear, draft, setDraft, launcherRef }),
    [open, openChat, closeChat, messages, busy, send, stop, retry, clear, draft],
  );
  return <AskCtx.Provider value={value}>{children}</AskCtx.Provider>;
}

export function useAskSree() {
  const ctx = useContext(AskCtx);
  if (!ctx) throw new Error("useAskSree must be used inside AskSreeProvider");
  return ctx;
}
