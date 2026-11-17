import { createHash } from "node:crypto";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { profile } from "@/content/profile";

const root = join(__dirname, "..", "..");
const pdf = readFileSync(join(root, "public", profile.resumeFile));

describe("public resume", () => {
  it("links carry the file's own version, so a new PDF is never served from a stale cache", () => {
    const sha = createHash("sha256").update(pdf).digest("hex");
    expect(sha.slice(0, 12)).toBe(profile.resumeVersion);
    expect(profile.resumePath).toBe(`${profile.resumeFile}?v=${profile.resumeVersion}`);
  });

  it("no source file hard-codes the resume path instead of profile.resumePath", () => {
    const hits: string[] = [];
    const walk = (dir: string) => {
      for (const f of readdirSync(dir)) {
        const p = join(dir, f);
        if (statSync(p).isDirectory()) walk(p);
        else if (/\.(tsx?|mdx?)$/.test(f) && !p.endsWith("profile.ts") && readFileSync(p, "utf8").includes(profile.resumeFile)) hits.push(p);
      }
    };
    walk(join(root, "src"));
    expect(hits).toEqual([]);
  });

  it("the public PDF has no tel: link, and its links are only the public profiles", () => {
    // Raw PDF bytes are compressed, so text-level phone checks run at publish time
    // (see docs/UPDATING.md); here we assert on the link annotations.
    const raw = pdf.toString("latin1");
    expect(raw).not.toMatch(/tel:/i);
    const uris = [...raw.matchAll(/\/URI\s*\(([^)]*)\)/g)].map((m) => m[1]);
    for (const u of uris) expect(u).toMatch(/^(mailto:sreevarshan\.dev@gmail\.com|https:\/\/(www\.linkedin\.com|github\.com|scholar\.google\.com|drive\.google\.com)\/)/);
  });
});
