// Sample analytics for the live-match detail (xG / formation / shot map / timeline /
// stats). We have no free backend for these — shown with a "sample" badge until the
// Phase 7 paid feed lands. Ported from the design prototype's LIVE_MATCH.

export type SampleTeam = { c: string; n: string; dark: boolean };

export const SAMPLE_H: SampleTeam = { c: "#C60B1E", n: "Spain", dark: false };
export const SAMPLE_A: SampleTeam = { c: "#1565C0", n: "Cabo Verde", dark: false };

export type SampleMatch = {
  group: string;
  venue: string;
  hs: number;
  as: number;
  min: number;
  prob: { h: number; d: number; a: number };
  events: { m: number; t: "H" | "A"; p: string; x: string }[];
  stats: { poss: number[]; shots: number[]; sot: number[]; corners: number[] };
  xgHome: number[][];
  xgAway: number[][];
  goals: { m: number }[];
  shots: { x: number; y: number; g: number; a?: number }[];
  form: {
    base: { name: string; nodes: number[][] };
    poss: { name: string; nodes: number[][] };
  };
};

export const SAMPLE_MATCH: SampleMatch = {
  group: "Group H",
  venue: "Mercedes-Benz Stadium · Atlanta",
  hs: 2,
  as: 0,
  min: 63,
  prob: { h: 84, d: 9, a: 7 },
  events: [
    { m: 23, t: "H", p: "Oyarzabal", x: "⚽" },
    { m: 41, t: "H", p: "Williams", x: "⚽" },
    { m: 58, t: "A", p: "Mendes", x: "🟨" },
  ],
  stats: { poss: [68, 32], shots: [14, 4], sot: [7, 1], corners: [6, 2] },
  xgHome: [[0, 0], [8, 0.05], [18, 0.24], [23, 0.88], [24, 0.93], [33, 1.08], [41, 1.74], [42, 1.8], [52, 1.98], [63, 2.21]],
  xgAway: [[0, 0], [14, 0.04], [29, 0.12], [40, 0.17], [50, 0.25], [58, 0.3], [63, 0.34]],
  goals: [{ m: 23 }, { m: 41 }],
  shots: [
    { x: 72, y: 34, g: 0 }, { x: 82, y: 43, g: 1 }, { x: 77, y: 62, g: 0 }, { x: 88, y: 53, g: 1 },
    { x: 63, y: 47, g: 0 }, { x: 91, y: 39, g: 0 }, { x: 22, y: 52, g: 0, a: 1 }, { x: 31, y: 44, g: 0, a: 1 },
  ],
  form: {
    base: { name: "4-3-3", nodes: [[50, 8, 1], [18, 28, 2], [39, 26, 5], [61, 26, 4], [82, 28, 3], [28, 52, 8], [50, 50, 6], [72, 52, 10], [24, 76, 11], [50, 80, 9], [76, 76, 7]] },
    poss: { name: "3-2-5", nodes: [[50, 8, 1], [30, 27, 2], [50, 24, 5], [70, 27, 4], [38, 47, 8], [62, 47, 6], [12, 70, 11], [33, 77, 10], [50, 82, 9], [67, 77, 3], [88, 70, 7]] },
  },
};
