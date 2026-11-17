"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import type { MediaImage } from "@/content/media";

/**
 * Full-frame photo viewer on a native <dialog>: the browser handles focus
 * containment, Escape and an inert background; this adds previous/next
 * (buttons, arrow keys, swipe), captions, a counter and scroll locking.
 * Closing returns focus to the thumbnail that opened it.
 */
export function Lightbox({ images, index, onClose, onIndex }: { images: MediaImage[]; index: number | null; onClose: () => void; onIndex: (i: number) => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const swipe = useRef<{ x: number; y: number } | null>(null);
  const [loaded, setLoaded] = useState<string | null>(null);
  const open = index !== null;
  const img = open ? images[index] : null;

  const go = useCallback((d: number) => {
    if (index === null) return;
    onIndex((index + d + images.length) % images.length);
  }, [index, images.length, onIndex]);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) {
      d.showModal();
      document.documentElement.classList.add("lightbox-open");
    }
    if (!open) {
      if (d.open) d.close();
      // Release the scroll lock whenever the viewer is closed, however it closed.
      document.documentElement.classList.remove("lightbox-open");
    }
  }, [open]);

  useEffect(() => () => document.documentElement.classList.remove("lightbox-open"), []);

  return (
    <dialog
      ref={ref}
      className="lightbox"
      aria-label={img ? `Photo ${index! + 1} of ${images.length}: ${img.caption}` : "Photo viewer"}
      onClose={() => {
        document.documentElement.classList.remove("lightbox-open");
        onClose();
      }}
      onKeyDown={(e) => {
        if (e.key === "ArrowRight") { e.preventDefault(); go(1); }
        if (e.key === "ArrowLeft") { e.preventDefault(); go(-1); }
      }}
      onClick={(e) => {
        // A click on the backdrop (the dialog itself, outside the figure) closes it.
        if (e.target === e.currentTarget) ref.current?.close();
      }}
    >
      {img && (
        <figure
          className="lightbox-figure"
          onPointerDown={(e) => { swipe.current = { x: e.clientX, y: e.clientY }; }}
          onPointerUp={(e) => {
            const s = swipe.current;
            swipe.current = null;
            if (!s) return;
            const dx = e.clientX - s.x;
            if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(e.clientY - s.y) * 1.5) go(dx < 0 ? 1 : -1);
          }}
        >
          <div className="lightbox-frame" style={{ aspectRatio: `${img.width} / ${img.height}`, ["--ar" as string]: img.width / img.height } as React.CSSProperties}>
            <Image
              key={img.src}
              src={img.src}
              alt={img.alt}
              fill
              sizes="(min-width: 1024px) 80vw, 96vw"
              className="object-contain"
              data-loaded={loaded === img.src || undefined}
              onLoad={() => setLoaded(img.src)}
            />
          </div>
          <figcaption className="lightbox-caption">
            <span>{img.caption}</span>
            <span className="mono text-fg-muted" aria-hidden="true">{index! + 1} / {images.length}</span>
          </figcaption>
        </figure>
      )}
      <button type="button" className="lightbox-btn lightbox-close" onClick={() => ref.current?.close()} aria-label="Close photo viewer">
        <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true"><path d="M4 4l10 10M14 4L4 14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
      </button>
      {images.length > 1 && (
        <>
          <button type="button" className="lightbox-btn lightbox-prev" onClick={() => go(-1)} aria-label="Previous photo">
            <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true"><path d="M11 3L5 9l6 6" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
          <button type="button" className="lightbox-btn lightbox-next" onClick={() => go(1)} aria-label="Next photo">
            <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true"><path d="M7 3l6 6-6 6" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
        </>
      )}
    </dialog>
  );
}
