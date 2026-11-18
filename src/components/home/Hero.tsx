"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { KineticText } from "@/components/motion/KineticText";
import { profile } from "@/content/profile";
import type { PortraitPair } from "@/lib/portrait";
import { ContourEcho } from "@/components/ui/ContourEcho";
import { LogoImage } from "@/components/ui/LogoImage";
import { experience } from "@/content/experience";
import { FROM, TO } from "@/lib/identityMorph";
import { PortraitSwap } from "./PortraitSwap";
import { useIdentityIntro } from "./useIdentityIntro";

const ContourField = dynamic(() => import("./ContourField").then((m) => m.ContourField), { ssr: false });

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

/** Small green status: understated breathing ring, static under reduced motion. */
function Availability() {
  return (
    <p className="availability">
      <span className="availability-dot" aria-hidden="true" />
      <span>{profile.availability}</span>
    </p>
  );
}

/** Logo heights tuned by eye so the three marks carry similar visual weight. */
const COMPANY_HEIGHT: Record<string, number> = { rightrev: 22, "flare-innovation": 42, "sri-sairam-techno-incubator": 46 };

function Companies() {
  return (
    <div className="hero-companies">
      <p className="eyebrow">Experience</p>
      <ul className="mt-4 flex flex-wrap items-center gap-x-8 gap-y-4">
        {experience.map((e, i) => (
          <li key={e.slug} className="company-mark" style={{ ["--i" as string]: i }}>
            <Link href={`/experience#${e.slug}`} className="company-link" aria-label={`${e.company}: ${e.role}`} title={`${e.role} · ${e.period}`}>
              {e.logo ? (
                <>
                  <LogoImage variant="light" src={e.logo.light} alt="" width={e.logo.width} height={e.logo.height} fallback={e.company} className="w-auto" style={{ height: COMPANY_HEIGHT[e.slug] ?? 28 }} />
                  <LogoImage variant="dark" src={e.logo.dark} alt="" width={e.logo.width} height={e.logo.height} fallback={e.company} className="w-auto" style={{ height: COMPANY_HEIGHT[e.slug] ?? 28 }} />
                </>
              ) : (
                <span className="text-sm font-semibold">{e.company}</span>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Hero({ portraits }: { portraits: PortraitPair }) {
  const [field, setField] = useState(false);
  const rootRef = useRef<HTMLElement>(null);
  const nameRef = useRef<HTMLSpanElement>(null);
  const { phase, skip } = useIdentityIntro(rootRef, nameRef);
  const intro = phase === "hold" ? "pending" : phase === "morph" ? "running" : "done";

  // Start the WebGL field once the main thread is idle, after first paint -
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
    <section ref={rootRef} className="relative isolate flex min-h-[100svh] flex-col overflow-hidden pt-[5.25rem] md:pt-28" aria-label="Introduction" data-nav-section="hero" data-view-anchor="hero">
      <div className="absolute inset-0 -z-10" aria-hidden="true">
        <div className="hero-wash absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_70%_40%,var(--accent-soft),transparent_70%)]" />
        <div className="hero-atmos absolute inset-0" />
        <ContourEcho id="echo-fade-hero" className={`absolute inset-x-0 bottom-[12%] h-[60%] w-full text-accent transition-opacity duration-1000 ${field ? "opacity-0" : "opacity-[0.18]"}`} />
        {field && <ContourField className="absolute inset-0 h-full w-full" />}
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-bg" />
      </div>

      <div className="container-x flex flex-1 flex-col justify-center pb-12" data-scroll-out>
        <div className="hero-fade flex items-center justify-between gap-3" style={{ ["--enter-delay" as string]: "0.05s" }}>
          <Availability />
          <p className="eyebrow mono hidden lg:block" aria-label="Boston coordinates">
            <Coordinates />
          </p>
        </div>

        {/* Two parts. The identity row: the introduction on the left and the
            original portrait on the right, vertically centred on each other.
            Below both, centred across the hero: the statement and the actions.
            Portrait first in the markup: phones and tablets show it above the
            introduction (same visual, reading and focus order). */}
        <div className="hero-stage" data-intro={intro}>
          {/* The gentle scroll parallax moves the name and the portrait as one
              group, so they stay aligned with each other. */}
          <div className="hero-identity" data-parallax="0.06" data-parallax-min="1024">
            <div className="hero-portrait hero-fade" style={{ ["--enter-delay" as string]: "0.2s" }}>
              <PortraitSwap pair={portraits} priority intro={intro} onSkip={skip} />
            </div>
            <div className="hero-intro">
              {/* One heading. It always reads "Hey, I'm Sreevarshan Sathiyamurthy."
                  for screen readers and crawlers; the visible word starts as
                  "Spiderman." and rebuilds itself into "Sreevarshan.". */}
              <h1 className="hero-id">
                <span className="hero-hey hero-fade" style={{ ["--enter-delay" as string]: "0.05s" }}>
                  Hey, I&apos;m
                </span>{" "}
                <span className="hero-first kinetic-css" ref={nameRef}>
                  <span className="sr-only">Sreevarshan Sathiyamurthy.</span>
                  <span className="hero-first-mask" aria-hidden="true">
                    <span className="split-char hf-word" data-phase={phase} style={{ animationDelay: "0.12s" }}>
                      <span className="hf-s" data-c="S" />
                      <span className="hf-mid">
                        <span className="hf-from">
                          {Array.from(FROM).map((c, i) => (
                            <span key={i} data-c={c} />
                          ))}
                        </span>
                        <span className="hf-to">
                          {Array.from(TO).map((c, i) => (
                            <span key={i} data-c={c} />
                          ))}
                        </span>
                      </span>
                      <span className="hf-an">
                        <span data-c="a" />
                        <span data-c="n" />
                        <span className="hf-dot" data-c="." />
                      </span>
                      <span className="hf-base" />
                    </span>
                  </span>
                </span>
              </h1>
              <noscript>
                <style>{`.hf-word .hf-from{display:none}.hf-word .hf-to{display:inline}.hero-stage .pswap-illustrated{opacity:0}`}</style>
              </noscript>
              <p className="hero-nick hero-fade" style={{ ["--enter-delay" as string]: "0.38s" }}>
                Most people call me <span className="serif-accent hero-nick-name">Sree</span>.
              </p>
            </div>
          </div>

          <div className="hero-work">
            <KineticText
              as="p"
              className="display hero-title relative z-[1]"
              delay={0.48}
              trigger="css"
              segments={["I build ", { text: "intelligent", className: "serif-accent text-accent-fg" }, " systems, from data to interface."]}
            />
            <div className="hero-actions hero-fade" style={{ ["--enter-delay" as string]: "0.62s" }}>
              <Link href="/projects" className="btn btn-primary">
                View projects <span className="arrow" aria-hidden="true">→</span>
              </Link>
              <a href={profile.resumePath} target="_blank" rel="noopener" className="btn btn-ghost">
                Resume
              </a>
            </div>
          </div>
        </div>

        <div className="hero-fade hero-bottom mt-14 grid gap-10 border-t border-line pt-8 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] lg:items-end" style={{ ["--enter-delay" as string]: "0.75s" }}>
          <dl className="hero-facts">
            <div>
              <dt className="eyebrow">Based in</dt>
              <dd>Boston, Massachusetts</dd>
            </div>
            <div>
              <dt className="eyebrow">Engineering</dt>
              <dd>AI · Data · Software</dd>
            </div>
            <div>
              <dt className="eyebrow">Studying</dt>
              <dd>M.S. Data Analytics Engineering, Northeastern University</dd>
            </div>
          </dl>
          <div className="v-detailed">
            <Companies />
          </div>
        </div>
      </div>
    </section>
  );
}
