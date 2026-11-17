"use client";

import { useEffect, useRef, useState } from "react";
import type { MediaVideo } from "@/content/media";

type Conn = { saveData?: boolean };
/** How long the play/pause glyph lingers after the visitor toggles playback. */
const FLASH_MS = 700;

/**
 * Inline achievement video, presented without a control bar.
 *
 * Nothing downloads until the player nears the viewport; then it attaches the
 * right rendition (1080p on wider screens, 720p on phones or with Save-Data)
 * and, unless the visitor prefers reduced motion or data saving, starts muted.
 *
 * The whole frame is one button: click, tap, Enter or Space toggles playback.
 * A brief glyph confirms each toggle and fades. If autoplay is refused (or
 * not attempted), a small play glyph stays until the first play. A discreet
 * corner button controls sound (the clip has real pool audio); it never turns
 * on by itself. Playback pauses when the video leaves the viewport, when the
 * tab is hidden and on unmount, so nothing plays in the background.
 */
export function AchievementVideo({ video }: { video: MediaVideo }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [src, setSrc] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const [started, setStarted] = useState(false);
  const [muted, setMuted] = useState(true);
  const [ended, setEnded] = useState(false);
  const [flash, setFlash] = useState<"play" | "pause" | null>(null);
  const visible = useRef(false);
  const autoOk = useRef(false);
  const flashTimer = useRef(0);

  /** Muted autoplay, only when allowed, visible, attached, and not paused by the visitor. */
  const tryAutoplay = () => {
    const el = ref.current;
    if (!el || !autoOk.current || !visible.current || !el.getAttribute("src") || !el.paused || el.ended || el.dataset.userPaused === "1") return;
    el.play().catch(() => setPlaying(false)); // refused: the play glyph stays visible
  };

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const conn = (navigator as Navigator & { connection?: Conn }).connection;
    const lite = conn?.saveData === true;
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    autoOk.current = !still && !lite;
    const wide = window.matchMedia("(min-width: 768px)").matches;
    const pick = video.sources.find((s) => (wide && !lite ? s.width >= 1080 : s.width < 1080)) ?? video.sources[0];

    // Attach the source shortly before the player is visible (no download on load).
    const near = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      near.disconnect();
      setSrc(pick.src);
    }, { rootMargin: "300px 0px" });
    near.observe(el);

    // Autoplay muted while at least half visible; pause when it leaves.
    const seen = new IntersectionObserver(([e]) => {
      visible.current = e.intersectionRatio >= 0.5;
      if (visible.current) tryAutoplay();
      else if (!el.paused) el.pause();
    }, { threshold: [0, 0.5] });
    seen.observe(el);

    // Never keep playing in a hidden tab; resume (muted autoplay rules) on return.
    const onVis = () => (document.hidden ? el.pause() : tryAutoplay());
    document.addEventListener("visibilitychange", onVis);

    return () => {
      near.disconnect();
      seen.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      window.clearTimeout(flashTimer.current);
      el.pause();
    };
    // tryAutoplay reads refs only; it is stable for this effect's lifetime.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [video.sources]);

  // The source attaches asynchronously; once it is there, start if already in view.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => tryAutoplay(), [src]);

  const showFlash = (kind: "play" | "pause") => {
    window.clearTimeout(flashTimer.current);
    setFlash(kind);
    flashTimer.current = window.setTimeout(() => setFlash(null), FLASH_MS);
  };

  const toggle = () => {
    const el = ref.current;
    if (!el) return;
    if (!el.getAttribute("src")) {
      // Activated before the source attached (e.g. keyboard from far away): attach and play.
      const wide = window.matchMedia("(min-width: 768px)").matches;
      const pick = video.sources.find((s) => (wide ? s.width >= 1080 : s.width < 1080)) ?? video.sources[0];
      el.src = pick.src;
      setSrc(pick.src);
    }
    if (el.paused || el.ended) {
      el.dataset.userPaused = "0";
      if (el.ended) el.currentTime = 0;
      showFlash("play");
      el.play().catch(() => setPlaying(false));
    } else {
      el.dataset.userPaused = "1";
      el.pause();
      showFlash("pause");
    }
  };

  const label = playing ? "Pause video" : ended ? "Replay video" : "Play video";

  return (
    <figure className="ach-video" data-playing={playing || undefined}>
      <div className="ach-video-frame" style={{ aspectRatio: `${video.width} / ${video.height}` }}>
        <video
          ref={ref}
          src={src ?? undefined}
          poster={video.poster}
          muted={muted}
          playsInline
          preload="none"
          disablePictureInPicture
          disableRemotePlayback
          controlsList="nodownload noplaybackrate nofullscreen noremoteplayback"
          aria-hidden="true"
          tabIndex={-1}
          onPlay={() => { setPlaying(true); setStarted(true); setEnded(false); }}
          onPause={() => setPlaying(false)}
          onEnded={() => { setPlaying(false); setEnded(true); }}
        />
        {/* The whole frame toggles playback (one handler: no double toggles). */}
        <button type="button" className="ach-video-surface" onClick={toggle} aria-label={`${label}: ${video.label}`}>
          {flash && (
            <span key={flash + String(playing)} className="ach-video-flash" aria-hidden="true">
              {flash === "pause" ? <PauseIcon /> : <PlayIcon />}
            </span>
          )}
          {!flash && !playing && (!started || ended) && (
            <span className="ach-video-cue" aria-hidden="true">
              {ended ? <ReplayIcon /> : <PlayIcon />}
            </span>
          )}
        </button>
        <button type="button" className="ach-video-sound" onClick={() => setMuted((m) => !m)} aria-label={muted ? "Turn sound on" : "Turn sound off"} aria-pressed={!muted}>
          {muted ? (
            <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="M2 5h2.5L8 2v10L4.5 9H2z" fill="currentColor" /><path d="M10 5l3 4M13 5l-3 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" /></svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="M2 5h2.5L8 2v10L4.5 9H2z" fill="currentColor" /><path d="M10 4.5c1 .8 1 4.2 0 5M11.6 3c1.9 1.6 1.9 6.4 0 8" stroke="currentColor" strokeWidth="1.2" fill="none" strokeLinecap="round" /></svg>
          )}
        </button>
        <p className="sr-only" aria-live="polite">{started ? (playing ? "Playing" : ended ? "Video ended" : "Paused") : ""}</p>
      </div>
      <figcaption className="ach-media-caption">{video.caption} · {Math.round(video.duration)} s</figcaption>
    </figure>
  );
}

function PlayIcon() {
  return <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13l10.5-6.5z" fill="currentColor" /></svg>;
}
function PauseIcon() {
  return <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14M16 5v14" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" /></svg>;
}
function ReplayIcon() {
  return <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12a8 8 0 1 0 2.4-5.7M4 4v4h4" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}
