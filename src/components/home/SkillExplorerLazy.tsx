"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

const SkillExplorer = dynamic(() => import("./SkillExplorer").then((m) => m.SkillExplorer), {
  ssr: false,
  loading: () => <p className="skill-loading" role="status">Loading skills…</p>,
});

/**
 * The Skill Explorer (and its catalog) sits inside a closed panel, so it is
 * not part of the homepage's first load: it mounts when the browser is idle,
 * when the visitor reaches for the "Explore My Stack" pill, or at once for a
 * /?stack= deep link.
 */
export function SkillExplorerLazy() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const go = () => setReady(true);
    const details = document.getElementById("explore-stack");
    if (new URLSearchParams(window.location.search).has("stack") || (details as HTMLDetailsElement | null)?.open) {
      go();
      return;
    }
    const ric = window.requestIdleCallback ?? ((cb: () => void) => window.setTimeout(cb, 2000));
    const id = ric(go, { timeout: 4000 } as IdleRequestOptions);
    const summary = details?.querySelector("summary");
    const opts = { once: true, passive: true } as const;
    summary?.addEventListener("pointerenter", go, opts);
    summary?.addEventListener("focus", go, opts);
    details?.addEventListener("toggle", go, opts);
    return () => {
      (window.cancelIdleCallback ?? window.clearTimeout)(id as number);
      summary?.removeEventListener("pointerenter", go);
      summary?.removeEventListener("focus", go);
      details?.removeEventListener("toggle", go);
    };
  }, []);
  return ready ? <SkillExplorer /> : <p className="skill-loading">Loading skills…</p>;
}
