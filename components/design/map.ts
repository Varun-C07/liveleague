// Pure adapters: our real API shapes -> the shapes the ported design screens
// expect. No React, no I/O — unit-tested in tests/design-map.test.ts.
import type { Game } from "@/lib/sports/types";
import type { LiveOverview } from "@/lib/sports/types";
import type { ApiMatch, StandingRowDto } from "@/lib/api-shape";
import { groupOutlook, type TeamOutlook } from "@/lib/group-scenarios";

// Light-color test so a Crest with a pale team colour gets dark text.
export function isLightColor(hexColor: string): boolean {
  const n = hexColor.replace("#", "");
  const f = n.length === 3 ? n.split("").map((x) => x + x).join("") : n;
  const r = parseInt(f.slice(0, 2), 16) || 0;
  const g = parseInt(f.slice(2, 4), 16) || 0;
  const b = parseInt(f.slice(4, 6), 16) || 0;
  // perceived luminance
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.62;
}

// Deterministic kickoff label in ET (matches the app default; stable SSR/CSR).
export function kickoffLabel(utc: string): string {
  try {
    return new Date(utc).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      timeZone: "America/New_York",
    });
  } catch {
    return "";
  }
}

export type SlateItem = {
  key: string;
  sport: string; // emoji
  label: string;
  status: "live" | "sched" | "final";
  min: string;
  href: string;
  a?: { code: string; color: string; dark: boolean };
  b?: { code: string; color: string; dark: boolean };
  score?: string;
  name?: string;
};

function statusMin(g: Game): string {
  if (g.status === "live") {
    const m = g.extra?.sport === "soccer" ? g.extra.minute : null;
    return m ? `${m}'` : "LIVE";
  }
  if (g.status === "final") return "FT";
  return kickoffLabel(g.utc);
}

function teamSide(c: { code: string; color: string }) {
  return { code: c.code, color: c.color, dark: isLightColor(c.color) };
}

// Flatten top games across the chosen sports into a "today" slate.
export function mapSlate(
  ov: LiveOverview,
  sportIds: string[] = ["soccer", "f1"],
): SlateItem[] {
  const items: SlateItem[] = [];
  for (const s of ov.sports) {
    if (!sportIds.includes(s.id)) continue;
    for (const g of s.topGames) {
      const isTeam = g.sport === "soccer";
      items.push({
        key: g.id,
        sport: s.emoji,
        label: g.label,
        status: g.status,
        min: statusMin(g),
        href: s.basePath,
        ...(isTeam
          ? {
              a: teamSide(g.home),
              b: teamSide(g.away),
              score:
                g.status === "sched"
                  ? "V"
                  : `${g.home.score ?? 0}–${g.away.score ?? 0}`,
            }
          : { name: g.label }),
      });
    }
  }
  // live first, then scheduled
  return items.sort(
    (a, b) => Number(b.status === "live") - Number(a.status === "live"),
  );
}

export type FeaturedMatch = {
  label: string;
  home: { code: string; name: string; color: string; dark: boolean };
  away: { code: string; name: string; color: string; dark: boolean };
  score: string;
  min: string;
  status: "live" | "sched" | "final";
  href: string;
} | null;

// The headline soccer match: a live one if any, else the next scheduled.
export function mapFeatured(ov: LiveOverview): FeaturedMatch {
  const soccer = ov.sports.find((s) => s.id === "soccer");
  if (!soccer || soccer.topGames.length === 0) return null;
  const g =
    soccer.topGames.find((x) => x.status === "live") ?? soccer.topGames[0];
  return {
    label: g.label,
    home: { ...teamSide(g.home), name: g.home.name },
    away: { ...teamSide(g.away), name: g.away.name },
    score:
      g.status === "sched" ? "vs" : `${g.home.score ?? 0}–${g.away.score ?? 0}`,
    min: statusMin(g),
    status: g.status,
    href: soccer.basePath,
  };
}

// Qualification outlook per group, keyed by group letter then team code.
// Remaining fixtures = group matches not yet final (live counts as undecided).
export function mapGroupOutlooks(
  groups: Record<string, StandingRowDto[]>,
  matches: ApiMatch[],
): Record<string, Record<string, TeamOutlook>> {
  const remainingByGroup: Record<string, { home: string; away: string }[]> = {};
  for (const m of matches) {
    if (!m.grp || m.status === "ft") continue;
    (remainingByGroup[m.grp] ??= []).push({ home: m.home.code, away: m.away.code });
  }
  const out: Record<string, Record<string, TeamOutlook>> = {};
  for (const [g, rows] of Object.entries(groups)) {
    out[g] = groupOutlook(
      rows.map((r) => ({ code: r.code, Pts: r.Pts, GD: r.GD, GF: r.GF })),
      remainingByGroup[g] ?? [],
    );
  }
  return out;
}

export type LeagueCard = {
  id: string;
  name: string;
  emoji: string;
  total: number;
  liveCount: number;
  sub: string;
  href: string;
  accent: string;
};

// WC + F1 league cards (others are cut per the design scope).
export function mapLeagues(
  ov: LiveOverview,
  sportIds: string[] = ["soccer", "f1"],
): LeagueCard[] {
  return ov.sports
    .filter((s) => sportIds.includes(s.id))
    .map((s) => {
      const next = s.topGames.find((g) => g.status !== "final");
      const sub =
        s.liveCount > 0
          ? `${s.liveCount} live${s.total ? ` · ${s.total} total` : ""}`
          : next
            ? `${next.label} · ${statusMin(next)}`
            : `${s.total} events`;
      return {
        id: s.id,
        name: s.name,
        emoji: s.emoji,
        total: s.total,
        liveCount: s.liveCount,
        sub,
        href: s.basePath,
        accent: s.accent,
      };
    });
}
