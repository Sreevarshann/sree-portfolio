import { describe, expect, it } from "vitest";
import { renderCitationMarkers, resolveCitations, stripCitationMarkers } from "@/lib/ai/citations";
import { isAllowedHref } from "@/lib/ai/allowlist";
import { groundingText, unsupportedClaims } from "@/lib/ai/validate";
import { knowledge } from "@/lib/ai/knowledge";
import { retrieveConversation } from "@/lib/ai/retrieve";

const map = [
  { id: "S1", label: "About Sree", href: "/about" },
  { id: "S2", label: "RightRev", href: "/experience#rightrev" },
  { id: "S3", label: "AEGIS AI", href: "/projects/aegis-ai" },
  { id: "S4", label: "AEGIS AI", href: "/projects/aegis-ai" }, // another part of the same page
];

describe("citations", () => {
  it("numbers cited sources by first appearance, one per page, and drops unknown ids", () => {
    const text = "Boston engineer [S1]. Built agents [S2][S9]. Fraud platform [S3, S4]. Again [S2].";
    expect(resolveCitations(text, map).map((c) => [c.n, c.label, c.href])).toEqual([
      [1, "About Sree", "/about"],
      [2, "RightRev", "/experience#rightrev"],
      [3, "AEGIS AI", "/projects/aegis-ai"],
    ]);
  });

  it("renders markers as citation links and removes invalid ones", () => {
    expect(renderCitationMarkers("Engineer [S1]. Agents [S2][S9]. Fraud [S3; S4].", map)).toBe(
      "Engineer[1](#cite-1). Agents[2](#cite-2). Fraud[3](#cite-3).",
    );
  });

  it("hides a half-streamed marker until it completes", () => {
    expect(renderCitationMarkers("He built agents [S", map, true)).toBe("He built agents ");
    expect(renderCitationMarkers("He built agents [S2", map, true)).toBe("He built agents ");
    expect(renderCitationMarkers("He built agents [S2]", map, true)).toBe("He built agents[1](#cite-1)");
  });

  it("accepts full-width citation brackets (seen in a live Groq answer)", () => {
    const live = "Salesforce APIs and REST APIs 【S1】.";
    const m = [{ id: "S1", label: "RightRev", href: "/experience#rightrev" }];
    expect(resolveCitations(live, m).map((c) => c.label)).toEqual(["RightRev"]);
    expect(renderCitationMarkers(live, m)).toBe("Salesforce APIs and REST APIs[1](#cite-1).");
    expect(stripCitationMarkers(live)).toBe("Salesforce APIs and REST APIs.");
    expect(renderCitationMarkers("REST APIs 【S", m, true)).toBe("REST APIs ");
  });

  it("copies clean text without markers", () => {
    expect(stripCitationMarkers("Engineer [S1]. Agents [S2, S3].")).toBe("Engineer. Agents.");
  });
});

describe("source allowlist", () => {
  it("allows only portfolio pages, the public email and URLs the portfolio itself links", () => {
    for (const ok of ["/about", "/experience#rightrev", "/projects/aegis-ai", "/achievements#sauvc", "mailto:sreevarshan.dev@gmail.com", "https://github.com/Sreevarshann", "https://github.com/Sreevarshann/sourceatlas-agentic-rag"]) {
      expect(isAllowedHref(ok), ok).toBe(true);
    }
    for (const bad of ["/admin", "/projects/does-not-exist", "https://evil.example/about", "https://github.com/someone-else", "mailto:someone@example.com", "javascript:alert(1)", "http://github.com/Sreevarshann"]) {
      expect(isAllowedHref(bad), bad).toBe(false);
    }
  });

  it("every knowledge source points at an allowlisted page", () => {
    for (const c of knowledge) expect(isAllowedHref(c.href), `${c.id} → ${c.href}`).toBe(true);
  });
});

describe("claim validation", () => {
  const ctxFor = (...turns: string[]) =>
    groundingText(retrieveConversation(turns.map((content, i) => ({ role: i % 2 ? ("assistant" as const) : ("user" as const), content }))).chunks);

  it("flags the padded 'Who is Sree?' claim seen in production", () => {
    const ctx = ctxFor("Who is Sree?");
    const findings = unsupportedClaims(
      "He interned at RightRev, where he built Snowflake Cortex AI agents and integrated them with Salesforce and other services [S1].",
      ctx,
    );
    expect(findings).toContainEqual({ kind: "vague", value: "and other services" });
  });

  it("accepts a grounded 'Who is Sree?' answer", () => {
    const ctx = ctxFor("Who is Sree?");
    const answer =
      "Sreevarshan Sathiyamurthy (Sree) is an engineer based in Boston, Massachusetts [S1]. He is studying for a Master of Science in Data Analytics Engineering at Northeastern University [S1]. Most recently he was a Software & Data Engineer Intern at RightRev, building AI agents on Snowflake [S1][S2].";
    expect(unsupportedClaims(answer, ctx)).toEqual([]);
  });

  it("accepts the RightRev stack follow-up when it sticks to the complete list, and flags additions", () => {
    const ctx = ctxFor("What did he build at RightRev?", "Snowflake Cortex agents.", "What tech stack did he use there?");
    const good = "At RightRev he used Snowflake Cortex, SQL stored procedures, MCP, OAuth, RBAC, Salesforce APIs and REST APIs [S1].";
    expect(unsupportedClaims(good, ctx)).toEqual([]);
    const bad = "He used Snowflake Cortex, Kubernetes and Kafka, plus standard web technologies for the frontend [S1].";
    const kinds = unsupportedClaims(bad, ctx).map((f) => `${f.kind}:${f.value}`);
    expect(kinds).toEqual(expect.arrayContaining(["term:Kubernetes", "term:Kafka", "vague:standard web technologies"]));
  });

  it("never offers undocumented tools as facts, and flags them when an answer claims them (real production answer)", async () => {
    const { knowledge, factsOf } = await import("@/lib/ai/knowledge");
    const usage = factsOf(knowledge.find((c) => c.id === "tech-usage")!).join("\n");
    for (const t of ["LangChain", "Gemini", "PyTorch", "Kubernetes", "MongoDB", "Supabase", "Tableau", "Matplotlib"]) expect(usage).not.toContain(t);
    const ctx = ctxFor("What are his strongest technical skills?");
    const answer = "Intelligent-system engineering – building AI agents, RAG and evaluation pipelines, using Snowflake Cortex, Model Context Protocol, LangGraph and LangChain [ S2 ].";
    expect(unsupportedClaims(answer, ctx)).toContainEqual({ kind: "term", value: "LangChain" });
  });

  it("flags figures that the context does not contain", () => {
    const ctx = ctxFor("What did he build at RightRev?");
    expect(unsupportedClaims("He migrated 18 agents and audited 200+ views [S1].", ctx)).toEqual([]);
    expect(unsupportedClaims("He migrated 25 agents, cutting costs by 40% [S1].", ctx).map((f) => f.value)).toEqual(expect.arrayContaining(["25", "40%"]));
  });
});
