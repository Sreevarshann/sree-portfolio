import { describe, expect, it } from "vitest";
import { correctRecordVerbs, createStreamRedactor } from "@/lib/ai/guard";

describe("record verbs", () => {
  it("keeps 'migrated 18 agents' from the record", () => {
    expect(correctRecordVerbs("He built and migrated 18 Snowflake Cortex AI agents to production.")).toBe("He migrated 18 Snowflake Cortex AI agents to production.");
    expect(correctRecordVerbs("Built and migrated 18 AI agents.")).toBe("Migrated 18 AI agents.");
    expect(correctRecordVerbs("He created 18 AI agents.")).toBe("He migrated 18 AI agents.");
    expect(correctRecordVerbs("He built Snowflake Cortex AI agents and migrated 18 AI agents to production.")).toBe("He built Snowflake Cortex AI agents and migrated 18 AI agents to production.");
    expect(correctRecordVerbs("He audited 200+ views.")).toBe("He audited 200+ views.");
  });
  it("applies across streamed chunks", () => {
    const r = createStreamRedactor();
    const out = ["He built and mig", "rated 18 Snowflake Cortex AI ", "agents to production, then audited views."].map((c) => r.push(c)).join("") + r.flush();
    expect(out).toBe("He migrated 18 Snowflake Cortex AI agents to production, then audited views.");
  });
});

import { commitmentIn } from "@/lib/ai/validate";
describe("employer descriptions", () => {
  it("drops sentences that characterise an employer", () => {
    expect(commitmentIn("RightRev is a company that builds AI-powered tools to help finance teams analyze revenue data.")).not.toBeNull();
    expect(commitmentIn("The platform also includes SQL stored procedures and MCP integrations.")).not.toBeNull();
    expect(commitmentIn("At RightRev, Sree migrated 18 AI agents to production [S1].")).toBeNull();
    expect(commitmentIn("He worked at RightRev as a Software & Data Engineer Intern.")).toBeNull();
  });
});

describe("team results", () => {
  it("never upgrades a team placing to leadership", () => {
    expect(commitmentIn("He also led a 6th-place autonomous underwater vehicle team, demonstrating reinforcement learning.")).not.toBeNull();
    expect(commitmentIn("His team placed 6th globally at the Singapore AUV Challenge [S3].")).toBeNull();
  });
});
