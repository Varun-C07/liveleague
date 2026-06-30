"use client";

import { useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTheme, type Theme } from "@/components/design/theme";
import { card, hex, unskew, Crest, Pulse } from "@/components/design/primitives";
import { ChevronDown, ChevronRight, MapPin, Lock } from "@/components/design/icons";
import { isLightColor, dateLabel, kickoffDateTimeLabel, pensLabel } from "@/components/design/map";
import { PinButton } from "@/components/design/screens/soccer/PinButton";
import { DateRangePicker, type DateRange } from "@/components/design/screens/soccer/DateRangePicker";
import { PAYWALL_ENABLED } from "@liveleague/core/gating";
import type { ApiMatch } from "@liveleague/core/api-shape";

// Two controls only: one Filter (which matches) and one Sort (how to order them),
// plus the calendar date picker. Everything else (stage/group selects, view chips)
// folds into these.
type FilterId = "all" | "mine" | "today";
type SortId = "date-asc" | "date-desc" | "group-asc" | "group-desc";

const FILTERS: { id: FilterId; label: string }[] = [
  { id: "all", label: "All matches" },
  { id: "mine", label: "My teams" },
  { id: "today", label: "Today" },
];
const SORTS: { id: SortId; label: string }[] = [
  { id: "date-asc", label: "Date ↑ earliest" },
  { id: "date-desc", label: "Date ↓ latest" },
  { id: "group-asc", label: "Group A → Z" },
  { id: "group-desc", label: "Group Z → A" },
];

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
// Does a match-day (etDay) fall inside the picked date / range? Empty selection
// (start === null) matches everything.
function inSelectedRange(md: string, r: DateRange): boolean {
  if (!r.start) return true;
  if (!md) return false;
  if (!r.end) return md === r.start;
  return md >= r.start && md <= r.end;
}

type Section = { key: string; label: string | null; items: ApiMatch[] };

const liveFirst = (a: ApiMatch, b: ApiMatch) =>
  Number(b.status === "live") - Number(a.status === "live") || a.utc.localeCompare(b.utc);

// Group the filtered list into collapsible sections per the active sort. Knockout
// matches always bucket last under group sorts (they have no group letter).
function buildSections(list: ApiMatch[], sort: SortId, today: string): Section[] {
  const isDate = sort.startsWith("date");
  const asc = sort.endsWith("asc");
  const buckets = new Map<string, ApiMatch[]>();
  for (const m of list) {
    const k = isDate ? etDay(m.utc) : m.grp ?? "KO";
    const arr = buckets.get(k);
    if (arr) arr.push(m);
    else buckets.set(k, [m]);
  }

  let keys: string[];
  if (isDate) {
    keys = [...buckets.keys()].sort();
    if (!asc) keys.reverse();
  } else {
    const groups = [...buckets.keys()].filter((k) => k !== "KO").sort();
    if (!asc) groups.reverse();
    keys = buckets.has("KO") ? [...groups, "KO"] : groups;
  }

  return keys.map((k) => ({
    key: k,
    label: isDate ? dayLabel(k, today) : k === "KO" ? "Knockout" : `Group ${k}`,
    items: buckets.get(k)!.sort(liveFirst),
  }));
}

// Collapsible fixtures: a single Filter + Sort dropdown and the calendar date
// picker drive a grouped, collapsible list of all 104 matches. Each row opens the
// full match center; the pin control sticks a match to the top of the board.
export function Fixtures({ matches, favSet }: { matches: ApiMatch[]; favSet: Set<string> }) {
  const { t } = useTheme();
  const today = todayET();
  const followedSet = favSet; // real followed teams (favourites)

  const [open, setOpen] = useState(true);
  const [filter, setFilter] = useState<FilterId>("all");
  const [sort, setSort] = useState<SortId>("date-asc");
  const [range, setRange] = useState<DateRange>({ start: null, end: null });
  const [toggled, setToggled] = useState<Set<string>>(new Set());

  // Only days with games are selectable in the calendar.
  const availableDays = useMemo(() => {
    const s = new Set<string>();
    for (const m of matches) {
      const d = etDay(m.utc);
      if (d) s.add(d);
    }
    return s;
  }, [matches]);

  const mine = (m: ApiMatch) => followedSet.has(m.home.code) || followedSet.has(m.away.code);
  const filterCounts = useMemo(
    () => ({
      all: matches.length,
      mine: matches.filter(mine).length,
      today: matches.filter((m) => etDay(m.utc) === today).length,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [matches, followedSet, today],
  );

  const sections = useMemo(() => {
    const filtered = matches.filter((m) => {
      if (filter === "mine" && !mine(m)) return false;
      if (filter === "today" && etDay(m.utc) !== today) return false;
      return inSelectedRange(etDay(m.utc), range);
    });
    return buildSections(filtered, sort, today);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matches, filter, followedSet, sort, range, today]);

  const total = useMemo(() => sections.reduce((n, s) => n + s.items.length, 0), [sections]);

  // Default-open section: the one containing today for date sorts, else the first.
  // XOR with user toggles so closing/opening sticks per section.
  const defaultOpenKey = useMemo(() => {
    if (!sort.startsWith("date")) return sections[0]?.key;
    const keys = sections.map((s) => s.key);
    return keys.includes(today) ? today : sections[0]?.key;
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
          {/* Controls — Filter · Date · Sort */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginBottom: 14 }}>
            <Sel t={t} ariaLabel="Filter matches" value={filter} onChange={(v) => setFilter(v as FilterId)}>
              {FILTERS.map((f) => (
                <option key={f.id} value={f.id}>{f.label} ({filterCounts[f.id]})</option>
              ))}
            </Sel>
            <DateRangePicker availableDays={availableDays} value={range} onChange={setRange} today={today} />
            <Sel t={t} ariaLabel="Sort fixtures" value={sort} onChange={(v) => setSort(v as SortId)}>
              {SORTS.map((s) => (
                <option key={s.id} value={s.id}>{s.label}</option>
              ))}
            </Sel>
          </div>

          {filter === "mine" && favSet.size === 0 ? (
            PAYWALL_ENABLED ? (
              <BundleTease t={t} />
            ) : (
              <div style={{ padding: "16px 18px", ...card(t) }}>
                <span style={{ fontSize: 13, color: t.textDim }}>You&apos;re not following any teams yet — tap the pin on a match or team to follow.</span>
              </div>
            )
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

// Tap a row → the full match page. Pin button stops propagation so it doesn't navigate.
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
        <div style={{ textAlign: "center" }}>
          <span className="disp num" style={{ fontSize: 17, fontWeight: 800, color: live ? t.live : t.text, whiteSpace: "nowrap" }}>{score}</span>
          {pensLabel(m) ? <div className="num" style={{ fontSize: 9.5, fontWeight: 800, color: t.textFaint, marginTop: 1 }}>{pensLabel(m)}</div> : null}
        </div>
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
