"use client";

import { useEffect, useRef, useState } from "react";
import type { MediaVideo } from "@/content/media";

type Conn = { saveData?: boolean };

/**
 * Inline achievement video. Nothing downloads until the player nears the
 * viewport; then it attaches the right rendition (1080p on wider screens,
 * 720p on phones or with Save-Data) and, unless the visitor prefers reduced
 * motion or data saving, starts muted. It pauses when scrolled away and when
 * unmounted. If the browser refuses autoplay, a play button is shown.
 * Compact custom controls: play/pause, sound, replay.
 */
export function AchievementVideo({ video }: { video: MediaVideo }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [src, setSrc] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);
  const [ended, setEnded] = useState(false);
  const [progress, setProgress] = useState(0);
  const visible = useRef(false);
  const autoOk = useRef(false);

  /** Muted autoplay, only when allowed, visible, attached, and not paused by the visitor. */
  const tryAutoplay = () => {
    const el = ref.current;
    if (!el || !autoOk.current || !visible.current || !el.getAttribute("src") || !el.paused || el.ended || el.dataset.userPaused === "1") return;
    el.play().catch(() => setPlaying(false)); // refused: the play button stays visible
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

    return () => {
      near.disconnect();
      seen.disconnect();
      el.pause();
    };
    // tryAutoplay reads refs only; it is stable for this effect's lifetime.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [video.sources]);

  // The source attaches asynchronously; once it is there, start if already in view.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => tryAutoplay(), [src]);

  const toggle = () => {
    const el = ref.current;
    if (!el) return;
    if (el.paused || el.ended) {
      el.dataset.userPaused = "0";
      if (el.ended) el.currentTime = 0;
      void el.play().catch(() => {});
    } else {
      el.dataset.userPaused = "1";
      el.pause();
    }
  };

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
          aria-label={video.label}
          onPlay={() => { setPlaying(true); setEnded(false); }}
          onPause={() => setPlaying(false)}
          onEnded={() => { setPlaying(false); setEnded(true); }}
          onTimeUpdate={(e) => setProgress(e.currentTarget.currentTime / (e.currentTarget.duration || video.duration))}
          onClick={toggle}
        />
        {!playing && (
          <button type="button" className="ach-video-big" onClick={toggle} aria-label={ended ? "Replay video" : "Play video"}>
            {ended ? (
              <svg width="26" height="26" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12a8 8 0 1 0 2.4-5.7M4 4v4h4" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
            ) : (
              <svg width="26" height="26" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13l10.5-6.5z" fill="currentColor" /></svg>
            )}
          </button>
        )}
        <div className="ach-video-bar">
          <button type="button" className="ach-video-btn" onClick={toggle} aria-label={playing ? "Pause video" : ended ? "Replay video" : "Play video"}>
            {playing ? (
              <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="M4 2.5v9M10 2.5v9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="M4 2.5v9l7.5-4.5z" fill="currentColor" /></svg>
            )}
          </button>
          <span className="ach-video-track" aria-hidden="true"><span style={{ transform: `scaleX(${Math.min(1, progress)})` }} /></span>
          <button type="button" className="ach-video-btn" onClick={() => setMuted((m) => !m)} aria-label={muted ? "Turn sound on" : "Turn sound off"} aria-pressed={!muted}>
            {muted ? (
              <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="M2 5h2.5L8 2v10L4.5 9H2z" fill="currentColor" /><path d="M10 5l3 4M13 5l-3 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" /></svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="M2 5h2.5L8 2v10L4.5 9H2z" fill="currentColor" /><path d="M10 4.5c1 .8 1 4.2 0 5M11.6 3c1.9 1.6 1.9 6.4 0 8" stroke="currentColor" strokeWidth="1.2" fill="none" strokeLinecap="round" /></svg>
            )}
          </button>
        </div>
      </div>
      <figcaption className="ach-media-caption">{video.caption} · {Math.round(video.duration)} s</figcaption>
    </figure>
  );
}
