"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { KineticText } from "@/components/motion/KineticText";
import { SreeMark } from "@/components/ui/SreeMark";
import { useAskSree } from "@/components/ask/AskSreeProvider";
import { profile } from "@/content/profile";
import { Portrait } from "@/components/ui/Portrait";
import type { PortraitAsset } from "@/lib/portrait";
import { ContourEcho } from "@/components/ui/ContourEcho";
import { TiltStage } from "@/components/projects/TiltStage";

const ContourField = dynamic(() => import("./ContourField").then((m) => m.ContourField), { ssr: false });

const roles = ["AI Engineer", "Data Engineer", "Software Engineer"];

function Coordinates() {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    // Count up to Boston's coordinates (expo-out over 1.6 s, after 0.2 s).
    const start = performance.now() + 200;
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, Math.max(0, (now - start) / 1600));
      const e = t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
      el.textContent = `${(42.3601 * e).toFixed(4)}° N, ${(71.0589 * e).toFixed(4)}° W`;
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);
  return (
    <span ref={ref} className="tabular-nums">
      {profile.coordinates.lat}, {profile.coordinates.lng}
    </span>
  );
}

function RoleTicker() {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setInterval(() => setI((v) => (v + 1) % roles.length), 2600);
    return () => window.clearInterval(id);
  }, []);
  return (
    <ul className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm" aria-label="Roles">
      {roles.map((r, idx) => (
        <li key={r} className="flex items-center gap-3">
          {idx > 0 && <span className="h-1 w-1 rounded-full bg-line-strong" aria-hidden="true" />}
          <span className={`transition-colors duration-700 ${idx === i ? "text-fg" : "text-fg-muted"}`}>{r}</span>
        </li>
      ))}
    </ul>
  );
}

export function Hero({ portrait }: { portrait: PortraitAsset }) {
  const { openChat } = useAskSree();
  const [field, setField] = useState(false);

  // Start the WebGL field once the main thread is idle, after first paint —
  // and only on devices that can run it comfortably. Others keep the static
  // contour layer, which is always painted underneath.
  useEffect(() => {
    const nav = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } };
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    const lowPower =
      nav.connection?.saveData === true ||
      (nav.deviceMemory !== undefined && nav.deviceMemory < 4) ||
      (coarse && (nav.hardwareConcurrency ?? 8) <= 4);
    if (lowPower) return;
    const ric = window.requestIdleCallback ?? ((cb: () => void) => window.setTimeout(cb, 300));
    const cic = window.cancelIdleCallback ?? window.clearTimeout;
    const id = ric(() => setField(true), { timeout: 2500 } as IdleRequestOptions);
    return () => cic(id as number);
  }, []);

  return (
    <section className="relative isolate flex min-h-[100svh] flex-col overflow-hidden pt-24 md:pt-28" aria-label="Introduction">
      <div className="absolute inset-0 -z-10" aria-hidden="true">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_70%_40%,var(--accent-soft),transparent_70%)]" />
        <div className="hero-atmos absolute inset-0" />
        <ContourEcho id="echo-fade-hero" className={`absolute inset-x-0 bottom-[12%] h-[60%] w-full text-accent transition-opacity duration-1000 ${field ? "opacity-0" : "opacity-[0.18]"}`} />
        {field && <ContourField className="absolute inset-0 h-full w-full" />}
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-bg" />
      </div>

      <div className="container-x flex flex-1 flex-col justify-center pb-10" data-scroll-out>
        <div className="hero-fade flex items-end justify-between gap-3 lg:flex-wrap lg:items-center" style={{ ["--enter-delay" as string]: "0.05s" }}>
          <p className="eyebrow flex items-center gap-3">
            <span className="relative flex h-2 w-2" aria-hidden="true">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--success)] opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--success)]" />
            </span>
            Boston, MA · AI, data &amp; software
          </p>
          <p className="eyebrow mono hidden lg:block" aria-label="Boston coordinates">
            <Coordinates />
          </p>
          {/* Phones and tablets: a small editorial tile in the name row. */}
          <div className="lg:hidden">
            <Portrait asset={portrait} size="sm" priority />
          </div>
        </div>
        <div className="hero-line mt-5 h-px w-full bg-gradient-to-r from-accent via-line-strong to-transparent" aria-hidden="true" />
        <h1 className="hero-fade mt-8 text-[clamp(1.5rem,3.6vw,2.6rem)] font-medium leading-tight tracking-[-0.035em] text-fg md:mt-10" style={{ ["--enter-delay" as string]: "0.08s" }}>
          Sreevarshan Sathiyamurthy
        </h1>

        <div className="mt-4 grid items-center gap-10 md:mt-6 lg:grid-cols-[minmax(0,1fr)_clamp(220px,22vw,330px)] lg:gap-14">
          <div className="relative">
            <KineticText
              as="p"
              className="display hero-title relative z-[1] max-w-[13ch] text-[clamp(3.1rem,10.5vw,9.6rem)] lg:text-[clamp(4rem,7.4vw,8.6rem)]"
              delay={0.1}
              trigger="css"
              segments={["I build ", { text: "intelligent", className: "serif-accent text-accent-fg" }, " systems — from data to interface."]}
            />
          </div>
          <div className="hidden lg:block" data-parallax="0.18">
            <TiltStage>
              <Portrait asset={portrait} priority />
            </TiltStage>
          </div>
        </div>

        <div className="mt-10 grid gap-8 md:mt-14 md:grid-cols-[1.2fr_1fr] md:items-end">
          <div className="hero-fade max-w-xl" style={{ ["--enter-delay" as string]: "0.6s" }}>
            <p className="lede">
              I&apos;m <strong className="font-medium text-fg">Sreevarshan</strong> (Sree for short), an engineer in Boston working across AI agents, data pipelines and full-stack products. Most recently I built Snowflake Cortex AI agents and MCP integrations at RightRev.
            </p>
            <div className="mt-6">
              <RoleTicker />
            </div>
          </div>
          <div className="hero-fade flex flex-wrap gap-3 md:justify-end" style={{ ["--enter-delay" as string]: "0.7s" }}>
            <Link href="/projects" className="btn btn-primary">
              View projects <span className="arrow" aria-hidden="true">→</span>
            </Link>
            <button type="button" onClick={() => openChat()} className="btn btn-ghost group">
              <SreeMark size={22} /> Ask My AI
            </button>
            <a href={profile.resumePath} target="_blank" rel="noopener" className="btn btn-ghost">
              Resume
            </a>
          </div>
        </div>
      </div>

      <div className="container-x hero-fade pb-8">
        <dl className="grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-3">
          {[
            { k: "Recently", v: "RightRev", d: "18 AI agents migrated to production" },
            { k: "Studying", v: "Northeastern", d: "M.S. Data Analytics Engineering · 3.95" },
            { k: "Placed", v: "6th of 320+", d: "Singapore AUV Challenge" },
          ].map((f) => (
            <div key={f.k} className="bg-[color-mix(in_oklab,var(--bg)_88%,transparent)] px-5 py-4 backdrop-blur">
              <dt className="eyebrow">{f.k}</dt>
              <dd className="mt-1.5 text-lg font-medium tracking-[-0.02em]">{f.v}</dd>
              <dd className="text-sm text-fg-muted">{f.d}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
