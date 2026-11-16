"use client";

import { useEffect, useState } from "react";

type Theme = "light" | "dark";

type Doc = Document & {
  startViewTransition?: (cb: () => void) => { finished: Promise<void>; skipTransition?: () => void };
};

/**
 * Switching themes from the toggle reveals the new theme as a circle that
 * grows from the button (View Transitions API), like a light being turned on
 * or off. Without the API, under reduced motion, or for OS-driven changes,
 * colors cross-fade briefly (or change instantly under reduced motion).
 */
function applyTheme(next: Theme, origin?: { x: number; y: number }) {
  const root = document.documentElement;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let committed = false;
  const commit = () => {
    committed = true;
    root.setAttribute("data-theme", next);
    root.style.colorScheme = next;
    window.dispatchEvent(new CustomEvent("themechange", { detail: next }));
  };
  const doc = document as Doc;
  if (!reduce && origin && doc.startViewTransition) {
    const r = Math.hypot(Math.max(origin.x, innerWidth - origin.x), Math.max(origin.y, innerHeight - origin.y));
    root.style.setProperty("--vt-x", `${origin.x}px`);
    root.style.setProperty("--vt-y", `${origin.y}px`);
    root.style.setProperty("--vt-r", `${Math.ceil(r)}px`);
    root.classList.add("theme-vt");
    try {
      const vt = doc.startViewTransition(commit);
      vt.finished.catch(() => {}).finally(() => root.classList.remove("theme-vt"));
      // The theme must never wait on the animation: if the browser hasn't run
      // the update (a throttled or background page), skip it and switch now.
      window.setTimeout(() => {
        if (committed) return;
        vt.skipTransition?.();
        if (!committed) commit();
        root.classList.remove("theme-vt");
      }, 300);
    } catch {
      root.classList.remove("theme-vt");
      commit();
    }
    return;
  }
  if (!reduce) root.classList.add("theme-transition");
  commit();
  if (!reduce) window.setTimeout(() => root.classList.remove("theme-transition"), 460);
}

export function useTheme(): Theme {
  const [theme, setTheme] = useState<Theme>("dark");
  useEffect(() => {
    const read = () => setTheme((document.documentElement.getAttribute("data-theme") as Theme) ?? "dark");
    read();
    const obs = new MutationObserver(read);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => obs.disconnect();
  }, []);
  return theme;
}

export function ThemeToggle({ className = "" }: { className?: string }) {
  const theme = useTheme();

  // Follow OS changes only while the visitor hasn't chosen explicitly.
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: light)");
    const onChange = () => {
      let stored: string | null = null;
      try {
        stored = localStorage.getItem("theme");
      } catch {}
      if (!stored) applyTheme(mq.matches ? "light" : "dark");
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const next: Theme = theme === "dark" ? "light" : "dark";
  return (
    <button
      type="button"
      onClick={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        applyTheme(next, { x: r.left + r.width / 2, y: r.top + r.height / 2 });
        try {
          localStorage.setItem("theme", next);
        } catch {}
      }}
      className={`group relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-line text-fg-soft transition-colors hover:border-accent hover:text-fg ${className}`}
      aria-label={`Switch to ${next} theme`}
      title={`Switch to ${next} theme`}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" className="overflow-visible">
        <g
          className="origin-center transition-transform duration-700 ease-[cubic-bezier(.22,1,.36,1)]"
          style={{ transform: theme === "dark" ? "rotate(0deg)" : "rotate(180deg)" }}
        >
          <circle cx="12" cy="12" r="5" fill="none" stroke="currentColor" strokeWidth="1.6" />
          <path d="M12 7a5 5 0 0 1 0 10z" fill="currentColor" />
          {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
            <line
              key={a}
              x1="12"
              y1="1.8"
              x2="12"
              y2="3.6"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              transform={`rotate(${a} 12 12)`}
              className="transition-opacity duration-500"
              style={{ opacity: theme === "dark" ? 0.35 : 1 }}
            />
          ))}
        </g>
      </svg>
    </button>
  );
}
