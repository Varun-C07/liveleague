"use client";
import { useEffect, useRef, useState } from "react";
import type { Game } from "@liveleague/core/sports/types";
import { usePrefs } from "@/hooks/usePrefs";

// Generic version of useGoalFlash: diffs scores between polls across any sport
// and returns the set of game ids that just changed (for a brief highlight).
export function useScoreFlash(games: Game[]): Set<string> {
  const prev = useRef<Map<string, string>>(new Map());
  const [flashed, setFlashed] = useState<Set<string>>(new Set());
  const { sound } = usePrefs();
  const firstRun = useRef(true);

  useEffect(() => {
    const changed: string[] = [];
    for (const g of games) {
      if (g.home.score == null || g.away.score == null) continue;
      const key = `${g.home.score}-${g.away.score}`;
      const before = prev.current.get(g.id);
      if (before !== undefined && before !== key && !firstRun.current) changed.push(g.id);
      prev.current.set(g.id, key);
    }
    if (changed.length && !firstRun.current) {
      setFlashed(new Set(changed));
      if (sound) playChime();
      const t = setTimeout(() => setFlashed(new Set()), 2400);
      return () => clearTimeout(t);
    }
    firstRun.current = false;
  }, [games, sound]);

  return flashed;
}

function playChime() {
  try {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AC();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.connect(g);
    g.connect(ctx.destination);
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
