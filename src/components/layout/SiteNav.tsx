"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { ThemeToggle } from "./ThemeToggle";
import { NAV, type NavKey } from "@/lib/nav";
import { useActiveNav } from "@/lib/useActiveNav";
import { Monogram } from "@/components/ui/Monogram";
import { profile } from "@/content/profile";
import { useFocusTrap } from "@/lib/useFocusTrap";

const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

/**
 * Floating liquid-glass navigation. Expanded at the top of the page, it
 * condenses as the visitor scrolls. A single indicator glides between links
 * (following hover, resting on the current section or page). The eight
 * items follow the homepage's section order. Below xl, or whenever they do
 * not fit, it becomes a compact capsule whose labelled menu unfolds from the
 * capsule itself and lists the same items in the same order.
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
   * targets - the full bar and the exact compact content width - so it lands
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
      // Compact = monogram + link list + the theme toggle, measured from the
      // DOM. Ask My AI lives in the floating launcher, not here.
      const part = (name: string) => glass.querySelector<HTMLElement>(`[data-island-part="${name}"]`)!;
      const pad = (el: HTMLElement) => {
        const c = getComputedStyle(el);
        return parseFloat(c.paddingLeft) + parseFloat(c.paddingRight);
      };
      const brand = part("brand");
      const actions = part("actions");
      const mono = brand.querySelector<HTMLElement>(".ss-mark")!;
      const toggle = actions.querySelector<HTMLElement>("[aria-label^='Switch to']")!;
      const compactParts =
        mono.getBoundingClientRect().width + pad(brand) +
        list.getBoundingClientRect().width +
        toggle.getBoundingClientRect().width;
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
      Array.from(list.querySelectorAll<HTMLElement>("[data-key]")).find((a) => isActive(a.dataset.key as NavKey));
    if (!target) return setIndicator((s) => ({ ...s, visible: false }));
    setIndicator({ x: target.offsetLeft, w: target.offsetWidth, visible: true });
  }, [hovered, isActive]);
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
          aria-current={isHome ? "page" : undefined}
          className="island-brand group flex shrink-0 items-center rounded-full"
          aria-label="Sreevarshan Sathiyamurthy - Home"
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
            {NAV.map((l) => {
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
          </ul>
        </nav>

        <div data-island-part="actions" className="island-actions flex shrink-0 items-center gap-1.5">
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
            {NAV.map((l, i) => {
              const active = isActive(l.key);
              const cls = `flex min-h-12 items-center justify-between rounded-2xl px-4 text-[1.02rem] transition-colors ${
                active ? "bg-accent-soft text-fg" : "text-fg-soft hover:bg-[var(--glass-lo)] hover:text-fg"
              }`;
              return (
                <li key={l.key} style={{ animation: open ? `menu-item 520ms ${60 + i * 28}ms var(--ease-out) both` : undefined }}>
                  <Link href={l.href} onClick={() => setOpen(false)} aria-current={active ? (isHome ? "location" : "page") : undefined} className={cls}>
                    {l.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        <div className="mt-3 grid gap-2 border-t border-line pt-3">
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
        @media (prefers-reduced-motion: reduce){.nav-indicator{transition:none}}
      `}</style>
    </header>
  );
}
