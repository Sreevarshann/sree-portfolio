import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { evidence, technologies, techRows } from "@/content/technologies";

const sprite = fs.readFileSync(path.join(process.cwd(), "public", "tech-icons.svg"), "utf8");

describe("technology catalog", () => {
  it("has a logo asset for every tool (sprite symbol, file, or typographic tile)", () => {
    for (const t of technologies) {
      if (t.logo.kind === "sprite") expect(sprite, t.id).toContain(`<symbol id="${t.logo.id}"`);
      if (t.logo.kind === "file") expect(fs.existsSync(path.join(process.cwd(), "public", t.logo.src)), t.logo.src).toBe(true);
      if (t.logo.kind === "text") expect(t.logo.mark.length).toBeLessThanOrEqual(3);
    }
  });

  it("names a real usage context for every mapped tool", () => {
    for (const t of technologies) for (const id of t.usedIn) expect(evidence[id], `${t.id} → ${id}`).toBeTruthy();
  });

  it("leaves tools without verified usage unmapped instead of inventing a context", () => {
    const unmapped = technologies.filter((t) => t.usedIn.length === 0).map((t) => t.id).sort();
    expect(unmapped).toEqual(["bigquery", "gemini", "kubernetes", "langchain", "matplotlib", "mongodb", "pytorch", "r", "sqlserver", "supabase", "tableau"]);
  });

  it("attributes university coursework only where the education record names it", () => {
    const viaCoursework = technologies.filter((t) => t.usedIn.includes("coursework")).map((t) => t.id).sort();
    expect(viaCoursework).toEqual(["airflow", "docker"]);
  });

  it("never infers usage from a course's typical curriculum", () => {
    const viaCourse = technologies.filter((t) => t.usedIn.includes("aws-course")).map((t) => t.id);
    // Only the course whose own title names the tool.
    expect(viaCourse).toEqual(["aws"]);
    expect(technologies.some((t) => t.usedIn.includes("google-da"))).toBe(false);
  });

  it("has no classification tiers", () => {
    expect(JSON.stringify(technologies)).not.toMatch(/exploring|hands-on/i);
  });

  it("includes the requested AI tools with recognizable marks", () => {
    for (const id of ["claude", "openai", "gemini", "huggingface"]) {
      const t = technologies.find((x) => x.id === id);
      expect(t?.logo.kind, id).not.toBe("text");
    }
  });

  it("puts every tool in exactly one marquee row, with no duplicate ids", () => {
    const ids = technologies.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const t of technologies) expect(techRows.filter((r) => r.categories.includes(t.category))).toHaveLength(1);
    expect(techRows.map((r) => r.direction)).toEqual(["left", "right"]);
  });

  it("never states proficiency levels or percentages", () => {
    expect(JSON.stringify(technologies)).not.toMatch(/\d+\s?%|expert|proficien|beginner|advanced/i);
  });
});
