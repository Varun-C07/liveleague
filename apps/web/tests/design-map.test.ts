import { describe, it, expect } from "vitest";
import {
  isLightColor,
  mapSlate,
  mapFeatured,
  mapLeagues,
  mapUpcoming,
  mapTicker,
} from "../components/design/map";
import type { Game, LiveOverview } from "@liveleague/core/sports/types";

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

describe("mapUpcoming", () => {
  const featured = mapFeatured(overview());
  const up = mapUpcoming(overview(), featured?.key);

  it("groups by sport, never interleaved (only /soccer and /f1)", () => {
    expect(up.soccer.every((u) => u.href.startsWith("/soccer/match/"))).toBe(true);
    expect(up.f1.every((u) => u.href === "/f1")).toBe(true);
    expect(up.f1.length).toBe(1); // nba excluded entirely
  });

  it("excludes the hero-featured (live) match, keeps the next scheduled", () => {
    expect(up.soccer.some((u) => u.key === "soccer-1")).toBe(false);
    expect(up.soccer.some((u) => u.key === "soccer-2")).toBe(true);
  });

  it("carries the round number for f1 and 'vs' for scheduled soccer", () => {
    expect(up.f1[0].round).toBe(8);
    expect(up.soccer[0].score).toBe("vs");
  });

  it("sorts soonest-first within a sport", () => {
    const ov = overview();
    ov.sports.find((s) => s.id === "soccer")!.topGames = [
      soccerGame({ id: "late", status: "sched", utc: "2026-06-30T00:00:00Z" }),
      soccerGame({ id: "early", status: "sched", utc: "2026-06-20T00:00:00Z" }),
    ];
    expect(mapUpcoming(ov).soccer.map((u) => u.key)).toEqual(["early", "late"]);
  });
});

describe("mapTicker", () => {
  const ticker = mapTicker(overview());

  it("includes live + scheduled across soccer and f1, excludes nba", () => {
    expect(ticker.some((i) => i.sportId === "soccer")).toBe(true);
    expect(ticker.some((i) => i.sportId === "f1")).toBe(true);
    expect(ticker.every((i) => i.href.startsWith("/soccer/match/") || i.href === "/f1")).toBe(true);
  });

  it("puts live items first", () => {
    expect(ticker[0].status).toBe("live");
  });

  it("carries soccer score / f1 round", () => {
    const soc = ticker.find((i) => i.key === "soccer-1")!;
    expect(soc.score).toBe("2–0");
    const f1 = ticker.find((i) => i.key === "f1-8")!;
    expect(f1.round).toBe(8);
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
