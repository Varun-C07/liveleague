import { describe, it, expect } from "vitest";
import { normalizeSummary } from "../lib/espn-summary";

// Minimal ESPN-summary-shaped fixture exercising every branch of the normalizer.
const SUMMARY = {
  header: {
    competitions: [
      {
        status: { type: { state: "post", detail: "FT" } },
        competitors: [
          { homeAway: "home", score: "2", team: { id: "660", abbreviation: "USA", displayName: "United States" } },
          { homeAway: "away", score: "0", team: { id: "628", abbreviation: "AUS", displayName: "Australia" } },
        ],
      },
    ],
  },
  keyEvents: [
    { clock: { displayValue: "11'" }, type: { type: "own-goal", text: "Own Goal" }, team: { id: "660" }, text: "Own Goal by Cameron Burgess.", participants: [{ athlete: { displayName: "Cameron Burgess" } }] },
    { clock: { displayValue: "16'" }, type: { type: "yellow-card", text: "Yellow Card" }, team: { id: "628" }, text: "Jordan Bos shown a yellow card.", participants: [{ athlete: { displayName: "Jordan Bos" } }] },
    { clock: { displayValue: "45'" }, type: { type: "substitution", text: "Substitution" }, team: { id: "628" }, text: "Sub, Australia.", participants: [{ athlete: { displayName: "Jason Geria" } }] },
    { clock: { displayValue: "24'" }, type: { type: "start-delay", text: "Start Delay" }, text: "Drinks break." },
  ],
  boxscore: {
    teams: [
      { team: { id: "660" }, statistics: [{ name: "possessionPct", value: 61.9 }, { name: "totalShots", value: 10 }, { name: "wonCorners", value: 7 }] },
      { team: { id: "628" }, statistics: [{ name: "possessionPct", value: 38.1 }, { name: "totalShots", value: 3 }, { name: "wonCorners", value: 2 }] },
    ],
  },
  rosters: [
    { team: { id: "660" }, formation: "3-5-2", roster: [
      { starter: true, jersey: "24", athlete: { displayName: "Matt Freese" }, position: { abbreviation: "G" } },
      { starter: false, jersey: "9", athlete: { displayName: "Sub Guy" }, position: { abbreviation: "F" } },
    ] },
    { team: { id: "628" }, formation: "5-4-1", roster: [
      { starter: true, jersey: "18", athlete: { displayName: "Patrick Beach" }, position: { abbreviation: "G" } },
    ] },
  ],
  gameInfo: { venue: { fullName: "Lumen Field" }, attendance: 66925, officials: [{ displayName: "Felix Zwayer" }] },
};

describe("normalizeSummary", () => {
  const d = normalizeSummary(SUMMARY);

  it("reads status + score line by side", () => {
    expect(d.status).toBe("ft");
    expect(d.detail).toBe("FT");
    expect(d.home).toMatchObject({ code: "USA", score: 2 });
    expect(d.away).toMatchObject({ code: "AUS", score: 0 });
  });

  it("keeps only goal/card/sub events and assigns the right side", () => {
    expect(d.events).toHaveLength(3); // the start-delay is dropped
    expect(d.events[0]).toMatchObject({ kind: "goal", side: "home", player: "Cameron Burgess", minute: "11'" });
    expect(d.events[1]).toMatchObject({ kind: "yellow", side: "away", player: "Jordan Bos" });
    expect(d.events[2].kind).toBe("sub");
  });

  it("maps curated stats per side (and skips all-zero rows)", () => {
    const poss = d.stats.find((s) => s.key === "possession");
    expect(poss).toMatchObject({ home: 61.9, away: 38.1, pct: true });
    const shots = d.stats.find((s) => s.key === "shots");
    expect(shots).toMatchObject({ home: 10, away: 3 });
    // fouls were not provided → omitted entirely
    expect(d.stats.find((s) => s.key === "fouls")).toBeUndefined();
  });

  it("builds lineups with formation + starters", () => {
    expect(d.lineups?.home).toMatchObject({ formation: "3-5-2" });
    expect(d.lineups?.home.starters).toHaveLength(1); // only the starter, not the sub
    expect(d.lineups?.home.starters[0]).toMatchObject({ jersey: "24", name: "Matt Freese", pos: "G" });
  });

  it("extracts venue / attendance / referee", () => {
    expect(d.venue).toBe("Lumen Field");
    expect(d.attendance).toBe(66925);
    expect(d.referee).toBe("Felix Zwayer");
  });
});
