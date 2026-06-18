import { describe, it, expect } from "vitest";
import {
  isLightColor,
  mapSlate,
  mapFeatured,
  mapLeagues,
} from "../components/design/map";
import type { Game, LiveOverview } from "../lib/sports/types";

function soccerGame(over: Partial<Game> = {}): Game {
  return {
    id: "soccer-1", sport: "soccer", status: "live", utc: "2026-06-15T19:00:00Z",
    approx: false, label: "Group H",
    home: { code: "ESP", name: "Spain", color: "#C60B1E", score: 2 },
    away: { code: "CPV", name: "Cabo Verde", color: "#1565C0", score: 0 },
    extra: { sport: "soccer", grp: "H", minute: "63", stage: "Group H" },
    ...over,
  } as Game;
}
function f1Game(): Game {
  return {
    id: "f1-8", sport: "f1", status: "sched", utc: "2026-06-28T13:00:00Z",
    approx: false, label: "Round 8 · Austrian GP",
    home: { code: "", name: "", color: "#ff2a2a", score: null },
    away: { code: "", name: "", color: "#ff2a2a", score: null },
    extra: { sport: "f1", round: 8, circuit: "Red Bull Ring", sprint: false, podium: null },
  } as Game;
}

function overview(): LiveOverview {
  const base = {
    short: "", blurb: "", accentVar: "", competitionLabel: "",
    source: "snapshot" as const, reason: "fallback" as const, syncedAt: "",
  };
  return {
    syncedAt: "", totalLive: 1,
    sports: [
      { id: "soccer", name: "World Cup", emoji: "⚽", accent: "#16c060", basePath: "/soccer", liveCount: 1, total: 104, topGames: [soccerGame(), soccerGame({ id: "soccer-2", status: "sched", home: { code: "BRA", name: "Brazil", color: "#FFC400", score: null }, away: { code: "MAR", name: "Morocco", color: "#C1272D", score: null }, extra: { sport: "soccer", grp: "G", minute: null, stage: "Group G" } })], ...base },
      { id: "f1", name: "Formula 1", emoji: "🏎️", accent: "#ff2a2a", basePath: "/f1", liveCount: 0, total: 22, topGames: [f1Game()], ...base },
      { id: "nba", name: "NBA", emoji: "🏀", accent: "#ff7a18", basePath: "/nba", liveCount: 0, total: 5, topGames: [], ...base },
    ],
  } as LiveOverview;
}

describe("isLightColor", () => {
  it("yellow is light, navy is dark", () => {
    expect(isLightColor("#FFC400")).toBe(true);
    expect(isLightColor("#0A3161")).toBe(false);
  });
});

describe("mapSlate", () => {
  const slate = mapSlate(overview());
  it("includes soccer + f1, excludes nba", () => {
    expect(slate.some((s) => s.key === "f1-8")).toBe(true);
    expect(slate.some((s) => s.href === "/nba")).toBe(false);
  });
  it("live items sort first", () => {
    expect(slate[0].status).toBe("live");
  });
  it("soccer items carry crests + score, f1 carries a name", () => {
    const soc = slate.find((s) => s.key === "soccer-1")!;
    expect(soc.a?.code).toBe("ESP");
    expect(soc.score).toBe("2–0");
    const f1 = slate.find((s) => s.key === "f1-8")!;
    expect(f1.name).toContain("Austrian");
  });
});

describe("mapFeatured", () => {
  it("returns the live soccer match", () => {
    const f = mapFeatured(overview());
    expect(f?.home.code).toBe("ESP");
    expect(f?.status).toBe("live");
    expect(f?.score).toBe("2–0");
  });
});

describe("mapLeagues", () => {
  it("returns WC + F1 only", () => {
    const ls = mapLeagues(overview());
    expect(ls.map((l) => l.id).sort()).toEqual(["f1", "soccer"]);
    expect(ls.find((l) => l.id === "soccer")?.liveCount).toBe(1);
  });
});
