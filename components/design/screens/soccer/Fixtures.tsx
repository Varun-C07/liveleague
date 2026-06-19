"use client";

import { useMemo, useState } from "react";
import { useTheme } from "@/components/design/theme";
import { card, hex, Crest, Pulse } from "@/components/design/primitives";
import { ChevronDown, MapPin } from "@/components/design/icons";
import { isLightColor, dateLabel, kickoffDateTimeLabel } from "@/components/design/map";
import type { ApiMatch } from "@/lib/api-shape";

type FilterId = "all" | "today" | "live" | "mine" | "group" | "ko";

const FILTERS: { id: FilterId; label: string }[] = [
  { id: "all", label: "All" },
  { id: "today", label: "Today" },
  { id: "live", label: "Live" },
  { id: "mine", label: "My teams" },
  { id: "group", label: "Group stage" },
  { id: "ko", label: "Knockout" },
];

// Date in America/New_York (matches kickoffLabel), for the "Today" filter.
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

function matchesFilter(m: ApiMatch, f: FilterId, favSet: Set<string>, today: string): boolean {
  switch (f) {
    case "all": return true;
    case "today": return etDay(m.utc) === today;
    case "live": return m.status === "live";
    case "mine": return favSet.has(m.home.code) || favSet.has(m.away.code);
    case "group": return m.grp != null;
    case "ko": return m.grp == null;
  }
}

// Collapsible, filterable list of every fixture with location. Lives in the
// soccer board's main column.
export function Fixtures({ matches, favSet }: { matches: ApiMatch[]; favSet: Set<string> }) {
  const { t } = useTheme();
  const [open, setOpen] = useState(true);
  const [filter, setFilter] = useState<FilterId>("all");
  const today = todayET();

  const counts = useMemo(() => {
    const c = {} as Record<FilterId, number>;
    for (const f of FILTERS) c[f.id] = matches.filter((m) => matchesFilter(m, f.id, favSet, today)).length;
    return c;
  }, [matches, favSet, today]);

  const list = useMemo(() => {
    const rank = (m: ApiMatch) => (m.status === "live" ? 0 : m.status === "sched" ? 1 : 2);
    return matches
      .filter((m) => matchesFilter(m, filter, favSet, today))
      .sort((a, b) => rank(a) - rank(b) || a.utc.localeCompare(b.utc));
  }, [matches, filter, favSet, today]);

  return (
    <div>
      <div
        onClick={() => setOpen(!open)}
        style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", marginBottom: 12 }}
      >
        <span className="disp" style={{ fontSize: 17, fontWeight: 800, flex: 1 }}>Fixtures</span>
        <span className="num" style={{ fontSize: 12, color: t.textFaint, fontWeight: 700 }}>{list.length}</span>
        <ChevronDown size={17} color={t.textFaint} style={{ transform: open ? "none" : "rotate(-90deg)", transition: "transform .2s" }} />
      </div>

      {open && (
        <>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
            {FILTERS.map((f) => {
              const on = filter === f.id;
              const n = counts[f.id];
              return (
                <button
                  key={f.id}
                  onClick={() => setFilter(f.id)}
                  disabled={n === 0 && !on}
                  style={{ padding: "6px 12px", borderRadius: 8, border: "none", cursor: n === 0 && !on ? "default" : "pointer", fontSize: 12, fontWeight: 700, whiteSpace: "nowrap", opacity: n === 0 && !on ? 0.4 : 1, background: on ? t.accent : t.chip, color: on ? t.onAccent : t.textDim }}
                >
                  {f.label}<span className="num" style={{ marginLeft: 6, opacity: 0.7 }}>{n}</span>
                </button>
              );
            })}
          </div>

          {list.length === 0 ? (
            <div style={{ padding: "16px 18px", ...card(t) }}>
              <span style={{ fontSize: 13, color: t.textDim }}>No matches for this filter.</span>
            </div>
          ) : (
            <div style={{ display: "grid", gap: 8 }}>
              {list.map((m) => <FixtureRow key={m.n} m={m} mine={favSet.has(m.home.code) || favSet.has(m.away.code)} />)}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function FixtureRow({ m, mine }: { m: ApiMatch; mine: boolean }) {
  const { t } = useTheme();
  const live = m.status === "live";
  const loc = [m.venue, m.city].filter(Boolean).join(", ");
  const score = m.status === "sched" ? "v" : `${m.homeScore ?? 0}–${m.awayScore ?? 0}`;
  const statusLabel = live
    ? (m.minute || "LIVE")
    : m.status === "ft"
      ? `FT · ${dateLabel(m.utc)}`
      : kickoffDateTimeLabel(m.utc);

  return (
    <div style={{ padding: "10px 13px", ...card(t, live ? { ring: hex(t.live, 0.4) } : mine ? { ring: hex(t.accent, 0.3) } : {}) }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 7 }}>
        <span style={{ fontSize: 10, color: t.textFaint, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".04em", flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{m.stage}</span>
        {live ? (
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 10.5, fontWeight: 800, color: t.live }}><Pulse color={t.live} size={5} />{statusLabel}</span>
        ) : (
          <span style={{ fontSize: 10.5, color: t.textDim, fontWeight: 700 }}>{statusLabel}</span>
        )}
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
