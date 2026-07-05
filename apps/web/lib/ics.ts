import type { ApiMatch } from "@liveleagues/core/api-shape";

// Build an .ics calendar event (90-minute window) for a match.
export function matchToICS(m: ApiMatch): string {
  const start = new Date(m.utc);
  const end = new Date(start.getTime() + 105 * 60_000);
  const title = m.home.real && m.away.real
    ? `${m.home.name} vs ${m.away.name}`
    : `${m.home.code} vs ${m.away.code}`;
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//WC2026 Live Board//EN",
    "BEGIN:VEVENT",
    `UID:wc2026-match-${m.n}@liveboard`,
    `DTSTAMP:${ics(new Date())}`,
    `DTSTART:${ics(start)}`,
    `DTEND:${ics(end)}`,
    `SUMMARY:${esc(`${title} — ${m.stage}`)} (World Cup 2026)`,
    `LOCATION:${esc(`${m.venue}, ${m.city}${m.country ? ", " + m.country : ""}`)}`,
    `DESCRIPTION:${esc(`FIFA World Cup 2026 · Match ${m.n} · ${m.stage}`)}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return lines.join("\r\n");
}

export function downloadICS(m: ApiMatch) {
  const blob = new Blob([matchToICS(m)], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `wc2026-match-${m.n}.ics`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function ics(d: Date): string {
  return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}
function esc(s: string): string {
  return s.replace(/[\\;,]/g, (c) => "\\" + c).replace(/\n/g, "\\n");
}
