import { describe, it, expect } from "vitest";
import { GP_MAX, SPRINT_MAX, maxPointsRemaining, canReach, gap } from "@/lib/sports/f1-scenarios";

describe("maxPointsRemaining", () => {
  it("sums GP and sprint maxima", () => {
    expect(maxPointsRemaining(3, 1)).toBe(3 * GP_MAX + 1 * SPRINT_MAX);
    expect(maxPointsRemaining(0, 0)).toBe(0);
  });
  it("never goes negative", () => {
    expect(maxPointsRemaining(-2, -1)).toBe(0);
  });
});

describe("canReach", () => {
  it("is true when points + remaining can match the target", () => {
    expect(canReach(100, 120, 26)).toBe(true); // 126 >= 120
    expect(canReach(100, 120, 10)).toBe(false); // 110 < 120
    expect(canReach(120, 120, 0)).toBe(true); // already level
  });
});

describe("gap", () => {
  it("is the non-negative deficit to the target", () => {
    expect(gap(90, 120)).toBe(30);
    expect(gap(120, 90)).toBe(0); // ahead → no deficit
  });
});
