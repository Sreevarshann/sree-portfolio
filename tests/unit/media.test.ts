import { existsSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { achievementMedia, allMediaFiles, portrait } from "@/content/media";
import { getPortraitPair } from "@/lib/portrait";

const pub = (p: string) => join(__dirname, "..", "..", "public", p);

describe("media manifest", () => {
  it("every referenced file exists", () => {
    for (const f of allMediaFiles()) expect(existsSync(pub(f)), f).toBe(true);
  });

  it("the hero shows the Spider-Man photo first and reveals the real one", () => {
    const pair = getPortraitPair();
    expect(pair.illustrated).toBe(portrait.masked.src);
    expect(pair.real).toBe(portrait.real.src);
    expect(portrait.masked.src).toMatch(/spiderman-mask\.webp$/);
    expect(portrait.real.src).toMatch(/sree-real\.webp$/);
  });

  it("each achievement holds only its own media", () => {
    expect(achievementMedia.sauvc.every((m) => (m.kind === "image" ? m.src : m.poster).includes("/sauvc/"))).toBe(true);
    expect(achievementMedia["google-mlops-expo"].every((m) => m.kind === "image" && m.src.includes("/google/"))).toBe(true);
    // No video for Google: no empty player.
    expect(achievementMedia["google-mlops-expo"].some((m) => m.kind === "video")).toBe(false);
    expect(achievementMedia.sauvc[0].kind).toBe("video");
  });

  it("web images carry no EXIF or GPS metadata", () => {
    for (const f of allMediaFiles().filter((x) => x.endsWith(".webp"))) {
      const buf = readFileSync(pub(f));
      expect(buf.includes(Buffer.from("EXIF")), f).toBe(false);
      expect(buf.includes(Buffer.from("GPS")), f).toBe(false);
    }
  });

  it("videos are web H.264 MP4s with no location metadata, far smaller than the 110 MB original", () => {
    const video = achievementMedia.sauvc.find((m) => m.kind === "video")!;
    if (video.kind !== "video") throw new Error("expected a video");
    for (const s of video.sources) {
      const buf = readFileSync(pub(s.src));
      expect(buf.subarray(4, 8).toString(), s.src).toBe("ftyp");
      expect(buf.includes(Buffer.from("avc1")), s.src).toBe(true); // H.264
      expect(buf.includes(Buffer.from("ISO6709")), s.src).toBe(false); // Apple location tag
      expect(buf.includes(Buffer.from("com.apple.quicktime.location")), s.src).toBe(false);
      expect(statSync(pub(s.src)).size).toBe(s.bytes);
      expect(s.bytes).toBeLessThan(15_000_000);
    }
  });

  it("captions name only what the photos show", () => {
    const captions = Object.values(achievementMedia).flat().map((m) => m.caption).join(" ");
    expect(captions).not.toMatch(/teammate/i);
    expect(captions).not.toMatch(/[—–]/);
  });
});
