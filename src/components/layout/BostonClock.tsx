"use client";

import { useEffect, useState } from "react";

/** Local time in Boston, rendered client-side only to avoid hydration mismatch. */
export function BostonClock() {
  const [now, setNow] = useState<string | null>(null);
  useEffect(() => {
    const fmt = new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", hour: "numeric", minute: "2-digit" });
    const tick = () => setNow(fmt.format(new Date()));
    tick();
    const id = window.setInterval(tick, 30_000);
    return () => window.clearInterval(id);
  }, []);
  return <span suppressHydrationWarning>{now ? `${now} in Boston` : "Boston, MA"}</span>;
}
