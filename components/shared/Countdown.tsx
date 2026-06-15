"use client";
import { useEffect, useState } from "react";
import { useMounted } from "@/hooks/useMounted";

// Live countdown to a UTC instant. Accent-colored so it themes per sport.
// `compact` drops to a "2d 04h" / "12m 30s" form for tight spaces (cards).
// `live` is the text shown once the clock hits zero (e.g. "KICK OFF").
export function Countdown({
  utc,
  compact = false,
  live = "KICK OFF",
}: {
  utc: string;
  compact?: boolean;
  live?: string;
}) {
  const [now, setNow] = useState(() => Date.now());
  const mounted = useMounted();
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  // Clock-dependent — render a stable placeholder until mounted to avoid
  // an SSR/hydration mismatch.
  if (!mounted) return <span className="text-dim">—</span>;

  const diff = new Date(utc).getTime() - now;
  if (diff <= 0) {
    return (
      <span className="font-bold" style={{ color: "var(--accent)" }}>
        {live}
      </span>
    );
  }
  const d = Math.floor(diff / 864e5);
  const h = Math.floor((diff % 864e5) / 36e5);
  const m = Math.floor((diff % 36e5) / 6e4);
  const s = Math.floor((diff % 6e4) / 1e3);
  const pad = (n: number) => String(n).padStart(2, "0");
  const c = { color: "var(--accent)" };

  if (compact) {
    // show the two most significant units
    const parts =
      d > 0
        ? [
            [d, "d"],
            [h, "h"],
          ]
        : h > 0
          ? [
              [h, "h"],
              [m, "m"],
            ]
          : [
              [m, "m"],
              [s, "s"],
            ];
    return (
      <span>
        {parts.map(([v, u], i) => (
          <span key={i}>
            <b style={c}>{i === 0 ? v : pad(v as number)}</b>
            {u}
            {i === 0 ? " " : ""}
          </span>
        ))}
      </span>
    );
  }

  return (
    <span>
      <b style={c}>{d}</b>d <b style={c}>{pad(h)}</b>h <b style={c}>{pad(m)}</b>m <b style={c}>{pad(s)}</b>s
    </span>
  );
}
