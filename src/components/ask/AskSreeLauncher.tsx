"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { SreeMark } from "@/components/ui/SreeMark";
import { useAskSree } from "./AskSreeProvider";
import dynamic from "next/dynamic";

// The chat (with its Markdown renderer) loads on first open, not with the page.
const ChatView = dynamic(() => import("./ChatView").then((m) => m.ChatView), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center text-sm text-fg-muted" role="status">
      Opening Sree AI…
    </div>
  ),
});
import { useFocusTrap } from "@/lib/useFocusTrap";

/**
 * The single, global entry point to Sree AI, bottom right on every page.
 * Desktop: a labelled pill and an anchored popover. Phones: a logo-only
 * button and a full-height sheet.
 */
export function AskSreeLauncher() {
  const { open, openChat, closeChat, busy, launcherRef } = useAskSree();
  const pathname = usePathname();
  const panel = useRef<HTMLDivElement>(null);
  const [mobile, setMobile] = useState(false);
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

  // Track the visual viewport so the sheet stays above the on-screen keyboard.
  useEffect(() => {
    if (!open || !mobile || !window.visualViewport) return;
    const vv = window.visualViewport;
    const apply = () => panel.current?.style.setProperty("--vvh", `${vv.height}px`);
    apply();
    vv.addEventListener("resize", apply);
    vv.addEventListener("scroll", apply);
    return () => {
      vv.removeEventListener("resize", apply);
      vv.removeEventListener("scroll", apply);
    };
  }, [open, mobile]);

  // Lock page scroll behind the mobile sheet; Esc closes everywhere.
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
        aria-label={open ? "Close" : "Ask My AI"}
        aria-keyshortcuts="Meta+K Control+K"
        className={`ask-launcher glass group fixed bottom-[calc(env(safe-area-inset-bottom)+1rem)] right-[calc(env(safe-area-inset-right)+1rem)] z-[55] inline-flex items-center rounded-full py-1.5 pl-1.5 text-sm font-medium text-fg transition-[transform,opacity,box-shadow] duration-500 ease-[var(--ease-spring)] hover:-translate-y-0.5 hover:shadow-[var(--glow)] active:scale-[0.97] sm:right-6 sm:bottom-6 ${
          open && mobile ? "pointer-events-none translate-y-4 opacity-0" : ""
        }`}
      >
        <SreeMark size={34} state={busy ? "thinking" : "idle"} />
        <span className="ask-launcher-label" aria-hidden="true">
          <span>{open ? "Close" : "Ask My AI"}</span>
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
        aria-label="Sree AI assistant"
        hidden={!open}
        data-dense="true"
        className="glass ask-panel fixed z-[56] flex flex-col overflow-hidden max-sm:inset-x-0 max-sm:top-0 max-sm:h-[var(--vvh,100dvh)] max-sm:rounded-none max-sm:border-0 sm:bottom-24 sm:right-6 sm:h-[min(680px,calc(100dvh-140px))] sm:w-[420px] sm:rounded-[28px]"
        style={{ animation: open ? "ask-in 560ms var(--ease-spring)" : undefined }}
      >
        {open && <ChatView variant="floating" onClose={closeChat} />}
      </div>
      <style>{`@keyframes ask-in{from{opacity:0;transform:translateY(22px) scale(.94);transform-origin:bottom right;filter:blur(6px)}to{opacity:1;transform:none;filter:none}}
        .ask-panel{--glass-tint-strong: color-mix(in oklab, var(--bg) 86%, transparent)}
        @media (max-width:639px){@keyframes ask-in{from{opacity:0;transform:translateY(40px)}to{opacity:1;transform:none}}}
        .ask-launcher-label{display:inline-flex;align-items:center;overflow:hidden;white-space:nowrap;max-width:15rem;padding:0 .85rem 0 .5rem;opacity:1;transition:max-width 420ms var(--ease-emph),padding 420ms var(--ease-emph),opacity 260ms var(--ease-out)}
        @media (max-width:639px){.ask-launcher{padding:7px}.ask-launcher .ask-launcher-label{display:none}}
        .ask-kbd{display:none;align-items:center;gap:3px;margin-left:.6rem}
        @media (min-width:1024px) and (hover:hover) and (pointer:fine){.ask-kbd{display:inline-flex}}
        .ask-kbd kbd{display:inline-flex;align-items:center;justify-content:center;min-width:1.5rem;height:1.5rem;padding:0 .4rem;border-radius:7px;font-family:inherit;font-size:.78rem;font-weight:600;line-height:1;letter-spacing:0;color:var(--fg);background:color-mix(in oklab,var(--fg) 7%,transparent);border:1px solid color-mix(in oklab,var(--fg) 22%,transparent);box-shadow:inset 0 -1.5px 0 color-mix(in oklab,var(--fg) 16%,transparent)}
        @media (prefers-reduced-motion: reduce){.ask-launcher-label{transition:none}}`}</style>
    </>
  );
}
