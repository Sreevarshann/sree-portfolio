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

  it("backs every hands-on tool with evidence and lists the rest as exploring", () => {
    for (const t of technologies) {
      if (t.level === "hands-on") {
        expect(t.usedIn.length, t.id).toBeGreaterThan(0);
        for (const id of t.usedIn) expect(evidence[id], `${t.id} → ${id}`).toBeTruthy();
      } else {
        expect(t.usedIn, t.id).toEqual([]);
      }
    }
  });

  it("keeps tools without verified usage in the exploring tier", () => {
    const exploring = technologies.filter((t) => t.level === "exploring").map((t) => t.id).sort();
    expect(exploring).toEqual(["gemini", "kubernetes", "langchain", "matplotlib", "mongodb", "pytorch", "sqlserver", "supabase", "tableau"]);
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
