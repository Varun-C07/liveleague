// Pure adapters: our real API shapes -> the shapes the ported design screens
// expect. No React, no I/O — unit-tested in tests/design-map.test.ts.
import type { Game } from "@liveleagues/core/sports/types";
import type { LiveOverview } from "@liveleagues/core/sports/types";
import type { ApiMatch, StandingRowDto } from "@liveleagues/core/api-shape";
import { groupOutlook, type TeamOutlook } from "@liveleagues/core/group-scenarios";

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

// Short date in ET, e.g. "Jun 19".
export function dateLabel(utc: string): string {
  try {
    return new Date(utc).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      timeZone: "America/New_York",
    });
  } catch {
    return "";
  }
}

// Date + time in ET, e.g. "Jun 19, 8:00 PM".
export function kickoffDateTimeLabel(utc: string): string {
  const d = dateLabel(utc);
  const t = kickoffLabel(utc);
  return d && t ? `${d}, ${t}` : d || t;
}

// Short "4–3 pens" tag for a knockout decided on penalties (null otherwise).
export function pensLabel(m: { status: string; pens?: { home: number; away: number } | null }): string | null {
  if (m.status !== "ft" || !m.pens) return null;
  return `${m.pens.home}–${m.pens.away} pens`;
}

export type SlateItem = {
  key: string;
  sportId: string; // "soccer" | "f1" — picks the rail icon
  sport: string; // emoji (fallback icon)
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

// Soccer games carry id `soccer-${n}` → deep-link to /soccer/match/${n}. Anything
// without that shape (e.g. the dev demo match) falls back to the board.
function soccerMatchHref(id: string): string {
  return id.startsWith("soccer-") ? `/soccer/match/${id.slice("soccer-".length)}` : "/soccer";
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
        sportId: s.id,
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
  key: string;
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
    key: g.id,
    label: g.label,
    home: { ...teamSide(g.home), name: g.home.name },
    away: { ...teamSide(g.away), name: g.away.name },
    score:
      g.status === "sched" ? "vs" : `${g.home.score ?? 0}–${g.away.score ?? 0}`,
    min: statusMin(g),
    status: g.status,
    href: soccerMatchHref(g.id),
  };
}

// ── Upcoming section: per-sport, soonest-first, never interleaved ────────────
type UpTeam = { code: string; color: string; dark: boolean };
export type UpcomingSoccer = {
  key: string; status: Game["status"]; when: string; href: string; utc: string;
  label: string; a: UpTeam; b: UpTeam; score: string;
};
export type UpcomingF1 = {
  key: string; status: Game["status"]; when: string; href: string; utc: string;
  round: number | null; name: string; loc: string;
};
export type Upcoming = { soccer: UpcomingSoccer[]; f1: UpcomingF1[] };

// Turn one overview game into the right per-sport card shape, pushing into the
// soccer / F1 buckets. `when` = the kickoff date for scheduled, live minute for live.
function pushGame(g: Game, sportId: "soccer" | "f1", basePath: string, soccer: UpcomingSoccer[], f1: UpcomingF1[]) {
  const when = g.status === "live" ? statusMin(g) : dateLabel(g.utc);
  if (sportId === "soccer") {
    soccer.push({
      key: g.id, status: g.status, when, href: soccerMatchHref(g.id), utc: g.utc,
      label: g.label, a: teamSide(g.home), b: teamSide(g.away),
      score: g.status === "sched" ? "vs" : `${g.home.score ?? 0}–${g.away.score ?? 0}`,
    });
  } else {
    f1.push({
      key: g.id, status: g.status, when, href: basePath, utc: g.utc,
      round: g.extra.sport === "f1" ? g.extra.round : null,
      name: g.venue || g.label,
      loc: [g.city, g.country].filter(Boolean).join(", "),
    });
  }
}

const byUtc = (a: { utc: string }, b: { utc: string }) =>
  new Date(a.utc).getTime() - new Date(b.utc).getTime();

// Every currently-live game across soccer + F1 (the home "Live now" section shows
// them all, like the World Cup board does — not just the one hero spotlight).
export function mapLive(ov: LiveOverview): Upcoming {
  const soccer: UpcomingSoccer[] = [];
  const f1: UpcomingF1[] = [];
  for (const s of ov.sports) {
    if (s.id !== "soccer" && s.id !== "f1") continue;
    for (const g of s.topGames) {
      if (g.status !== "live") continue;
      pushGame(g, s.id, s.basePath, soccer, f1);
    }
  }
  soccer.sort(byUtc);
  f1.sort(byUtc);
  return { soccer, f1 };
}

// Scheduled (sched-only) games into soccer / F1 upcoming lists. Live games get
// their own "Live now" section (mapLive); finished are skipped; the hero-featured
// game is excluded by key so it's never duplicated.
export function mapUpcoming(ov: LiveOverview, excludeKey?: string): Upcoming {
  const soccer: UpcomingSoccer[] = [];
  const f1: UpcomingF1[] = [];
  for (const s of ov.sports) {
    if (s.id !== "soccer" && s.id !== "f1") continue;
    for (const g of s.topGames) {
      if (g.id === excludeKey || g.status !== "sched") continue;
      pushGame(g, s.id, s.basePath, soccer, f1);
    }
  }
  soccer.sort(byUtc);
  f1.sort(byUtc);
  return { soccer, f1 };
}

// ── Score ticker: cross-sport live + upcoming strip ─────────────────────────
export type TickerItem = {
  key: string;
  sportId: "soccer" | "f1";
  href: string;
  status: Game["status"];
  detail: string; // live minute / "LIVE", or kickoff time for scheduled
  accent: string; // sport accent (used for the F1 round)
  utc: string;
  a?: { code: string; color: string; dark: boolean };
  b?: { code: string; color: string; dark: boolean };
  score?: string;
  round?: number | null;
  label?: string;
};

// Flat ticker list from the overview's top games: live + scheduled (skip final),
// live items first then soonest. Same data the home page polls — no new fetch.
export function mapTicker(ov: LiveOverview): TickerItem[] {
  const items: TickerItem[] = [];
  for (const s of ov.sports) {
    if (s.id !== "soccer" && s.id !== "f1") continue;
    for (const g of s.topGames) {
      if (g.status === "final") continue;
      const base = {
        key: g.id, sportId: s.id as "soccer" | "f1", href: s.basePath,
        status: g.status, detail: statusMin(g), accent: s.accent, utc: g.utc,
      };
      if (s.id === "soccer") {
        items.push({
          ...base, href: soccerMatchHref(g.id), a: teamSide(g.home), b: teamSide(g.away),
          score: g.status === "sched" ? "vs" : `${g.home.score ?? 0}–${g.away.score ?? 0}`,
        });
      } else {
        items.push({
          ...base, round: g.extra.sport === "f1" ? g.extra.round : null,
          label: g.venue || g.label,
        });
      }
    }
  }
  return items.sort(
    (a, b) =>
      Number(b.status === "live") - Number(a.status === "live") ||
      new Date(a.utc).getTime() - new Date(b.utc).getTime(),
  );
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
