"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { ThemeToggle } from "./ThemeToggle";
import { ViewSwitch } from "./ViewSwitch";
import dynamic from "next/dynamic";
import { MORE_KEYS, MORE_NAV, PRIMARY_NAV, type NavKey } from "@/lib/nav";
import { useActiveNav } from "@/lib/useActiveNav";

// Neither the coach mark nor Floating UI is needed for first paint: load them on demand.
const ViewCoachMark = dynamic(() => import("./ViewCoachMark").then((m) => m.ViewCoachMark), { ssr: false });
const COACH_BODY_ID = "view-coach-body";
import { useAskSree } from "@/components/ask/AskSreeProvider";
import { SreeMark } from "@/components/ui/SreeMark";
import { Monogram } from "@/components/ui/Monogram";
import { profile } from "@/content/profile";
import { useFocusTrap } from "@/lib/useFocusTrap";

const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

/**
 * Floating liquid-glass navigation. Expanded at the top of the page, it
 * condenses as the visitor scrolls. A single indicator glides between links
 * (following hover, resting on the current page). Below xl it becomes a
 * compact capsule whose menu unfolds from the capsule itself.
 */
type IslandState = "expanded" | "compact";

/** Pixels of scroll before the island condenses (and the hysteresis band before it re-expands). */
const COMPACT_AT = 64;
const EXPAND_AT = 24;

export function SiteNav() {
  const pathname = usePathname();
  const [state, setState] = useState<IslandState>("expanded");
  const compact = state === "compact";
  const [open, setOpen] = useState(false);
  // Width (px) at which the links stopped fitting; null while they fit.
  const [overflowAt, setOverflowAt] = useState<number | null>(null);
  const { openChat } = useAskSree();
  const glassRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const navRef = useRef<HTMLElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [indicator, setIndicator] = useState<{ x: number; w: number; visible: boolean }>({ x: 0, w: 0, visible: false });
  const [hovered, setHovered] = useState<string | null>(null);

  // One registry decides what is active: the route's owner, or on the homepage
  // the owner of the section being read.
  const activeKey = useActiveNav(pathname);
  const isHome = pathname === "/";
  const isActive = useCallback((key: NavKey) => key === activeKey, [activeKey]);
  const moreActive = activeKey !== null && MORE_KEYS.has(activeKey);
  const [moreOpen, setMoreOpen] = useState(false);
  const [coachOpen, setCoachOpen] = useState(false);
  const moreBtnRef = useRef<HTMLButtonElement>(null);
  const morePanelRef = useRef<HTMLDivElement>(null);

  // State machine: expanded at the top, compact once scrolled (with hysteresis so
  // small scroll jitter or rapid direction changes never flicker between states).
  useEffect(() => {
    let raf = 0;
    const on = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const y = window.scrollY;
        setState((s) => (s === "expanded" && y > COMPACT_AT ? "compact" : s === "compact" && y < EXPAND_AT ? "expanded" : s));
      });
    };
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => {
      window.removeEventListener("scroll", on);
      cancelAnimationFrame(raf);
    };
  }, []);

  /*
   * Island geometry. The capsule is sized by its content (width: max-content)
   * and capped at the viewport. Its min-width animates between two measured
   * targets — the full bar and the exact compact content width — so it lands
   * precisely without overflowing. If the links ever need more room than the
   * viewport allows (long translations, browser zoom), the island switches to
   * its menu layout instead of overflowing.
   */
  const measure = useCallback(() => {
    const glass = glassRef.current;
    const list = listRef.current;
    const nav = navRef.current;
    if (!glass || !list || !nav) return;
    const linksShown = getComputedStyle(nav).display !== "none";
    if (linksShown) {
      const cs = getComputedStyle(glass);
      // Compact chrome: 6px side padding (see .island[data-island="compact"]) plus borders.
      const chrome = 12 + parseFloat(cs.borderLeftWidth) * 2;
      // Compact = monogram + link list + icon-only actions, measured from the DOM.
      const part = (name: string) => glass.querySelector<HTMLElement>(`[data-island-part="${name}"]`)!;
      const pad = (el: HTMLElement) => {
        const c = getComputedStyle(el);
        return parseFloat(c.paddingLeft) + parseFloat(c.paddingRight);
      };
      const brand = part("brand");
      const actions = part("actions");
      const mono = brand.querySelector<HTMLElement>(".ss-mark")!;
      const ai = actions.querySelector<HTMLElement>(".ai-pill")!;
      const toggle = actions.querySelector<HTMLElement>("[aria-label^='Switch to']")!;
      const view = actions.querySelector<HTMLElement>("[data-island-part='view']");
      const actionGap = parseFloat(getComputedStyle(actions).columnGap || "0");
      const compactParts =
        mono.getBoundingClientRect().width + pad(brand) +
        list.getBoundingClientRect().width +
        (view ? view.getBoundingClientRect().width + actionGap : 0) +
        ai.getBoundingClientRect().height + actionGap + toggle.getBoundingClientRect().width;
      // Compact gap is 4px between the three parts.
      const gaps = 4 * 2;
      glass.style.setProperty("--island-compact", `${Math.ceil(compactParts + gaps + chrome + 2)}px`);
      if (glass.scrollWidth > glass.clientWidth + 1) setOverflowAt(window.innerWidth);
    } else if (overflowAt !== null && window.innerWidth > overflowAt + 48) {
      setOverflowAt(null);
    }
  }, [overflowAt]);

  useIsoLayoutEffect(() => {
    measure();
  }, [measure, state]);
  useEffect(() => {
    const glass = glassRef.current;
    if (!glass) return;
    const ro = new ResizeObserver(() => measure());
    ro.observe(glass);
    if (listRef.current) ro.observe(listRef.current);
    window.addEventListener("resize", measure);
    document.fonts?.ready.then(measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [measure]);

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
  const measureIndicator = useCallback(() => {
    const list = listRef.current;
    if (!list) return;
    const target =
      (hovered && list.querySelector<HTMLElement>(`[data-key="${hovered}"]`)) ||
      Array.from(list.querySelectorAll<HTMLElement>("[data-key]")).find((a) => (a.dataset.key === "more" ? moreActive : isActive(a.dataset.key as NavKey)));
    if (!target) return setIndicator((s) => ({ ...s, visible: false }));
    setIndicator({ x: target.offsetLeft, w: target.offsetWidth, visible: true });
  }, [hovered, isActive, moreActive]);
  useIsoLayoutEffect(() => {
    measureIndicator();
  }, [measureIndicator, state]);
  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const ro = new ResizeObserver(() => measureIndicator());
    ro.observe(list);
    return () => ro.disconnect();
  }, [measureIndicator]);

  const close = useCallback((restoreFocus = true) => {
    setOpen(false);
    if (restoreFocus) buttonRef.current?.focus();
  }, []);

  // Close the menu on navigation.
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    if (open) setOpen(false);
    if (moreOpen) setMoreOpen(false);
  }

  // "More" dropdown: anchored to its button with Floating UI, closes on Escape,
  // outside press or navigation; focus returns to the button on Escape.
  useEffect(() => {
    if (!moreOpen) return;
    const btn = moreBtnRef.current;
    const panel = morePanelRef.current;
    if (!btn || !panel) return;
    let stop = () => {};
    let cancelled = false;
    void import("@floating-ui/dom").then(({ autoUpdate, computePosition, flip, offset, shift }) => {
      if (cancelled) return;
      stop = autoUpdate(btn, panel, () => {
        computePosition(btn, panel, { placement: "bottom-end", strategy: "fixed", middleware: [offset(14), flip(), shift({ padding: 12 })] }).then(({ x, y }) => {
          Object.assign(panel.style, { left: `${x}px`, top: `${y}px` });
        });
      });
    });
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMoreOpen(false);
        btn.focus();
      }
    };
    const onDown = (e: PointerEvent) => {
      const t = e.target as Node;
      if (!panel.contains(t) && !btn.contains(t)) setMoreOpen(false);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onDown);
    return () => {
      cancelled = true;
      stop();
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onDown);
    };
  }, [moreOpen]);

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

  const menuMode = overflowAt !== null;

  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-50 flex justify-center px-3 pt-[max(0.75rem,env(safe-area-inset-top))] sm:px-4 md:pt-4">
      <div
        ref={glassRef}
        data-island={state}
        data-menu-mode={menuMode || undefined}
        data-dense={compact || open}
        className="island glass pointer-events-auto relative flex items-center"
      >
        <Link
          href="/"
          data-island-part="brand"
          data-active={activeKey === "home" || undefined}
          aria-current={isHome && activeKey === "home" ? "page" : undefined}
          className="island-brand group flex shrink-0 items-center rounded-full"
          aria-label="Sreevarshan Sathiyamurthy — Home"
        >
          <Monogram size={40} className="island-mono" />
          <span className="collapse-x island-name" aria-hidden="true">
            <span><span className="eyebrow block whitespace-nowrap pl-3 pr-2 text-fg-soft">Sreevarshan Sathiyamurthy</span></span>
          </span>
        </Link>

        <nav ref={navRef} aria-label="Primary" data-island-part="links" className="island-links relative min-w-0 flex-1 justify-center">
          <ul ref={listRef} className="relative flex w-max items-center" onMouseLeave={() => setHovered(null)}>
            <span
              aria-hidden="true"
              className="nav-indicator pointer-events-none absolute top-1/2 h-9 rounded-full"
              style={{
                width: indicator.w,
                transform: `translate3d(${indicator.x}px, -50%, 0)`,
                opacity: indicator.visible ? 1 : 0,
              }}
            />
            {PRIMARY_NAV.map((l) => {
              const active = isActive(l.key);
              return (
                <li key={l.key}>
                  <Link
                    href={l.href}
                    data-key={l.key}
                    // A route match is the current page; a homepage section match is the current location.
                    aria-current={active ? (isHome ? "location" : "page") : undefined}
                    onMouseEnter={() => setHovered(l.key)}
                    onFocus={() => setHovered(l.key)}
                    onBlur={() => setHovered(null)}
                    className={`relative z-[1] block whitespace-nowrap rounded-full px-3.5 py-2 text-[0.86rem] transition-colors duration-300 ${
                      active ? "text-fg" : "text-fg-muted hover:text-fg"
                    }`}
                  >
                    {l.label}
                  </Link>
                </li>
              );
            })}
            <li>
              <button
                ref={moreBtnRef}
                type="button"
                data-key="more"
                aria-expanded={moreOpen}
                aria-controls="more-menu"
                aria-current={moreActive ? "true" : undefined}
                onClick={() => setMoreOpen((o) => !o)}
                onMouseEnter={() => setHovered("more" as NavKey)}
                onFocus={() => setHovered("more" as NavKey)}
                onBlur={() => setHovered(null)}
                className={`relative z-[1] flex items-center gap-1 whitespace-nowrap rounded-full px-3.5 py-2 text-[0.86rem] transition-colors duration-300 ${
                  moreActive || moreOpen ? "text-fg" : "text-fg-muted hover:text-fg"
                }`}
              >
                More
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true" className={`transition-transform duration-300 ${moreOpen ? "rotate-180" : ""}`}>
                  <path d="M2 3.5 5 6.5 8 3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </li>
          </ul>
        </nav>

        <div data-island-part="actions" className="island-actions flex shrink-0 items-center gap-1.5">
          {isHome && <ViewSwitch describedBy={coachOpen ? COACH_BODY_ID : undefined} />}
          <button
            type="button"
            onClick={() => openChat()}
            className="ai-pill group inline-flex h-10 shrink-0 items-center rounded-full pl-1.5 text-sm font-medium text-fg"
            aria-label="Ask My AI — open Sree AI"
          >
            <SreeMark size={28} />
            <span className="collapse-x ai-label" aria-hidden="true">
              <span><span className="block whitespace-nowrap pl-2">Ask My AI</span></span>
            </span>
          </button>
          <ThemeToggle className="island-btn shrink-0 !border-transparent hover:!border-line" />
          <button
            ref={buttonRef}
            type="button"
            className="island-btn island-menu-btn h-10 w-10 shrink-0 items-center justify-center rounded-full text-fg-soft transition-colors hover:bg-[var(--glass-lo)] hover:text-fg"
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

      {isHome && <ViewCoachMark suspended={open || moreOpen} onOpenChange={setCoachOpen} />}

      {/* Desktop "More" dropdown. */}
      <div
        id="more-menu"
        ref={morePanelRef}
        hidden={!moreOpen}
        className="more-panel glass pointer-events-auto fixed z-50 w-[248px] rounded-[22px] p-2"
        data-dense="true"
      >
        <nav aria-label="More">
          <ul className="grid gap-0.5">
            {MORE_NAV.map((l) => {
              const external = "external" in l;
              const active = !external && isActive(l.key as NavKey);
              return (
                <li key={l.key}>
                  {external ? (
                    <a href={l.href} target="_blank" rel="noopener noreferrer" className="more-item" onClick={() => setMoreOpen(false)}>
                      <span className="flex items-center gap-2.5">
                        {/* eslint-disable-next-line @next/next/no-img-element -- 1 KB static brand SVG */}
                        <img src="/tech/tableau.svg" alt="" width={16} height={16} className="h-4 w-4" />
                        {l.label}
                      </span>
                      <span aria-hidden="true" className="text-fg-muted">↗</span>
                      <span className="sr-only"> (opens in a new tab)</span>
                    </a>
                  ) : (
                    <Link href={l.href} className="more-item" data-active={active || undefined} aria-current={active ? (isHome ? "location" : "page") : undefined} onClick={() => setMoreOpen(false)}>
                      {l.label}
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>
      </div>

      {/* Compact menu: unfolds from the capsule. */}
      <div
        id="site-menu"
        ref={menuRef}
        role="dialog"
        aria-modal="true"
        aria-label="Site menu"
        hidden={!open}
        className={`glass pointer-events-auto absolute left-3 right-3 top-[calc(max(0.75rem,env(safe-area-inset-top))+64px)] mx-auto max-h-[calc(100dvh-6rem)] max-w-md overflow-y-auto rounded-[28px] p-3 sm:left-auto sm:right-4 sm:w-[380px] md:top-[84px] ${menuMode ? "" : "xl:hidden"}`}
        data-dense="true"
        style={{ animation: open ? "menu-unfold 520ms var(--ease-spring) both" : undefined }}
      >
        <nav aria-label="Site">
          <ul className="grid grid-cols-2 gap-1">
            {[{ key: "home" as NavKey, href: "/", label: "Home" }, ...PRIMARY_NAV, ...MORE_NAV].map((l, i) => {
              const external = "external" in l;
              const active = !external && isActive(l.key as NavKey);
              const cls = `flex min-h-12 items-center justify-between rounded-2xl px-4 text-[1.02rem] transition-colors ${
                active ? "bg-accent-soft text-fg" : "text-fg-soft hover:bg-[var(--glass-lo)] hover:text-fg"
              }`;
              return (
                <li key={l.key} style={{ animation: open ? `menu-item 520ms ${60 + i * 28}ms var(--ease-out) both` : undefined }}>
                  {external ? (
                    <a href={l.href} target="_blank" rel="noopener noreferrer" onClick={() => setOpen(false)} className={cls}>
                      {l.label}
                      <span aria-hidden="true" className="text-fg-muted">↗</span>
                      <span className="sr-only"> (opens in a new tab)</span>
                    </a>
                  ) : (
                    <Link href={l.href} onClick={() => setOpen(false)} aria-current={active ? (isHome ? "location" : "page") : undefined} className={cls}>
                      {l.label}
                    </Link>
                  )}
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
        .ai-pill{background:linear-gradient(135deg,rgb(79 143 255/.18),rgb(79 143 255/.04));box-shadow:inset 0 0 0 1px rgb(120 170 255/.28),inset 0 1px 0 rgb(255 255 255/.12)}
        .ai-pill:hover{box-shadow:inset 0 0 0 1px rgb(120 170 255/.6),0 6px 22px -8px rgb(47 116 255/.6);transform:translateY(-1px)}
        .ai-pill:active{transform:scale(.97)}
        @media (prefers-reduced-motion: reduce){.nav-indicator{transition:none}}
      `}</style>
    </header>
  );
}
