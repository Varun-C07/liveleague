"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
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

// Date / range filter. Opens a centered calendar modal (over a dimmed backdrop, via
// a portal) so it never clips on mobile or fights the page underneath. Only days
// that have games are selectable; pick one day or click a second for a range.
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

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
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
        <CalendarModal
          t={t}
          availableDays={availableDays}
          value={value}
          onChange={onChange}
          today={today}
          onClose={() => setOpen(false)}
        />
      ) : null}
    </>
  );
}

function CalendarModal({
  t,
  availableDays,
  value,
  onChange,
  today,
  onClose,
}: {
  t: Theme;
  availableDays: Set<string>;
  value: DateRange;
  onChange: (v: DateRange) => void;
  today: string;
  onClose: () => void;
}) {
  // Month bounds derived from the days that have games.
  const { minMonth, maxMonth } = useMemo(() => {
    const months = [...availableDays].map((d) => d.slice(0, 7)).sort();
    return { minMonth: months[0] ?? today.slice(0, 7), maxMonth: months[months.length - 1] ?? today.slice(0, 7) };
  }, [availableDays, today]);

  const initKey = (value.start ?? today).slice(0, 7);
  const [cursor, setCursor] = useState<string>(
    initKey >= minMonth && initKey <= maxMonth ? initKey : minMonth,
  );
  const [cy, cm] = cursor.split("-").map(Number);
  const year = cy;
  const month = cm - 1; // 0-indexed

  // Esc to close + lock background scroll while the modal is open.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

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
    if (!value.start || value.end) {
      onChange({ start: key, end: null });
    } else if (key < value.start) {
      onChange({ start: key, end: value.start });
    } else {
      onChange({ start: value.start, end: key });
    }
  }

  const inRange = (key: string) =>
    !!value.start && !!value.end && key >= value.start && key <= value.end;
  const isEndpoint = (key: string) => key === value.start || key === value.end;

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Filter by date"
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 120,
        background: hex("#000", 0.62), backdropFilter: "blur(2px)",
        display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
      }}
    >
      <div
        className="rise"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "min(92vw, 320px)", maxHeight: "90vh", overflowY: "auto",
          borderRadius: 14, border: `1px solid ${hex(t.border, 0.8)}`,
          background: t.surface, boxShadow: t.shadow, padding: 16,
        }}
      >
        {/* Header: title + close */}
        <div style={{ display: "flex", alignItems: "center", marginBottom: 12 }}>
          <span className="disp" style={{ flex: 1, fontSize: 14, fontWeight: 800 }}>Filter by date</span>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{ background: "transparent", border: "none", color: t.textDim, fontSize: 20, lineHeight: 1, cursor: "pointer", padding: "0 2px" }}
          >
            ×
          </button>
        </div>

        {/* Month nav */}
        <div style={{ display: "flex", alignItems: "center", marginBottom: 10 }}>
          <NavBtn t={t} disabled={prevDisabled} onClick={() => stepMonth(-1)} flip />
          <span className="disp" style={{ flex: 1, textAlign: "center", fontSize: 13.5, fontWeight: 800 }}>
            {MONTHS[month]} {year}
          </span>
          <NavBtn t={t} disabled={nextDisabled} onClick={() => stepMonth(1)} />
        </div>

        {/* Weekday header */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 3, marginBottom: 4 }}>
          {WEEKDAYS.map((w, i) => (
            <span key={i} style={{ textAlign: "center", fontSize: 10, fontWeight: 800, color: t.textFaint }}>{w}</span>
          ))}
        </div>

        {/* Day grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 3 }}>
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
                  height: 36, borderRadius: 8, border: "none", fontFamily: "inherit",
                  fontSize: 13, fontWeight: endpoint ? 800 : 600, cursor: has ? "pointer" : "default",
                  color: endpoint ? t.onAccent : !has ? t.textFaint : t.text,
                  background: endpoint ? t.accent : ranged ? hex(t.accent, 0.16) : "transparent",
                  opacity: has ? 1 : 0.3,
                  boxShadow: isToday && !endpoint ? `inset 0 0 0 1px ${hex(t.accent, 0.55)}` : "none",
                }}
              >
                {d}
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 12 }}>
          <button
            onClick={() => onChange({ start: null, end: null })}
            disabled={!value.start}
            style={{ background: "transparent", border: `1px solid ${hex(t.border, 0.8)}`, borderRadius: 8, color: value.start ? t.textDim : t.textFaint, fontSize: 12, fontWeight: 700, cursor: value.start ? "pointer" : "default", padding: "8px 12px" }}
          >
            Clear
          </button>
          <span style={{ flex: 1, fontSize: 10.5, color: t.textFaint, textAlign: "center" }}>
            {value.start && !value.end ? "Pick an end date for a range" : "Tap a day, or a second for a range"}
          </span>
          <button
            onClick={onClose}
            style={{ background: t.accent, border: "none", borderRadius: 8, color: t.onAccent, fontSize: 12, fontWeight: 800, cursor: "pointer", padding: "8px 14px" }}
          >
            Done
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function NavBtn({ t, disabled, onClick, flip }: { t: Theme; disabled: boolean; onClick: () => void; flip?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={flip ? "Previous month" : "Next month"}
      style={{
        display: "grid", placeItems: "center", width: 30, height: 30, borderRadius: 8,
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
