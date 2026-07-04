import { describe, it, expect } from "vitest";
import { parseStatus, clampLive, applyEvents, toApiMatch, placeholderLabel, type RawEvent } from "@/lib/normalize";
import type { Match } from "@liveleague/core/types";

function ko(h: string, a: string): Match {
  return { n: 75, stage: "R32", grp: null, h, a, ven: "Gillette Stadium", city: "Boston", ctry: "USA", utc: "2026-06-29T20:30:00Z", hs: null, as: null, st: "sched", approx: true };
}

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

describe("applyEvents — penalty shootout", () => {
  const now = Date.parse("2026-06-30T00:00:00Z");

  it("stores the shootout result on a finished knockout", () => {
    const m = ko("MEX", "KOR");
    const ev: RawEvent = { strHomeTeam: "MEX", strAwayTeam: "KOR", intHomeScore: "1", intAwayScore: "1", strStatus: "FT", pens: { home: 4, away: 3 } };
    applyEvents([m], [ev], now);
    expect(m.st).toBe("ft");
    expect(toApiMatch(m).pens).toEqual({ home: 4, away: 3 });
  });

  it("orients pens to our home/away when the feed lists teams flipped", () => {
    const m = ko("MEX", "KOR"); // our home = MEX
    const ev: RawEvent = { strHomeTeam: "KOR", strAwayTeam: "MEX", intHomeScore: "1", intAwayScore: "1", strStatus: "FT", pens: { home: 5, away: 4 } };
    applyEvents([m], [ev], now);
    expect(toApiMatch(m).pens).toEqual({ home: 4, away: 5 }); // MEX (our home) took the away value
  });

  it("does not attach pens to a non-shootout match", () => {
    const m = ko("MEX", "KOR");
    applyEvents([m], [{ strHomeTeam: "MEX", strAwayTeam: "KOR", intHomeScore: "2", intAwayScore: "0", strStatus: "FT" }], now);
    expect(toApiMatch(m).pens).toBeNull();
  });
});

describe("placeholderLabel", () => {
  it("humanizes undecided knockout slot codes", () => {
    expect(placeholderLabel("1E")).toBe("Winner Group E");
    expect(placeholderLabel("2A")).toBe("Runner-up Group A");
    expect(placeholderLabel("W89")).toBe("Winner · Match 89");
    expect(placeholderLabel("L101")).toBe("Loser · Match 101");
    expect(placeholderLabel("3rd A/B/C/D/F")).toBe("3rd place · A/B/C/D/F");
    expect(placeholderLabel("BRA")).toBe("BRA"); // real code passes through
  });
});
