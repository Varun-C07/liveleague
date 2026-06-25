import { describe, it, expect } from "vitest";
import { normalizeRace } from "../lib/jolpica-race";

const RESULTS = {
  MRData: { RaceTable: { Races: [{
    raceName: "Australian Grand Prix",
    date: "2026-03-08",
    Circuit: { circuitName: "Albert Park" },
    Results: [
      { position: "1", positionText: "1", points: "25", grid: "1", status: "Finished",
        Driver: { driverId: "russell", code: "RUS", givenName: "George", familyName: "Russell" },
        Constructor: { constructorId: "mercedes", name: "Mercedes" },
        Time: { time: "1:23:06.801" },
        FastestLap: { rank: "2", lap: "40", Time: { time: "1:22.500" } } },
      { position: "3", positionText: "3", points: "15", grid: "6", status: "Finished",
        Driver: { driverId: "leclerc", code: "LEC", givenName: "Charles", familyName: "Leclerc" },
        Constructor: { constructorId: "ferrari", name: "Ferrari" },
        Time: { time: "+15.519" },
        FastestLap: { rank: "1", lap: "43", Time: { time: "1:22.091" } } },
      { position: "7", positionText: "7", points: "0", grid: "9", status: "Lapped",
        Driver: { driverId: "albon", code: "ALB", givenName: "Alex", familyName: "Albon" },
        Constructor: { constructorId: "williams", name: "Williams" }, Time: {} },
      { position: "18", positionText: "R", points: "0", grid: "12", status: "Retired",
        Driver: { driverId: "alonso", code: "ALO", givenName: "Fernando", familyName: "Alonso" },
        Constructor: { constructorId: "aston", name: "Aston Martin" }, Time: {} },
    ],
  }] } },
};
const QUALI = {
  MRData: { RaceTable: { Races: [{ QualifyingResults: [
    { position: "1", Driver: { code: "RUS" }, Q1: "1:19.5", Q2: "1:18.9", Q3: "1:18.5" },
    { position: "2", Driver: { code: "LEC" }, Q1: "1:19.7", Q2: "1:19.0", Q3: "1:18.7" },
  ] }] } },
};
const PITS = {
  MRData: { RaceTable: { Races: [{ PitStops: [
    { driverId: "russell", lap: "20", stop: "1", duration: "22.500" },
    { driverId: "leclerc", lap: "18", stop: "1", duration: "17.664" },
    { driverId: "alonso", lap: "13", stop: "1", duration: "16:12.356" }, // red-flag outlier
  ] }] } },
};

describe("normalizeRace", () => {
  const d = normalizeRace(1, { results: RESULTS, qualifying: QUALI, pitstops: PITS });

  it("reads race meta + status", () => {
    expect(d).toMatchObject({ status: "ft", round: 1, name: "Australian Grand Prix", circuit: "Albert Park" });
  });

  it("classifies finishers, lapped, and DNF via positionText", () => {
    const byCode = Object.fromEntries(d.results.map((r) => [r.code, r]));
    expect(byCode.RUS).toMatchObject({ pos: 1, points: 25, dnf: false, gained: 0 });
    expect(byCode.LEC).toMatchObject({ pos: 3, gained: 3, dnf: false }); // grid 6 → P3
    expect(byCode.ALB.dnf).toBe(false); // "Lapped" is still classified
    expect(byCode.ALO.dnf).toBe(true); // positionText "R"
  });

  it("picks the rank-1 fastest lap", () => {
    expect(d.fastestLap).toMatchObject({ code: "LEC", time: "1:22.091", lap: 43 });
  });

  it("reads qualifying", () => {
    expect(d.qualifying[0]).toMatchObject({ pos: 1, code: "RUS", q3: "1:18.5" });
  });

  it("parses pit durations incl. M:SS outliers (so fastest is real)", () => {
    expect(d.pitstops.fastest).toMatchObject({ code: "LEC", duration: "17.664" });
    // the 16:12 stop is 972s, not 16 — never the fastest
    expect(d.pitstops.byDriver[0].code).toBe("LEC");
  });
});
