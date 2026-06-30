import { describe, it, expect } from "vitest";
import type { Match } from "@liveleague/core/types";
import type { RawEvent } from "@/lib/normalize";
import { resolveKnockoutTeams, venueKeyFromName, unresolvedKnockoutDates } from "@/lib/resolve-knockouts";

function ko(over: Partial<Match>): Match {
  return {
    n: 73, stage: "R32", grp: null, h: "2A", a: "2B",
    ven: "SoFi Stadium", city: "Los Angeles", ctry: "USA",
    utc: "2026-06-28T22:00:00Z", hs: null, as: null, st: "sched", approx: true,
    ...over,
  };
}
function ev(over: Partial<RawEvent>): RawEvent {
  return { strHomeTeam: "South Africa", strAwayTeam: "Canada", venue: "SoFi Stadium", strTimestamp: "2026-06-28T19:00Z", ...over };
}

describe("venueKeyFromName", () => {
  it("maps exact stadium names and the renamed Azteca", () => {
    expect(venueKeyFromName("SoFi Stadium")).toBe("sofi");
    expect(venueKeyFromName("AT&T Stadium")).toBe("att");
    expect(venueKeyFromName("Estadio Azteca")).toBe("azt");
    expect(venueKeyFromName("Estadio Banorte")).toBe("azt"); // ESPN's current name
    expect(venueKeyFromName("Nowhere Arena")).toBeNull();
  });
});

describe("resolveKnockoutTeams", () => {
  it("fills a placeholder slot from the ESPN event at the same venue + time", () => {
    const m = ko({});
    const changed = resolveKnockoutTeams([m], [ev({})]);
    expect(changed).toBe(1);
    expect(m.h).toBe("RSA");
    expect(m.a).toBe("CAN");
  });

  it("matches the renamed Azteca venue via the alias", () => {
    const m = ko({ n: 79, ven: "Estadio Azteca", utc: "2026-07-01T01:00:00Z", h: "1A", a: "3rd C/E/F/H/I" });
    resolveKnockoutTeams([m], [ev({ strHomeTeam: "Mexico", strAwayTeam: "Ecuador", venue: "Estadio Banorte", strTimestamp: "2026-07-01T01:00Z" })]);
    expect([m.h, m.a]).toEqual(["MEX", "ECU"]);
  });

  it("ignores a same-venue event outside the time window", () => {
    const m = ko({});
    const changed = resolveKnockoutTeams([m], [ev({ strTimestamp: "2026-07-05T19:00Z" })]); // ~7 days off
    expect(changed).toBe(0);
    expect(m.h).toBe("2A");
  });

  it("leaves group matches and already-resolved slots untouched", () => {
    const group = ko({ grp: "A", h: "MEX", a: "RSA", stage: "Group A" });
    const resolved = ko({ h: "RSA", a: "CAN" });
    const changed = resolveKnockoutTeams([group, resolved], [ev({})]);
    expect(changed).toBe(0);
    expect(group.h).toBe("MEX");
  });
});

describe("unresolvedKnockoutDates", () => {
  it("lists nearby unresolved knockout days (with neighbours)", () => {
    const now = Date.parse("2026-06-28T12:00:00Z");
    const dates = unresolvedKnockoutDates([ko({})], now);
    expect(dates).toContain("2026-06-28");
    expect(dates).toContain("2026-06-27");
    expect(dates).toContain("2026-06-29");
  });

  it("excludes far-future and resolved knockouts", () => {
    const now = Date.parse("2026-06-28T12:00:00Z");
    const far = ko({ utc: "2026-07-15T19:00:00Z" });
    const done = ko({ h: "RSA", a: "CAN" });
    expect(unresolvedKnockoutDates([far, done], now)).toEqual([]);
  });
});
