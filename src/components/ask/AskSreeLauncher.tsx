"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { SreeMark } from "@/components/ui/SreeMark";
import { useAskSree } from "./AskSreeProvider";
import dynamic from "next/dynamic";
import { useFocusTrap } from "@/lib/useFocusTrap";

// The chat (with its Markdown renderer) loads on first open, not with the page.
const ChatView = dynamic(() => import("./ChatView").then((m) => m.ChatView), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center text-sm text-fg-muted" role="status">
      Opening My AI…
    </div>
  ),
});

/**
 * The single, global entry point to My AI, bottom right on every page.
 * Desktop: a labelled pill with the keyboard shortcut and an anchored panel.
 * Phones: a logo-only button and a full-height sheet above the keyboard.
 *
 * The panel stays mounted after the first open, so closing and reopening keeps
 * the conversation, its scroll position and any half-written question. It
 * closes with its X, with Escape, or with a click or tap anywhere outside it.
 */
export function AskSreeLauncher() {
  const { open, openChat, closeChat, busy, launcherRef } = useAskSree();
  const pathname = usePathname();
  const panel = useRef<HTMLDivElement>(null);
  const [mobile, setMobile] = useState(false);
  const [mounted, setMounted] = useState(false);
  // "⌘" on Apple platforms, "Ctrl" elsewhere; null until mounted.
  const [modKey, setModKey] = useState<string | null>(null);
  useEffect(() => {
    const nav = navigator as Navigator & { userAgentData?: { platform?: string } };
    const platform = nav.userAgentData?.platform || nav.platform || nav.userAgent;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- platform is only known in the browser
    setModKey(/mac|iphone|ipad|ipod/i.test(platform) ? "⌘" : "Ctrl");
  }, []);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 639px)");
    const set = () => setMobile(mq.matches);
    set();
    mq.addEventListener("change", set);
    return () => mq.removeEventListener("change", set);
  }, []);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- mount the chat on first open, then keep it
    if (open) setMounted(true);
  }, [open]);

  // Track the visual viewport so the sheet stays above the on-screen keyboard.
  useEffect(() => {
    if (!open || !mobile || !window.visualViewport) return;
    const vv = window.visualViewport;
    const apply = () => {
      panel.current?.style.setProperty("--vvh", `${vv.height}px`);
      panel.current?.style.setProperty("--vvt", `${vv.offsetTop}px`);
    };
    apply();
    vv.addEventListener("resize", apply);
    vv.addEventListener("scroll", apply);
    return () => {
      vv.removeEventListener("resize", apply);
      vv.removeEventListener("scroll", apply);
    };
  }, [open, mobile]);

  // Escape closes everywhere; page scroll is locked behind the mobile sheet.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && closeChat();
    window.addEventListener("keydown", onKey);
    let prev = "";
    if (mobile) {
      prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
    }
    return () => {
      window.removeEventListener("keydown", onKey);
      if (mobile) document.body.style.overflow = prev;
    };
  }, [open, mobile, closeChat]);

  // Click-away: a press that starts outside the panel and the launcher closes
  // it. Presses inside (typing, scrolling, selecting text, its own controls,
  // anything rendered under [data-ask-owned]) never do, and a text selection
  // that starts inside and ends outside starts inside, so it is kept.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (e.button !== 0) return;
      const t = e.target as Element | null;
      if (!t || !t.isConnected) return;
      if (panel.current?.contains(t) || launcherRef.current?.contains(t) || t.closest("[data-ask-owned]")) return;
      closeChat({ restoreFocus: false });
    };
    // Registered after the click that opened it has finished.
    const id = window.setTimeout(() => document.addEventListener("pointerdown", onDown, true), 0);
    return () => {
      window.clearTimeout(id);
      document.removeEventListener("pointerdown", onDown, true);
    };
  }, [open, closeChat, launcherRef]);

  useFocusTrap(panel, open && mobile);

  if (pathname === "/ask") return null;

  return (
    <>
      <button
        ref={launcherRef}
        type="button"
        onClick={() => (open ? closeChat() : openChat())}
        aria-expanded={open}
        aria-controls="ask-sree-panel"
        aria-label={open ? "Close My AI" : "My AI"}
        aria-keyshortcuts="Meta+K Control+K"
        title={open ? "Close My AI" : modKey ? `My AI (${modKey} K)` : "My AI"}
        className={`ask-launcher glass group fixed bottom-[calc(env(safe-area-inset-bottom)+1rem)] right-[calc(env(safe-area-inset-right)+1rem)] z-[55] inline-flex items-center rounded-full py-1.5 pl-1.5 text-sm font-medium text-fg transition-[transform,opacity,box-shadow] duration-500 ease-[var(--ease-spring)] hover:-translate-y-0.5 hover:shadow-[var(--glow)] active:scale-[0.97] sm:right-6 sm:bottom-6 ${
          open && mobile ? "pointer-events-none translate-y-4 opacity-0" : ""
        }`}
      >
        <SreeMark size={34} state={busy ? "thinking" : "idle"} />
        <span className="ask-launcher-label" aria-hidden="true">
          <span>{open ? "Close" : "My AI"}</span>
          {/* Desktop only, and only once the platform is known (no server/client mismatch). */}
          {modKey && !open && (
            <span className="ask-kbd" data-testid="ask-shortcut">
              <kbd>{modKey}</kbd>
              <kbd>K</kbd>
            </span>
          )}
        </span>
      </button>

      <div
        id="ask-sree-panel"
        ref={panel}
        role="dialog"
        aria-modal={mobile ? true : undefined}
        aria-label="My AI assistant"
        hidden={!open}
        data-open={open || undefined}
        data-dense="true"
        className="glass ask-panel fixed z-[56] flex flex-col overflow-hidden"
      >
        {mounted && <ChatView variant="floating" onClose={() => closeChat()} />}
      </div>
      <style>{`
        .ask-panel{--glass-tint-strong: color-mix(in oklab, var(--bg) 90%, transparent);
          right:1.5rem;bottom:5.75rem;
          width:min(500px, calc(100vw - 3rem));
          height:min(700px, calc(100dvh - 12.5rem));
          min-height:min(440px, calc(100dvh - 7rem));
          border-radius:28px;
          box-shadow:0 30px 80px -30px rgb(3 8 20 / .55), 0 0 0 1px var(--line);
          transform-origin:bottom right;
          /* Nearly opaque: page text never shows through behind the conversation. */
          background-color:color-mix(in oklab, var(--bg) 94%, transparent);
        }
        .ask-panel[data-open]{animation:ask-in 260ms var(--ease-out) both}
        @keyframes ask-in{from{opacity:0;transform:translateY(12px) scale(.985)}to{opacity:1;transform:none}}
        @media (max-width:639px){
          .ask-panel{inset:0;top:var(--vvt,0px);right:0;bottom:auto;width:100%;height:var(--vvh,100dvh);min-height:0;border-radius:0;border:0;box-shadow:none;background:var(--bg)}
          @keyframes ask-in{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:none}}
        }
        @media (prefers-reduced-motion: reduce){.ask-panel[data-open]{animation:none}}
        .ask-launcher-label{display:inline-flex;align-items:center;overflow:hidden;white-space:nowrap;max-width:15rem;padding:0 .85rem 0 .5rem;opacity:1;transition:max-width 420ms var(--ease-emph),padding 420ms var(--ease-emph),opacity 260ms var(--ease-out)}
        @media (max-width:639px){.ask-launcher{padding:7px}.ask-launcher .ask-launcher-label{display:none}}
        .ask-kbd{display:none;align-items:center;gap:3px;margin-left:.6rem}
        @media (min-width:1024px) and (hover:hover) and (pointer:fine){.ask-kbd{display:inline-flex}}
        .ask-kbd kbd{display:inline-flex;align-items:center;justify-content:center;min-width:1.5rem;height:1.5rem;padding:0 .4rem;border-radius:7px;font-family:inherit;font-size:.78rem;font-weight:600;line-height:1;letter-spacing:0;color:var(--fg);background:color-mix(in oklab,var(--fg) 7%,transparent);border:1px solid color-mix(in oklab,var(--fg) 22%,transparent);box-shadow:inset 0 -1.5px 0 color-mix(in oklab,var(--fg) 16%,transparent)}
        @media (prefers-reduced-motion: reduce){.ask-launcher-label{transition:none}}`}</style>
    </>
  );
}
