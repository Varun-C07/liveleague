// Sample data for the live-match detail's remaining illustrative panels —
// the win-probability bar and the formation shape. We have no free backend for
// these, so they render with a "sample" badge until a paid feed lands. The
// xG-momentum and shot-map panels were removed entirely (no affordable source).
// Ported from the design prototype's LIVE_MATCH.

export type SampleTeam = { c: string; n: string; dark: boolean };

export const SAMPLE_H: SampleTeam = { c: "#C60B1E", n: "Spain", dark: false };
export const SAMPLE_A: SampleTeam = { c: "#1565C0", n: "Cabo Verde", dark: false };

export type SampleMatch = {
  prob: { h: number; d: number; a: number };
  form: {
    base: { name: string; nodes: number[][] };
    poss: { name: string; nodes: number[][] };
  };
};

export const SAMPLE_MATCH: SampleMatch = {
  prob: { h: 84, d: 9, a: 7 },
  form: {
    base: { name: "4-3-3", nodes: [[50, 8, 1], [18, 28, 2], [39, 26, 5], [61, 26, 4], [82, 28, 3], [28, 52, 8], [50, 50, 6], [72, 52, 10], [24, 76, 11], [50, 80, 9], [76, 76, 7]] },
    poss: { name: "3-2-5", nodes: [[50, 8, 1], [30, 27, 2], [50, 24, 5], [70, 27, 4], [38, 47, 8], [62, 47, 6], [12, 70, 11], [33, 77, 10], [50, 82, 9], [67, 77, 3], [88, 70, 7]] },
  },
};
