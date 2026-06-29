import { describe, it, expect } from "vitest";
import { parseStatus, clampLive } from "@/lib/normalize";

describe("parseStatus", () => {
  it("recognizes finished states", () => {
    expect(parseStatus("Match Finished").st).toBe("ft");
    expect(parseStatus("FT").st).toBe("ft");
    expect(parseStatus("AET").st).toBe("ft");
  });
  it("recognizes not-started states", () => {
    expect(parseStatus("NS").st).toBe("sched");
    expect(parseStatus("").st).toBe("sched");
  });
  it("treats a bare minute as live (the stale-progress case)", () => {
    expect(parseStatus("90").st).toBe("live");
    expect(parseStatus("57").min).toBe("57'");
    expect(parseStatus("HT").min).toBe("HALF");
  });
});

describe("clampLive (the 6pm-live-at-11pm fix)", () => {
  const kickoff = Date.parse("2026-06-16T18:00:00Z");
  it("keeps a genuinely in-progress match live", () => {
    const now = Date.parse("2026-06-16T18:50:00Z"); // 50 min in
    expect(clampLive("live", kickoff, true, now)).toBe("live");
  });
  it("downgrades a stale 'live' hours after kickoff to final (with scores)", () => {
    const now = Date.parse("2026-06-16T23:00:00Z"); // 5h later
    expect(clampLive("live", kickoff, true, now)).toBe("ft");
  });
  it("downgrades to sched when long over but no scores arrived", () => {
    const now = Date.parse("2026-06-16T23:00:00Z");
    expect(clampLive("live", kickoff, false, now)).toBe("sched");
  });
  it("downgrades a 'live' that is before kickoff to scheduled", () => {
    const now = Date.parse("2026-06-16T16:00:00Z"); // 2h before
    expect(clampLive("live", kickoff, false, now)).toBe("sched");
  });
  it("leaves non-live statuses untouched", () => {
    const now = Date.parse("2026-06-16T23:00:00Z");
    expect(clampLive("ft", kickoff, true, now)).toBe("ft");
    expect(clampLive("sched", kickoff, false, now)).toBe("sched");
  });
});
