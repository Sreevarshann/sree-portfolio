import { describe, expect, it } from "vitest";
import { inferSources } from "@/lib/ai/citations";

const refs = [
  { ref: { id: "S1", label: "RightRev" }, text: "Migrated 18 AI agents to production and audited 200+ Snowflake views. Integrated Salesforce CRM APIs with five AI agents. Snowflake Cortex, stored procedures, MCP." },
  { ref: { id: "S2", label: "Flare Innovation" }, text: "Engineered Python ETL pipelines processing 1M+ IoT records using PostgreSQL and Airtable, with PyTest schema validation. Power BI dashboards." },
  { ref: { id: "S3", label: "About" }, text: "Based in Boston, Massachusetts. Studying Data Analytics Engineering at Northeastern University." },
];

describe("inferSources", () => {
  it("finds the records an uncited answer draws on, best first", () => {
    const answer = "At RightRev he migrated 18 Snowflake Cortex AI agents to production, audited 200+ Snowflake views and integrated Salesforce CRM APIs. At Flare he built Python ETL pipelines for 1M+ IoT records.";
    expect(inferSources(answer, refs).map((r) => r.id)).toEqual(["S1", "S2"]);
  });
  it("shows nothing for an answer that uses no record", () => {
    expect(inferSources("A SQL join combines rows from two tables based on a related column.", refs)).toEqual([]);
  });
});
