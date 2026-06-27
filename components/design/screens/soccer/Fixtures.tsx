"use client";

import { useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTheme, type Theme } from "@/components/design/theme";
import { card, hex, unskew, Crest, Pulse } from "@/components/design/primitives";
import { ChevronDown, ChevronRight, MapPin, Lock } from "@/components/design/icons";
import { isLightColor, dateLabel, kickoffDateTimeLabel } from "@/components/design/map";
import { PinButton } from "@/components/design/screens/soccer/PinButton";
import type { ApiMatch } from "@/lib/api-shape";

type ViewId = "today" | "all" | "live" | "mine";
type StageId = "all" | "group" | "r32" | "r16" | "qf" | "sf" | "final";
type SortId = "date" | "group" | "team";
type DateId = "all" | "today" | "d3" | "d7";

const DATES: { id: DateId; label: string }[] = [
  { id: "all", label: "All dates" },
  { id: "today", label: "Today" },
  { id: "d3", label: "Next 3 days" },
  { id: "d7", label: "Next 7 days" },
];

const VIEWS: { id: ViewId; label: string }[] = [
  { id: "today", label: "Today" },
  { id: "all", label: "All" },
  { id: "live", label: "Live" },
  { id: "mine", label: "My teams" },
];

// Stage categories are derived from the data: group stage = `grp != null`;
// knockout rounds = exact `stage` codes (the Final bucket includes 3rd place).
const STAGES: { id: StageId; label: string; match: (m: ApiMatch) => boolean }[] = [
  { id: "all", label: "All stages", match: () => true },
  { id: "group", label: "Group stage", match: (m) => m.grp != null },
  { id: "r32", label: "Round of 32", match: (m) => m.stage === "R32" },
  { id: "r16", label: "Round of 16", match: (m) => m.stage === "R16" },
  { id: "qf", label: "Quarter-final", match: (m) => m.stage === "QF" },
  { id: "sf", label: "Semi-final", match: (m) => m.stage === "SF" },
  { id: "final", label: "Final", match: (m) => m.stage === "Final" || m.stage === "3rd Place" },
];

const GROUPS = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"];

// ── date helpers (America/New_York, matching the kickoff labels) ──────────────
function etDay(utc: string): string {
  try {
    return new Date(utc).toLocaleDateString("en-CA", { timeZone: "America/New_York" });
  } catch {
    return "";
  }
}
function todayET(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "America/New_York" });
}
function dayLabel(key: string, today: string): string {
  const d = new Date(key + "T12:00:00");
  const wd = d.toLocaleDateString("en-US", { weekday: "short" });
  const md = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return key === today ? `Today · ${md}` : `${wd} · ${md}`;
}
// "YYYY-MM-DD" n days after `today` (noon-UTC arithmetic avoids DST edges).
function addDaysET(today: string, n: number): string {
  const d = new Date(today + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}
// Does a match-day (etDay) fall inside the selected date window?
function dateMatch(md: string, date: DateId, today: string): boolean {
  if (date === "all") return true;
  if (!md) return false;
  if (date === "today") return md === today;
  if (date === "d3") return md >= today && md <= addDaysET(today, 2);
  return md >= today && md <= addDaysET(today, 6); // d7
}

type Section = { key: string; label: string | null; items: ApiMatch[] };

const liveFirst = (a: ApiMatch, b: ApiMatch) =>
  Number(b.status === "live") - Number(a.status === "live") || a.utc.localeCompare(b.utc);

// Group the filtered list into collapsible sections per the active sort.
function buildSections(list: ApiMatch[], sort: SortId, today: string): Section[] {
  if (sort === "team") {
    const items = [...list].sort(
      (a, b) => a.home.name.localeCompare(b.home.name) || a.away.name.localeCompare(b.away.name),
    );
    return [{ key: "__flat", label: null, items }];
  }
  const buckets = new Map<string, ApiMatch[]>();
  for (const m of list) {
    const k = sort === "date" ? etDay(m.utc) : m.grp ?? "KO";
    let arr = buckets.get(k);
    if (!arr) {
      arr = [];
      buckets.set(k, arr);
    }
    arr.push(m);
  }
  const keys = [...buckets.keys()].sort((a, b) => {
    if (sort === "group") {
      if (a === "KO") return 1;
      if (b === "KO") return -1;
      return a.localeCompare(b);
    }
    return a.localeCompare(b); // date keys sort chronologically
  });
  return keys.map((k) => ({
    key: k,
    label: sort === "date" ? dayLabel(k, today) : k === "KO" ? "Knockout" : `Group ${k}`,
    items: buckets.get(k)!.sort(liveFirst),
  }));
}

// Collapsible, filterable 104-match system (views + stage/group/sort + collapsible
// sections), with each row expanding inline into the real match center (timeline /
// stats / lineups) and a pin-to-top control. Lives in the soccer board's column.
export function Fixtures({ matches, favSet }: { matches: ApiMatch[]; favSet: Set<string> }) {
  const { t } = useTheme();
  const today = todayET();
  const followedSet = favSet; // real followed teams (favourites)

  const [open, setOpen] = useState(true);
  const [view, setView] = useState<ViewId>("today"); // default = Today
  const [stage, setStage] = useState<StageId>("all");
  const [group, setGroup] = useState<string>("all");
  const [sort, setSort] = useState<SortId>("date");
  const [date, setDate] = useState<DateId>("all");
  const [toggled, setToggled] = useState<Set<string>>(new Set());

  const viewCounts = useMemo(
    () => ({
      all: matches.length,
      today: matches.filter((m) => etDay(m.utc) === today).length,
      live: matches.filter((m) => m.status === "live").length,
      mine: matches.filter((m) => followedSet.has(m.home.code) || followedSet.has(m.away.code)).length,
    }),
    [matches, followedSet, today],
  );

  // View filter (+ Today → next-matchday fallback).
  const { viewMatches, note } = useMemo(() => {
    if (view === "live") return { viewMatches: matches.filter((m) => m.status === "live"), note: null as string | null };
    if (view === "mine")
      return {
        viewMatches: matches.filter((m) => followedSet.has(m.home.code) || followedSet.has(m.away.code)),
        note: null as string | null,
      };
    if (view === "today") {
      const todays = matches.filter((m) => etDay(m.utc) === today);
      if (todays.length) return { viewMatches: todays, note: null as string | null };
      const next = matches.filter((m) => etDay(m.utc) > today).sort((a, b) => a.utc.localeCompare(b.utc))[0];
      if (!next) return { viewMatches: [], note: "No upcoming matches." };
      const nd = etDay(next.utc);
      return { viewMatches: matches.filter((m) => etDay(m.utc) === nd), note: `No matches today — showing ${dayLabel(nd, today)}` };
    }
    return { viewMatches: matches, note: null as string | null };
  }, [matches, view, followedSet, today]);

  const stageCounts = useMemo(() => {
    const c = {} as Record<StageId, number>;
    for (const s of STAGES) c[s.id] = viewMatches.filter(s.match).length;
    return c;
  }, [viewMatches]);
  const groupCounts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const g of GROUPS) c[g] = viewMatches.filter((m) => m.grp === g).length;
    return c;
  }, [viewMatches]);
  const dateCounts = useMemo(() => {
    const c = {} as Record<DateId, number>;
    for (const d of DATES) c[d.id] = viewMatches.filter((m) => dateMatch(etDay(m.utc), d.id, today)).length;
    return c;
  }, [viewMatches, today]);

  const sections = useMemo(() => {
    const stageDef = STAGES.find((s) => s.id === stage)!;
    const filtered = viewMatches.filter(
      (m) => stageDef.match(m) && (group === "all" || m.grp === group) && dateMatch(etDay(m.utc), date, today),
    );
    return buildSections(filtered, sort, today);
  }, [viewMatches, stage, group, sort, date, today]);

  const total = useMemo(() => sections.reduce((n, s) => n + s.items.length, 0), [sections]);

  // Default-open section: today's date (or next upcoming) for date sort; the
  // first section otherwise. XOR with user toggles so closing/opening sticks.
  const defaultOpenKey = useMemo(() => {
    if (sort !== "date") return sections[0]?.key;
    const keys = sections.map((s) => s.key);
    return keys.includes(today) ? today : keys.find((k) => k >= today) ?? sections[0]?.key;
  }, [sections, sort, today]);

  const isOpen = (key: string, label: string | null) =>
    label === null || (key === defaultOpenKey) !== toggled.has(key);
  const toggle = (key: string) =>
    setToggled((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  return (
    <div>
      <div
        onClick={() => setOpen(!open)}
        style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", marginBottom: 12 }}
      >
        <span className="disp" style={{ fontSize: 17, fontWeight: 800, flex: 1 }}>Fixtures</span>
        <span className="num" style={{ fontSize: 12, color: t.textFaint, fontWeight: 700 }}>{total}</span>
        <ChevronDown size={17} color={t.textFaint} style={{ transform: open ? "none" : "rotate(-90deg)", transition: "transform .2s" }} />
      </div>

      {open && (
        <>
          {/* Control bar — view chips + refine selects (one cohesive section) */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 9 }}>
            {VIEWS.map((v) => {
              const on = view === v.id;
              const n = viewCounts[v.id];
              const disabled = n === 0 && !on && v.id === "live";
              return (
                <button
                  key={v.id}
                  onClick={() => setView(v.id)}
                  disabled={disabled}
                  style={{ padding: "6px 12px", borderRadius: 8, border: "none", cursor: disabled ? "default" : "pointer", fontSize: 12, fontWeight: 700, whiteSpace: "nowrap", opacity: disabled ? 0.4 : 1, background: on ? t.accent : t.chip, color: on ? t.onAccent : t.textDim }}
                >
                  {v.label}<span className="num" style={{ marginLeft: 6, opacity: 0.7 }}>{n}</span>
                </button>
              );
            })}
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginBottom: 14 }}>
            <Sel t={t} ariaLabel="Filter by stage" value={stage} onChange={(v) => setStage(v as StageId)}>
              {STAGES.map((s) => (
                <option key={s.id} value={s.id} disabled={s.id !== "all" && stageCounts[s.id] === 0}>
                  {s.label} ({stageCounts[s.id]})
                </option>
              ))}
            </Sel>
            <Sel t={t} ariaLabel="Jump to group" value={group} onChange={setGroup}>
              <option value="all">All groups</option>
              {GROUPS.map((g) => (
                <option key={g} value={g} disabled={groupCounts[g] === 0}>
                  Group {g} ({groupCounts[g]})
                </option>
              ))}
            </Sel>
            <Sel t={t} ariaLabel="Filter by date" value={date} onChange={(v) => setDate(v as DateId)}>
              {DATES.map((d) => (
                <option key={d.id} value={d.id} disabled={d.id !== "all" && dateCounts[d.id] === 0}>
                  {d.label} ({dateCounts[d.id]})
                </option>
              ))}
            </Sel>
            <Sel t={t} ariaLabel="Sort fixtures" value={sort} onChange={(v) => setSort(v as SortId)}>
              <option value="date">Sort: Date</option>
              <option value="group">Sort: Group</option>
              <option value="team">Sort: Team</option>
            </Sel>
          </div>

          {note ? (
            <div style={{ fontSize: 12, color: t.textDim, fontWeight: 600, marginBottom: 11 }}>{note}</div>
          ) : null}

          {view === "mine" && favSet.size === 0 ? (
            <BundleTease t={t} />
          ) : total === 0 ? (
            <div style={{ padding: "16px 18px", ...card(t) }}>
              <span style={{ fontSize: 13, color: t.textDim }}>No matches for this filter.</span>
            </div>
          ) : (
            sections.map((sec) => (
              <FixtureSection
                key={sec.key}
                t={t}
                sec={sec}
                open={isOpen(sec.key, sec.label)}
                onToggle={() => toggle(sec.key)}
                followedSet={followedSet}
              />
            ))
          )}
        </>
      )}
    </div>
  );
}

// Styled native select — accessible, design-system colors, not a pile of buttons.
function Sel({
  t,
  value,
  onChange,
  ariaLabel,
  children,
}: {
  t: Theme;
  value: string;
  onChange: (v: string) => void;
  ariaLabel: string;
  children: ReactNode;
}) {
  return (
    <select
      aria-label={ariaLabel}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        background: t.chip, color: t.text, border: `1px solid ${hex(t.border, 0.85)}`,
        borderRadius: 8, padding: "7px 10px", fontSize: 12, fontWeight: 700,
        fontFamily: "inherit", cursor: "pointer",
      }}
    >
      {children}
    </select>
  );
}

function FixtureSection({
  t,
  sec,
  open,
  onToggle,
  followedSet,
}: {
  t: Theme;
  sec: Section;
  open: boolean;
  onToggle: () => void;
  followedSet: Set<string>;
}) {
  const rows = (
    <div style={{ display: "grid", gap: 8, marginTop: sec.label ? 8 : 0, marginBottom: sec.label ? 12 : 0 }}>
      {sec.items.map((m) => (
        <FixtureRow key={m.n} m={m} mine={followedSet.has(m.home.code) || followedSet.has(m.away.code)} />
      ))}
    </div>
  );
  if (sec.label === null) return rows;
  return (
    <div>
      {/* Section label — design-system bar + uppercase .disp + count */}
      <button
        onClick={onToggle}
        aria-expanded={open}
        style={{ width: "100%", display: "flex", alignItems: "center", gap: 8, background: "transparent", border: "none", cursor: "pointer", color: t.text, textAlign: "left", padding: "4px 0" }}
      >
        <span style={{ width: 4, height: 15, background: t.textDim, transform: "skewX(-10deg)", borderRadius: 1, flexShrink: 0 }} />
        <span className="disp" style={{ fontSize: 14, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".02em" }}>{sec.label}</span>
        <span className="num" style={{ fontSize: 11, color: t.textFaint, fontWeight: 700 }}>{sec.items.length}</span>
        <span style={{ flex: 1 }} />
        <ChevronDown size={15} color={t.textFaint} style={{ transform: open ? "none" : "rotate(-90deg)", transition: "transform .2s" }} />
      </button>
      {open ? rows : null}
    </div>
  );
}

// Premium dark + gold bundle tease for empty "My teams".
function BundleTease({ t }: { t: Theme }) {
  return (
    <div style={{ position: "relative", overflow: "hidden", borderRadius: 16, background: `linear-gradient(150deg, ${t.surfaceHi}, ${t.surface} 62%)`, border: `1px solid ${hex(t.gold, 0.45)}`, boxShadow: t.shadow, padding: "22px 22px" }}>
      <div aria-hidden style={{ position: "absolute", inset: 0, pointerEvents: "none", background: `radial-gradient(60% 80% at 100% 0%, ${hex(t.gold, 0.12)}, transparent 60%)` }} />
      <div style={{ position: "relative" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 11 }}>
          <Lock size={14} color={t.gold} />
          <span className="cond" style={{ fontSize: 11.5, fontWeight: 800, letterSpacing: ".1em", textTransform: "uppercase", color: t.gold }}>World Cup Bundle</span>
        </div>
        <div className="disp" style={{ fontSize: 23, fontWeight: 800, marginBottom: 7 }}>Follow up to 4 teams</div>
        <div style={{ fontSize: 13, color: t.textDim, lineHeight: 1.6, maxWidth: 430, marginBottom: 17 }}>
          Pin your teams and jump straight to their fixtures, with kickoff alerts and live tracking — part of the $5 World Cup Bundle.
        </div>
        <Link href="/account" style={{ textDecoration: "none" }}>
          <span style={{ display: "inline-flex", padding: "11px 22px", border: "none", background: t.gold, color: t.bg, fontWeight: 800, fontSize: 14, cursor: "pointer", whiteSpace: "nowrap", transform: "skewX(-9deg)" }}>
            <span style={unskew}>Get the bundle — $5 <ChevronRight size={15} /></span>
          </span>
        </Link>
      </div>
    </div>
  );
}

// Tap a live/finished row to expand the real match center (timeline · stats ·
// lineups) inline; pin a match to the top of the board.
function FixtureRow({ m, mine }: { m: ApiMatch; mine: boolean }) {
  const { t } = useTheme();
  const router = useRouter();
  const live = m.status === "live";
  const loc = [m.venue, m.city].filter(Boolean).join(", ");
  const score = m.status === "sched" ? "v" : `${m.homeScore ?? 0}–${m.awayScore ?? 0}`;
  const statusLabel = live
    ? (m.minute || "LIVE")
    : m.status === "ft"
      ? `FT · ${dateLabel(m.utc)}`
      : kickoffDateTimeLabel(m.utc);

  // Tap the row → the full match page. Pin button stops propagation so it doesn't navigate.
  return (
    <div
      id={`match-${m.n}`}
      role="link"
      onClick={() => router.push(`/soccer/match/${m.n}`)}
      style={{ padding: "10px 13px", cursor: "pointer", ...card(t, live ? { ring: hex(t.live, 0.4) } : mine ? { ring: hex(t.accent, 0.3) } : {}) }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 7 }}>
        <span style={{ fontSize: 10, color: t.textFaint, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".04em", flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{m.stage}</span>
        {live ? (
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 10.5, fontWeight: 800, color: t.live }}><Pulse color={t.live} size={5} />{statusLabel}</span>
        ) : (
          <span style={{ fontSize: 10.5, color: t.textDim, fontWeight: 700 }}>{statusLabel}</span>
        )}
        <PinButton matchId={`soccer-${m.n}`} size={13} />
        <ChevronRight size={14} color={t.textFaint} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center", gap: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7, minWidth: 0 }}>
          <Crest code={m.home.code} color={m.home.color} dark={isLightColor(m.home.color)} size={22} />
          <span className="cond" style={{ fontSize: 13.5, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.home.name}</span>
        </div>
        <span className="disp num" style={{ fontSize: 17, fontWeight: 800, color: live ? t.live : t.text, whiteSpace: "nowrap" }}>{score}</span>
        <div style={{ display: "flex", alignItems: "center", gap: 7, justifyContent: "flex-end", minWidth: 0 }}>
          <span className="cond" style={{ fontSize: 13.5, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.away.name}</span>
          <Crest code={m.away.code} color={m.away.color} dark={isLightColor(m.away.color)} size={22} />
        </div>
      </div>
      {loc ? (
        <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 7, fontSize: 10.5, color: t.textFaint }}>
          <MapPin size={11} /><span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{loc}</span>
        </div>
      ) : null}
    </div>
  );
}
