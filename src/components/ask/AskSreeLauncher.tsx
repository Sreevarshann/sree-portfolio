"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { SreeMark } from "@/components/ui/SreeMark";
import { useAskSree } from "./AskSreeProvider";
import { ChatView } from "./ChatView";

/** Floating entry point + panel. Desktop: anchored popover. Mobile: full-height sheet. */
export function AskSreeLauncher() {
  const { open, openChat, closeChat, busy, launcherRef } = useAskSree();
  const pathname = usePathname();
  const panel = useRef<HTMLDivElement>(null);
  const [mobile, setMobile] = useState(false);
  const [heroScrolled, setHeroScrolled] = useState(false);
  const pastHero = pathname !== "/" || heroScrolled;

  // On the home page the hero already offers "Ask Sree"; reveal the launcher after it.
  useEffect(() => {
    if (pathname !== "/") return;
    const on = () => setHeroScrolled(window.scrollY > window.innerHeight * 0.6);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, [pathname]);

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

  if (pathname === "/ask") return null;

  return (
    <>
      <button
        ref={launcherRef}
        type="button"
        onClick={() => (open ? closeChat() : openChat())}
        aria-expanded={open}
        aria-controls="ask-sree-panel"
        tabIndex={!pastHero && !open ? -1 : undefined}
        aria-hidden={!pastHero && !open ? true : undefined}
        className={`group fixed bottom-[max(1rem,env(safe-area-inset-bottom))] right-4 z-[55] inline-flex items-center gap-2 rounded-full border border-line-strong bg-[color-mix(in_oklab,var(--bg-elev)_85%,transparent)] py-1.5 pl-1.5 pr-4 text-sm font-medium text-fg shadow-[var(--shadow)] backdrop-blur-xl transition-[transform,opacity,border-color,box-shadow] duration-500 ease-[cubic-bezier(.22,1,.36,1)] hover:border-accent hover:shadow-[var(--glow)] sm:right-6 sm:bottom-6 ${
          (open && mobile) || (!pastHero && !open) ? "pointer-events-none translate-y-4 opacity-0" : ""
        }`}
      >
        <SreeMark size={34} state={busy ? "thinking" : "idle"} />
        <span>{open ? "Close" : "Ask Sree"}</span>
        <kbd className="mono ml-1 hidden rounded border border-line px-1.5 text-[0.65rem] text-fg-muted lg:inline">/</kbd>
      </button>

      <div
        id="ask-sree-panel"
        ref={panel}
        role="dialog"
        aria-modal={mobile ? true : undefined}
        aria-label="Ask Sree, AI assistant"
        hidden={!open}
        className="fixed z-[56] flex flex-col overflow-hidden border border-line-strong bg-bg shadow-[var(--shadow)] max-sm:inset-x-0 max-sm:top-0 max-sm:h-[var(--vvh,100dvh)] max-sm:rounded-none max-sm:border-0 sm:bottom-24 sm:right-6 sm:h-[min(680px,calc(100dvh-140px))] sm:w-[420px] sm:rounded-[22px]"
        style={{ animation: open ? "ask-in 420ms cubic-bezier(.22,1,.36,1)" : undefined }}
      >
        {open && <ChatView variant="floating" onClose={closeChat} />}
      </div>
      <style>{`@keyframes ask-in{from{opacity:0;transform:translateY(16px) scale(.98)}to{opacity:1;transform:none}}`}</style>
    </>
  );
}
