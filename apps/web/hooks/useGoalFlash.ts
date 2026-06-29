"use client";
import { useEffect, useRef, useState } from "react";
import type { ApiMatch } from "@liveleague/core/api-shape";
import { usePrefs } from "@/hooks/usePrefs";

// Diffs scores between polls. Returns the set of match numbers that just
// changed (for a brief highlight) and announces goals to a live region.
export function useGoalFlash(matches: ApiMatch[]) {
  const prev = useRef<Map<number, string>>(new Map());
  const [flashed, setFlashed] = useState<Set<number>>(new Set());
  const [announce, setAnnounce] = useState("");
  const { sound } = usePrefs();
  const firstRun = useRef(true);

  useEffect(() => {
    const changed: number[] = [];
    const messages: string[] = [];
    for (const m of matches) {
      if (m.homeScore == null || m.awayScore == null) continue;
      const key = `${m.homeScore}-${m.awayScore}`;
      const before = prev.current.get(m.n);
      if (before !== undefined && before !== key && !firstRun.current) {
        changed.push(m.n);
        messages.push(`Goal: ${m.home.name} ${m.homeScore}, ${m.away.name} ${m.awayScore}`);
      }
      prev.current.set(m.n, key);
    }

    if (changed.length && !firstRun.current) {
      setFlashed(new Set(changed));
      setAnnounce(messages.join(". "));
      if (sound) playChime();
      const t = setTimeout(() => setFlashed(new Set()), 2400);
      return () => clearTimeout(t);
    }
    firstRun.current = false;
  }, [matches, sound]);

  return { flashed, announce };
}

function playChime() {
  try {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AC();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.connect(g); g.connect(ctx.destination);
    o.type = "triangle";
    o.frequency.setValueAtTime(660, ctx.currentTime);
    o.frequency.setValueAtTime(880, ctx.currentTime + 0.12);
    g.gain.setValueAtTime(0.0001, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.18, ctx.currentTime + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.4);
    o.start();
    o.stop(ctx.currentTime + 0.42);
  } catch {}
}
