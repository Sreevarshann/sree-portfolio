"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { navLinks } from "./navLinks";
import { ThemeToggle } from "./ThemeToggle";
import { useAskSree } from "@/components/ask/AskSreeProvider";
import { SreeMark } from "@/components/ui/SreeMark";
import { profile } from "@/content/profile";
import { useFocusTrap } from "@/lib/useFocusTrap";

const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

/**
 * Floating liquid-glass navigation. Expanded at the top of the page, it
 * condenses as the visitor scrolls. A single indicator glides between links
 * (following hover, resting on the current page). Below xl it becomes a
 * compact capsule whose menu unfolds from the capsule itself.
 */
export function SiteNav() {
  const pathname = usePathname();
  const [compact, setCompact] = useState(false);
  const [open, setOpen] = useState(false);
  const { openChat } = useAskSree();
  const glassRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [indicator, setIndicator] = useState<{ x: number; w: number; visible: boolean }>({ x: 0, w: 0, visible: false });
  const [hovered, setHovered] = useState<string | null>(null);

  const isActive = useCallback((href: string) => pathname === href || pathname.startsWith(href + "/"), [pathname]);

  // Condense on scroll (rAF-throttled, passive).
  useEffect(() => {
    let raf = 0;
    const on = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        setCompact(window.scrollY > 64);
      });
    };
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => {
      window.removeEventListener("scroll", on);
      cancelAnimationFrame(raf);
    };
  }, []);

  // Pointer-following specular highlight on the glass.
  useEffect(() => {
    const el = glassRef.current;
    if (!el || !window.matchMedia("(hover: hover)").matches) return;
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      el.style.setProperty("--gx", `${((e.clientX - r.left) / r.width) * 100}%`);
      el.style.setProperty("--gy", `${((e.clientY - r.top) / r.height) * 100}%`);
    };
    el.addEventListener("pointermove", move);
    return () => el.removeEventListener("pointermove", move);
  }, []);

  // Measure the indicator target: hovered link, else the active one.
  const measure = useCallback(() => {
    const list = listRef.current;
    if (!list) return;
    const target =
      (hovered && list.querySelector<HTMLElement>(`[data-href="${hovered}"]`)) ||
      Array.from(list.querySelectorAll<HTMLElement>("[data-href]")).find((a) => isActive(a.dataset.href!));
    if (!target) return setIndicator((s) => ({ ...s, visible: false }));
    setIndicator({ x: target.offsetLeft, w: target.offsetWidth, visible: true });
  }, [hovered, isActive]);
  useIsoLayoutEffect(() => {
    measure();
  }, [measure, compact]);
  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const ro = new ResizeObserver(() => measure());
    ro.observe(list);
    return () => ro.disconnect();
  }, [measure]);

  const close = useCallback((restoreFocus = true) => {
    setOpen(false);
    if (restoreFocus) buttonRef.current?.focus();
  }, []);

  // Close the menu on navigation.
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    if (open) setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    const onDown = (e: PointerEvent) => {
      const t = e.target as Node;
      if (!menuRef.current?.contains(t) && !glassRef.current?.contains(t)) close(false);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onDown);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onDown);
    };
  }, [open, close]);

  useFocusTrap(menuRef, open);

  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-50 flex justify-center px-3 pt-[max(0.75rem,env(safe-area-inset-top))] sm:px-4 md:pt-4">
      <div
        ref={glassRef}
        data-dense={compact || open}
        className={`glass pointer-events-auto relative flex w-full items-center justify-between gap-2 rounded-full transition-[max-width,height,padding] duration-700 ease-[var(--ease-spring)] ${
          compact ? "h-[52px] max-w-[1080px] px-2" : "h-[60px] max-w-[1240px] px-3"
        }`}
      >
        <Link href="/" className="group flex shrink-0 items-center gap-2.5 rounded-full py-1 pl-2 pr-3" aria-label="Sree — home">
          <span className={`font-semibold tracking-[-0.04em] transition-[font-size] duration-500 ${compact ? "text-[1.15rem]" : "text-[1.3rem]"}`}>
            Sree<span className="text-accent transition-colors group-hover:text-accent-fg">.</span>
          </span>
          <span className={`eyebrow hidden transition-opacity duration-500 2xl:inline ${compact ? "opacity-0" : "opacity-100"}`}>AI · Data · Software</span>
        </Link>

        <nav aria-label="Primary" className="relative hidden xl:block">
          <ul ref={listRef} className="relative flex items-center" onMouseLeave={() => setHovered(null)}>
            <span
              aria-hidden="true"
              className="nav-indicator pointer-events-none absolute top-1/2 h-9 rounded-full"
              style={{
                width: indicator.w,
                transform: `translate3d(${indicator.x}px, -50%, 0)`,
                opacity: indicator.visible ? 1 : 0,
              }}
            />
            {navLinks.map((l) => {
              const active = isActive(l.href);
              return (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    data-href={l.href}
                    aria-current={active ? "page" : undefined}
                    onMouseEnter={() => setHovered(l.href)}
                    onFocus={() => setHovered(l.href)}
                    onBlur={() => setHovered(null)}
                    className={`relative z-[1] block rounded-full px-3.5 py-2 text-[0.86rem] transition-colors duration-300 ${
                      active ? "text-fg" : "text-fg-muted hover:text-fg"
                    }`}
                  >
                    {l.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="flex shrink-0 items-center gap-1.5">
          <button
            type="button"
            onClick={() => openChat()}
            className="ai-pill group inline-flex h-10 items-center gap-2 rounded-full pl-1.5 pr-3 text-sm font-medium text-fg sm:pr-4"
            aria-label="Ask My AI — open Sree AI"
          >
            <SreeMark size={28} />
            <span className="hidden sm:inline">Ask My AI</span>
          </button>
          <ThemeToggle className="!border-transparent hover:!border-line" />
          <button
            ref={buttonRef}
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full text-fg-soft transition-colors hover:bg-[var(--glass-lo)] hover:text-fg xl:hidden"
            aria-expanded={open}
            aria-controls="site-menu"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((o) => !o)}
          >
            <span className="relative block h-3 w-4" aria-hidden="true">
              <span className={`absolute left-0 h-[1.5px] w-4 rounded bg-current transition-transform duration-500 ease-[var(--ease-spring)] ${open ? "top-1.5 rotate-45" : "top-0.5"}`} />
              <span className={`absolute left-0 h-[1.5px] w-4 rounded bg-current transition-transform duration-500 ease-[var(--ease-spring)] ${open ? "top-1.5 -rotate-45" : "top-2.5"}`} />
            </span>
          </button>
        </div>
      </div>

      {/* Compact menu: unfolds from the capsule. */}
      <div
        id="site-menu"
        ref={menuRef}
        role="dialog"
        aria-modal="true"
        aria-label="Site menu"
        hidden={!open}
        className="glass pointer-events-auto absolute left-3 right-3 top-[calc(max(0.75rem,env(safe-area-inset-top))+64px)] mx-auto max-h-[calc(100dvh-6rem)] max-w-md overflow-y-auto rounded-[28px] p-3 sm:left-auto sm:right-4 sm:w-[380px] md:top-[84px] xl:hidden"
        data-dense="true"
        style={{ animation: open ? "menu-unfold 520ms var(--ease-spring) both" : undefined }}
      >
        <nav aria-label="Site">
          <ul className="grid grid-cols-2 gap-1">
            {[{ href: "/", label: "Home" }, ...navLinks].map((l, i) => {
              const active = l.href === "/" ? pathname === "/" : isActive(l.href);
              return (
                <li key={l.href} style={{ animation: open ? `menu-item 520ms ${60 + i * 28}ms var(--ease-out) both` : undefined }}>
                  <Link
                    href={l.href}
                    onClick={() => setOpen(false)}
                    aria-current={active ? "page" : undefined}
                    className={`flex min-h-12 items-center rounded-2xl px-4 text-[1.02rem] transition-colors ${
                      active ? "bg-accent-soft text-fg" : "text-fg-soft hover:bg-[var(--glass-lo)] hover:text-fg"
                    }`}
                  >
                    {l.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        <div className="mt-3 grid gap-2 border-t border-line pt-3">
          <button
            type="button"
            className="btn btn-primary w-full"
            onClick={() => {
              setOpen(false);
              openChat();
            }}
          >
            <SreeMark size={22} /> Ask My AI
          </button>
          <div className="flex flex-wrap items-center justify-between gap-2 px-1">
            <a className="link-u text-sm text-fg-soft" href={profile.resumePath} target="_blank" rel="noopener">Resume (PDF)</a>
            <span className="flex gap-3 text-sm">
              <a className="link-u text-fg-soft" href={profile.links.github} target="_blank" rel="noopener noreferrer">GitHub</a>
              <a className="link-u text-fg-soft" href={profile.links.linkedin} target="_blank" rel="noopener noreferrer">LinkedIn</a>
            </span>
          </div>
        </div>
      </div>
      <style>{`
        @keyframes menu-unfold{from{opacity:0;transform:translateY(-10px) scale(.96);transform-origin:top right}to{opacity:1;transform:none}}
        @keyframes menu-item{from{opacity:0;transform:translateY(6px)}}
        .nav-indicator{
          left:0;background:var(--accent-soft);
          box-shadow: inset 0 1px 0 rgb(255 255 255 / .12), inset 0 0 0 1px rgb(120 170 255 / .18);
          transition: transform 560ms var(--ease-spring), width 560ms var(--ease-spring), opacity 300ms var(--ease-out);
        }
        .ai-pill{background:linear-gradient(135deg,rgb(79 143 255/.18),rgb(79 143 255/.04));box-shadow:inset 0 0 0 1px rgb(120 170 255/.28),inset 0 1px 0 rgb(255 255 255/.12);transition:box-shadow .4s var(--ease-out),transform .4s var(--ease-spring)}
        .ai-pill:hover{box-shadow:inset 0 0 0 1px rgb(120 170 255/.6),0 6px 22px -8px rgb(47 116 255/.6);transform:translateY(-1px)}
        .ai-pill:active{transform:scale(.97)}
        @media (prefers-reduced-motion: reduce){.nav-indicator{transition:none}}
      `}</style>
    </header>
  );
}
