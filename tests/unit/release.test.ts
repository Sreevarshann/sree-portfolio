import { describe, expect, it } from "vitest";
import { formatUpdated, updatedMonthISO } from "@/lib/release";

describe("release stamp", () => {
  it("shows month and year only, in Boston time", () => {
    expect(formatUpdated("2026-11-13T15:00:00Z")).toBe("November 2026");
    // 02:00 UTC on Dec 1 is still November 30 in Boston.
    expect(formatUpdated("2026-12-01T02:00:00Z")).toBe("November 2026");
    expect(updatedMonthISO("2026-12-01T02:00:00Z")).toBe("2026-11");
  });
  it("returns null for an invalid stamp instead of rendering 'Invalid Date'", () => {
    expect(formatUpdated("not-a-date")).toBeNull();
  });
});
