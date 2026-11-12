"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { navLinks } from "./navLinks";
import { ThemeToggle } from "./ThemeToggle";
import { useAskSree } from "@/components/ask/AskSreeProvider";
import { SreeMark } from "@/components/ui/SreeMark";
import { profile } from "@/content/profile";
import { useFocusTrap } from "@/lib/useFocusTrap";

export function SiteNav() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [open, setOpen] = useState(false);
  const { openChat } = useAskSree();
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    let last = window.scrollY;
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const y = window.scrollY;
        setScrolled(y > 12);
        setHidden(y > 160 && y > last + 2);
        if (y < last - 2) setHidden(false);
        last = y;
        ticking = false;
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const close = useCallback(() => {
    setOpen(false);
    buttonRef.current?.focus();
  }, []);

  // Close the menu when the route changes.
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    if (open) setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, close]);

  useFocusTrap(menuRef, open);

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-[transform,background-color,border-color] duration-500 ease-[cubic-bezier(.22,1,.36,1)] ${
          hidden && !open ? "-translate-y-full" : "translate-y-0"
        } ${scrolled || open ? "border-b border-line bg-[color-mix(in_oklab,var(--bg)_78%,transparent)] backdrop-blur-xl" : "border-b border-transparent"}`}
      >
        <nav aria-label="Primary" className="container-x flex h-16 items-center justify-between gap-4 md:h-[72px]">
          <Link href="/" className="group flex items-center gap-3" aria-label="Sree — home">
            <span className="text-[1.35rem] font-semibold tracking-[-0.04em]">
              Sree<span className="text-accent">.</span>
            </span>
            <span className="eyebrow hidden translate-y-px sm:inline">AI · Data · Software</span>
          </Link>

          <ul className="hidden items-center gap-1 xl:flex">
            {navLinks.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  aria-current={isActive(l.href) ? "page" : undefined}
                  className={`relative rounded-full px-3 py-2 text-[0.88rem] transition-colors ${
                    isActive(l.href) ? "text-fg" : "text-fg-muted hover:text-fg"
                  }`}
                >
                  {l.label}
                  <span
                    aria-hidden="true"
                    className={`absolute bottom-0.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-accent transition-all duration-300 ${
                      isActive(l.href) ? "scale-100 opacity-100" : "scale-0 opacity-0"
                    }`}
                  />
                </Link>
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => openChat()}
              className="group hidden h-10 items-center gap-2 rounded-full border border-line pl-1.5 pr-4 text-sm text-fg-soft transition-colors hover:border-accent hover:text-fg sm:inline-flex"
            >
              <SreeMark size={28} />
              Ask Sree
            </button>
            <ThemeToggle />
            <button
              ref={buttonRef}
              type="button"
              className="inline-flex h-10 items-center gap-2 rounded-full border border-line px-4 text-sm text-fg-soft hover:border-accent hover:text-fg xl:hidden"
              aria-expanded={open}
              aria-controls="site-menu"
              onClick={() => setOpen((o) => !o)}
            >
              <span className="relative block h-3 w-4" aria-hidden="true">
                <span className={`absolute left-0 h-px w-4 bg-current transition-transform duration-300 ${open ? "top-1.5 rotate-45" : "top-0.5"}`} />
                <span className={`absolute left-0 h-px w-4 bg-current transition-transform duration-300 ${open ? "top-1.5 -rotate-45" : "top-2.5"}`} />
              </span>
              {open ? "Close" : "Menu"}
            </button>
          </div>
        </nav>
      </header>

      <div
        id="site-menu"
        ref={menuRef}
        role="dialog"
        aria-modal="true"
        aria-label="Site menu"
        hidden={!open}
        className="fixed inset-0 z-40 overflow-y-auto bg-bg pt-20 xl:hidden"
      >
        <div className="container-x flex min-h-[calc(100dvh-5rem)] flex-col justify-between pb-10">
          <ul className="mt-6 space-y-1">
            {[{ href: "/", label: "Home" }, ...navLinks].map((l, i) => (
              <li
                key={l.href}
                className="overflow-hidden"
                style={{ animation: open ? `menu-in 600ms ${80 + i * 45}ms cubic-bezier(.22,1,.36,1) both` : undefined }}
              >
                <Link
                  href={l.href}
                  onClick={() => setOpen(false)}
                  aria-current={pathname === l.href ? "page" : undefined}
                  className="group flex items-baseline gap-4 py-1.5 text-[clamp(2rem,9vw,3.4rem)] font-medium tracking-[-0.04em]"
                >
                  <span className="mono w-8 text-xs text-fg-muted" aria-hidden="true">{String(i).padStart(2, "0")}</span>
                  <span className={pathname === l.href ? "text-accent" : "text-fg transition-colors group-hover:text-accent"}>{l.label}</span>
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-10 flex flex-wrap items-center gap-3">
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                setOpen(false);
                openChat();
              }}
            >
              <SreeMark size={22} /> Ask Sree
            </button>
            <a className="btn btn-ghost" href={profile.resumePath} target="_blank" rel="noopener">
              Resume (PDF)
            </a>
            <a className="chip" href={profile.links.github} target="_blank" rel="noopener noreferrer">GitHub</a>
            <a className="chip" href={profile.links.linkedin} target="_blank" rel="noopener noreferrer">LinkedIn</a>
          </div>
        </div>
      </div>
      <style>{`@keyframes menu-in{from{transform:translateY(110%);opacity:0}to{transform:none;opacity:1}}`}</style>
    </>
  );
}
