"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useTheme, type Theme } from "@/components/design/theme";
import { hex } from "@/components/design/primitives";
import { Calendar, ChevronRight } from "@/components/design/icons";

// A date / date-range value. `start === null` means "all dates"; `end === null`
// (with a start) means a single day. Dates are "YYYY-MM-DD" strings (which sort
// lexicographically = chronologically, so plain string compares work).
export type DateRange = { start: string | null; end: string | null };

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function pad(n: number): string {
  return String(n).padStart(2, "0");
}
function dayKey(y: number, m: number, d: number): string {
  return `${y}-${pad(m + 1)}-${pad(d)}`;
}
function monthKey(y: number, m: number): string {
  return `${y}-${pad(m + 1)}`;
}
// Short label ("Jun 26") for a YYYY-MM-DD key, timezone-stable via UTC noon.
function shortLabel(key: string): string {
  return new Date(key + "T12:00:00Z").toLocaleDateString("en-US", {
    month: "short", day: "numeric", timeZone: "UTC",
  });
}

function buttonLabel(value: DateRange): string {
  if (!value.start) return "All dates";
  if (!value.end || value.end === value.start) return shortLabel(value.start);
  return `${shortLabel(value.start)} – ${shortLabel(value.end)}`;
}

// Calendar popover that filters to a single day or a consecutive range, with only
// days that actually have games selectable. Styled to match the fixtures controls.
export function DateRangePicker({
  availableDays,
  value,
  onChange,
  today,
}: {
  availableDays: Set<string>;
  value: DateRange;
  onChange: (v: DateRange) => void;
  today: string;
}) {
  const { t } = useTheme();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Month bounds derived from the days that have games.
  const { minMonth, maxMonth } = useMemo(() => {
    const months = [...availableDays].map((d) => d.slice(0, 7)).sort();
    return { minMonth: months[0] ?? today.slice(0, 7), maxMonth: months[months.length - 1] ?? today.slice(0, 7) };
  }, [availableDays, today]);

  // Which month the grid is showing. Start on the selection, else today (if it has
  // games this tournament), else the first month with games.
  const initKey = (value.start ?? today).slice(0, 7);
  const [cursor, setCursor] = useState<string>(
    initKey >= minMonth && initKey <= maxMonth ? initKey : minMonth,
  );
  const [cy, cm] = cursor.split("-").map(Number);
  const year = cy;
  const month = cm - 1; // 0-indexed

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // 6×7 grid of day numbers (null for leading/trailing blanks).
  const cells = useMemo(() => {
    const firstDow = new Date(Date.UTC(year, month, 1)).getUTCDay();
    const days = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
    const out: (number | null)[] = [];
    for (let i = 0; i < firstDow; i++) out.push(null);
    for (let d = 1; d <= days; d++) out.push(d);
    while (out.length % 7 !== 0) out.push(null);
    return out;
  }, [year, month]);

  const prevDisabled = monthKey(year, month) <= minMonth;
  const nextDisabled = monthKey(year, month) >= maxMonth;
  const stepMonth = (dir: -1 | 1) => {
    const d = new Date(Date.UTC(year, month + dir, 1));
    setCursor(monthKey(d.getUTCFullYear(), d.getUTCMonth()));
  };

  function pick(key: string) {
    // Begin a new selection when nothing is chosen or a full range already exists.
    if (!value.start || value.end) {
      onChange({ start: key, end: null });
    } else if (key < value.start) {
      onChange({ start: key, end: value.start });
    } else {
      onChange({ start: value.start, end: key }); // key === start → 1-day range
    }
  }

  const inRange = (key: string) =>
    !!value.start && !!value.end && key >= value.start && key <= value.end;
  const isEndpoint = (key: string) => key === value.start || key === value.end;

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label="Filter by date"
        style={{
          display: "inline-flex", alignItems: "center", gap: 7,
          background: value.start ? hex(t.accent, 0.16) : t.chip,
          color: value.start ? t.accent : t.text,
          border: `1px solid ${value.start ? hex(t.accent, 0.5) : hex(t.border, 0.85)}`,
          borderRadius: 8, padding: "7px 10px", fontSize: 12, fontWeight: 700,
          fontFamily: "inherit", cursor: "pointer",
        }}
      >
        <Calendar size={13} />
        {buttonLabel(value)}
        {value.start ? (
          <span
            role="button"
            aria-label="Clear date filter"
            onClick={(e) => { e.stopPropagation(); onChange({ start: null, end: null }); }}
            style={{ marginLeft: 1, fontSize: 14, lineHeight: 1, opacity: 0.8 }}
          >
            ×
          </span>
        ) : null}
      </button>

      {open ? (
        <div
          className="rise"
          style={{
            position: "absolute", top: 40, left: 0, zIndex: 90, width: 268,
            borderRadius: 12, border: `1px solid ${hex(t.border, 0.8)}`,
            background: t.surface, boxShadow: t.shadow, padding: 12,
          }}
        >
          {/* Month nav */}
          <div style={{ display: "flex", alignItems: "center", marginBottom: 10 }}>
            <NavBtn t={t} disabled={prevDisabled} onClick={() => stepMonth(-1)} flip />
            <span className="disp" style={{ flex: 1, textAlign: "center", fontSize: 13.5, fontWeight: 800 }}>
              {MONTHS[month]} {year}
            </span>
            <NavBtn t={t} disabled={nextDisabled} onClick={() => stepMonth(1)} />
          </div>

          {/* Weekday header */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 2, marginBottom: 4 }}>
            {WEEKDAYS.map((w, i) => (
              <span key={i} style={{ textAlign: "center", fontSize: 10, fontWeight: 800, color: t.textFaint }}>{w}</span>
            ))}
          </div>

          {/* Day grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 2 }}>
            {cells.map((d, i) => {
              if (d == null) return <span key={i} />;
              const key = dayKey(year, month, d);
              const has = availableDays.has(key);
              const endpoint = isEndpoint(key);
              const ranged = inRange(key) && !endpoint;
              const isToday = key === today;
              return (
                <button
                  key={i}
                  disabled={!has}
                  onClick={() => pick(key)}
                  aria-label={shortLabel(key)}
                  aria-pressed={endpoint}
                  style={{
                    height: 30, borderRadius: 7, border: "none", fontFamily: "inherit",
                    fontSize: 12, fontWeight: endpoint ? 800 : 600, cursor: has ? "pointer" : "default",
                    color: endpoint ? t.onAccent : !has ? t.textFaint : t.text,
                    background: endpoint ? t.accent : ranged ? hex(t.accent, 0.16) : "transparent",
                    opacity: has ? 1 : 0.35,
                    boxShadow: isToday && !endpoint ? `inset 0 0 0 1px ${hex(t.accent, 0.55)}` : "none",
                  }}
                >
                  {d}
                </button>
              );
            })}
          </div>

          {/* Footer */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 10 }}>
            <button
              onClick={() => onChange({ start: null, end: null })}
              disabled={!value.start}
              style={{ background: "transparent", border: "none", color: value.start ? t.textDim : t.textFaint, fontSize: 11.5, fontWeight: 700, cursor: value.start ? "pointer" : "default", padding: "4px 2px" }}
            >
              Clear
            </button>
            <span style={{ fontSize: 10.5, color: t.textFaint }}>
              {value.start && !value.end ? "Pick an end date for a range" : "Tap a day, or a second for a range"}
            </span>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function NavBtn({ t, disabled, onClick, flip }: { t: Theme; disabled: boolean; onClick: () => void; flip?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={flip ? "Previous month" : "Next month"}
      style={{
        display: "grid", placeItems: "center", width: 28, height: 28, borderRadius: 7,
        border: `1px solid ${hex(t.border, 0.7)}`, background: "transparent",
        color: disabled ? t.textFaint : t.textDim, cursor: disabled ? "default" : "pointer", opacity: disabled ? 0.4 : 1,
      }}
    >
      <span style={{ display: "inline-flex", transform: flip ? "rotate(180deg)" : "none" }}>
        <ChevronRight size={15} />
      </span>
    </button>
  );
}
