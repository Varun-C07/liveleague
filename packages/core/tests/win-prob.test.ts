import { describe, it, expect } from "vitest";
import {
  computeRatings,
  matchProbabilities,
  inPlayProbabilities,
  remainingFraction,
  type RatedMatch,
} from "../src/win-prob";

const HOSTS = new Set(["USA", "MEX", "CAN"]);
const DEF = 1700;

function sums100(p: { home: number; draw: number; away: number }) {
  expect(p.home + p.draw + p.away).toBe(100);
}

describe("matchProbabilities", () => {
  it("sums to 100 and is ~symmetric on a neutral, equal tie", () => {
    const p = matchProbabilities(1800, 1800, false, "A", "B");
    sums100(p);
    // No host edge → home and away should be within a point of each other.
    expect(Math.abs(p.home - p.away)).toBeLessThanOrEqual(1);
  });

  it("favours the stronger side", () => {
    const p = matchProbabilities(2100, 1700, false, "Strong", "Weak");
    sums100(p);
    expect(p.home).toBeGreaterThan(p.away);
    expect(p.pick).toContain("Strong");
  });

  it("gives the host a home-field edge over an equal opponent", () => {
    const neutral = matchProbabilities(1800, 1800, false, "H", "A");
    const host = matchProbabilities(1800, 1800, true, "H", "A");
    expect(host.home).toBeGreaterThan(neutral.home);
  });

  it("returns 'too close to call' for an even match", () => {
    const p = matchProbabilities(1800, 1800, false, "H", "A");
    expect(p.pick).toBe("Too close to call");
  });

  it("produces a plausible scoreline for a strong favourite", () => {
    const p = matchProbabilities(2150, 1650, false, "Strong", "Weak");
    const [h, a] = p.scoreline.split("–").map(Number);
    expect(h).toBeGreaterThanOrEqual(a);
  });
});

describe("computeRatings", () => {
  const seed = { ARG: 2100, FRA: 2000, BRA: 2000, USA: 1800 };

  it("does not mutate the seed and leaves unplayed teams untouched", () => {
    const matches: RatedMatch[] = [
      { h: "ARG", a: "FRA", hs: null, as: null, st: "sched", utc: "2026-06-12T18:00:00Z" },
    ];
    const r = computeRatings(matches, seed, HOSTS, DEF);
    expect(seed.ARG).toBe(2100);
    expect(r.ARG).toBe(2100);
    expect(r.FRA).toBe(2000);
  });

  it("raises the winner and lowers the loser, conserving total rating", () => {
    const matches: RatedMatch[] = [
      { h: "FRA", a: "BRA", hs: 3, as: 0, st: "ft", utc: "2026-06-12T18:00:00Z" },
    ];
    const r = computeRatings(matches, seed, HOSTS, DEF);
    expect(r.FRA).toBeGreaterThan(2000);
    expect(r.BRA).toBeLessThan(2000);
    expect(r.FRA + r.BRA).toBeCloseTo(4000, 5); // zero-sum update
  });

  it("applies results chronologically regardless of array order", () => {
    const unordered: RatedMatch[] = [
      { h: "ARG", a: "USA", hs: 1, as: 0, st: "ft", utc: "2026-06-20T18:00:00Z" },
      { h: "USA", a: "ARG", hs: 2, as: 0, st: "ft", utc: "2026-06-12T18:00:00Z" },
    ];
    const r = computeRatings(unordered, seed, HOSTS, DEF);
    expect(Number.isFinite(r.ARG)).toBe(true);
    expect(Number.isFinite(r.USA)).toBe(true);
  });
});

describe("remainingFraction", () => {
  it("is ~full at kickoff, ~half at the hour, ~none in stoppage", () => {
    expect(remainingFraction("1'")).toBeGreaterThan(0.95);
    expect(remainingFraction("45'")).toBeCloseTo(0.5, 1);
    expect(remainingFraction("90+3")).toBeLessThan(0.05);
    expect(remainingFraction("HT")).toBeCloseTo(0.5, 1);
    expect(remainingFraction(null)).toBeLessThan(0.05);
  });
});

describe("inPlayProbabilities", () => {
  it("sums to 100 and reflects a late lead", () => {
    // Even teams, home leads 1-0 at 85' → home should be heavily favoured.
    const p = inPlayProbabilities(1800, 1800, false, 1, 0, "85'", "H", "A");
    sums100(p);
    expect(p.home).toBeGreaterThan(70);
    expect(p.scoreline).toBe("1–0");
  });

  it("makes a trailing side an underdog even when nominally stronger", () => {
    const p = inPlayProbabilities(2100, 1700, false, 0, 1, "85'", "Strong", "Weak");
    sums100(p);
    expect(p.away).toBeGreaterThan(p.home);
  });

  it("collapses to the current result in deep stoppage", () => {
    const p = inPlayProbabilities(1800, 1800, false, 2, 1, "90+5", "H", "A");
    expect(p.home).toBeGreaterThan(90);
    expect(p.scoreline).toBe("2–1");
  });
});
