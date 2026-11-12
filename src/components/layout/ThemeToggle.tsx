"use client";

import { useEffect, useState } from "react";

type Theme = "light" | "dark";

function applyTheme(next: Theme) {
  const root = document.documentElement;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!reduce) root.classList.add("theme-transition");
  root.setAttribute("data-theme", next);
  root.style.colorScheme = next;
  window.dispatchEvent(new CustomEvent("themechange", { detail: next }));
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
      onClick={() => {
        applyTheme(next);
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
