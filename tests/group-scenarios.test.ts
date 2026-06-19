import { describe, it, expect } from "vitest";
import {
  groupOutlook,
  type TeamStanding,
  type RemainingMatch,
} from "../lib/group-scenarios";

// Helper: 4-team group, current points only (GD/GF default 0).
function group(pts: Record<string, number>): TeamStanding[] {
  return Object.entries(pts).map(([code, Pts]) => ({ code, Pts, GD: 0, GF: 0 }));
}

describe("groupOutlook — clinched / eliminated by points", () => {
  it("a completed group resolves to through / contention / out", () => {
    // A=9, B=6, C=3, D=0; no matches left → A & B through, C is 3rd
    // (best-third contention), D out.
    const o = groupOutlook(group({ A: 9, B: 6, C: 3, D: 0 }), []);
    expect(o.A.state).toBe("through");
    expect(o.A.clinched).toBe(true);
    expect(o.B.state).toBe("through");
    expect(o.C.state).toBe("contention");
    expect(o.D.state).toBe("out");
  });

  it("clinched even with a game left when the gap can't be closed", () => {
    // A=6 after 2, others ≤1, one round left (each plays once). A can finish no
    // worse than 2nd: even losing, the chasers max out at 4 < 6... so through.
    const rem: RemainingMatch[] = [
      { home: "A", away: "B" },
      { home: "C", away: "D" },
    ];
    const o = groupOutlook(group({ A: 6, B: 1, C: 1, D: 0 }), rem);
    expect(o.A.clinched).toBe(true);
    expect(o.A.state).toBe("through");
  });

  it("a team that cannot reach top 2 in any scenario is eliminated", () => {
    // D=0 with one match left can reach at most 3 pts; A,B,C already on ≥4.
    const rem: RemainingMatch[] = [{ home: "C", away: "D" }];
    const o = groupOutlook(group({ A: 6, B: 6, C: 4, D: 0 }), rem);
    expect(o.D.state).toBe("out");
  });
});

describe("groupOutlook — final-round wording", () => {
  it("must-win team gets a 'Win' line", () => {
    // Last round. C on 3, needs to beat D to leapfrog B (3). A safe on 6.
    const rem: RemainingMatch[] = [
      { home: "A", away: "B" },
      { home: "C", away: "D" },
    ];
    const o = groupOutlook(group({ A: 6, B: 3, C: 3, D: 0 }), rem);
    expect(o.C.state).toBe("alive");
    expect(o.C.line).toMatch(/win/i);
  });

  it("a draw-is-enough team is worded accordingly", () => {
    // Final round. A safe on 9. B on 4 plays chaser C directly; a draw lifts B
    // to 5 and caps C at 3 — top 2 in every branch — but a loss can drop B out.
    const rem: RemainingMatch[] = [
      { home: "A", away: "D" },
      { home: "B", away: "C" },
    ];
    const o = groupOutlook(group({ A: 9, B: 4, C: 2, D: 2 }), rem);
    expect(o.B.state).toBe("alive");
    expect(o.B.line.toLowerCase()).toContain("draw");
  });
});

describe("groupOutlook — best-third contention", () => {
  it("a team out of the top 2 but able to finish 3rd is 'contention'", () => {
    // Group done: A=9, B=6, C=3, D=0 — C is 3rd, awaits the cross-group cutoff.
    const o = groupOutlook(group({ A: 9, B: 6, C: 3, D: 0 }), []);
    expect(o.C.state).toBe("contention");
  });
});

describe("groupOutlook — robustness", () => {
  it("ignores fixtures involving teams outside the group", () => {
    const rem: RemainingMatch[] = [{ home: "A", away: "ZZZ" }];
    const o = groupOutlook(group({ A: 3, B: 3, C: 3, D: 3 }), rem);
    expect(Object.keys(o).sort()).toEqual(["A", "B", "C", "D"]);
  });
});
