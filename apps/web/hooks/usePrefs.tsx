"use client";
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { TzMode } from "@/lib/time";

type Prefs = {
  tz: TzMode;
  sound: boolean;
  setTz: (tz: TzMode) => void;
  setSound: (on: boolean) => void;
};

const Ctx = createContext<Prefs | null>(null);
const KEY = "wc26:prefs";

export function PrefsProvider({ children }: { children: ReactNode }) {
  const [tz, setTzState] = useState<TzMode>("ET");
  const [sound, setSoundState] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const p = JSON.parse(raw);
        if (p.tz) setTzState(p.tz);
        if (typeof p.sound === "boolean") setSoundState(p.sound);
      }
    } catch {}
  }, []);

  const value = useMemo<Prefs>(
    () => ({
      tz,
      sound,
      setTz: (v) => { setTzState(v); persist({ tz: v, sound }); },
      setSound: (v) => { setSoundState(v); persist({ tz, sound: v }); },
    }),
    [tz, sound],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

function persist(p: { tz: TzMode; sound: boolean }) {
  try { localStorage.setItem(KEY, JSON.stringify(p)); } catch {}
}

export function usePrefs(): Prefs {
  const c = useContext(Ctx);
  if (!c) throw new Error("usePrefs must be used within PrefsProvider");
  return c;
}
