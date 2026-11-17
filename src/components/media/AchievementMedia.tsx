"use client";

import Image from "next/image";
import { useState } from "react";
import { achievementMedia, type AchievementSlug, type MediaImage } from "@/content/media";
import { AchievementVideo } from "./AchievementVideo";
import { Lightbox } from "./Lightbox";

/**
 * The real photographs (and, for SAUVC, the task-pass video) for one
 * achievement, from the media manifest. With a video: the portrait video
 * beside a column of photos. Without: a featured photo above a row of
 * thumbnails. Every photo opens full-frame in the lightbox.
 */
export function AchievementMedia({ slug }: { slug: AchievementSlug }) {
  const items = achievementMedia[slug];
  const video = items.find((m) => m.kind === "video");
  const photos = items.filter((m): m is MediaImage => m.kind === "image");
  const [open, setOpen] = useState<number | null>(null);
  if (!items.length) return null;

  const thumb = (img: MediaImage, i: number, className: string, sizes: string) => (
    <button
      key={img.id}
      type="button"
      className={`ach-thumb group ${className}`}
      onClick={() => setOpen(i)}
      aria-label={`Open photo: ${img.caption}`}
      data-media-id={img.id}
    >
      <Image src={img.src} alt={img.alt} fill loading="lazy" sizes={sizes} className="object-cover transition-transform duration-700 group-hover:scale-[1.03]" style={{ objectPosition: img.focus ?? "50% 50%" }} />
    </button>
  );

  return (
    <div className={`ach-media ${video ? "ach-media-video" : "ach-media-photos"}`} data-achievement={slug}>
      {video && video.kind === "video" ? (
        <div className="grid gap-3 sm:grid-cols-[minmax(0,0.92fr)_minmax(0,1fr)]">
          <AchievementVideo video={video} />
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-1 sm:grid-rows-3">
            {photos.map((p, i) => thumb(p, i, "aspect-square sm:aspect-auto sm:h-full", "(min-width: 1024px) 18vw, (min-width: 640px) 30vw, 32vw"))}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-3">
          {photos.map((p, i) => thumb(p, i, i === 0 ? "col-span-3 aspect-[4/3]" : "aspect-square", i === 0 ? "(min-width: 1024px) 40vw, 92vw" : "(min-width: 1024px) 13vw, 30vw"))}
        </div>
      )}
      {photos[0] && <p className="ach-media-caption">{video ? "Photos" : photos[0].caption} · tap a photo to view it full size</p>}
      <Lightbox images={photos} index={open} onClose={() => setOpen(null)} onIndex={setOpen} />
    </div>
  );
}
