"use client";
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { favKey } from "@/lib/favorites";

export { favKey };

type Favs = {
  has: (sport: string, code: string) => boolean;
  toggle: (sport: string, code: string) => void;
  keys: string[];
  ready: boolean;
};

const Ctx = createContext<Favs | null>(null);
const KEY = "ll:favorites";
const LEGACY_KEY = "wc26:favorites"; // soccer-only bare codes from the old build

function loadInitial(): Set<string> {
  const out = new Set<string>();
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      for (const k of JSON.parse(raw) as string[]) out.add(k);
    } else {
      // one-time migration: legacy bare codes were all soccer
      const legacy = localStorage.getItem(LEGACY_KEY);
      if (legacy) for (const c of JSON.parse(legacy) as string[]) out.add(favKey("soccer", c));
    }
  } catch {}
  return out;
}

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [set, setSet] = useState<Set<string>>(new Set());
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setSet(loadInitial());
    setReady(true);
  }, []);

  const value = useMemo<Favs>(
    () => ({
      ready,
      keys: [...set],
      has: (sport, code) => set.has(favKey(sport, code)),
      toggle: (sport, code) => {
        const k = favKey(sport, code);
        setSet((prev) => {
          const next = new Set(prev);
          if (next.has(k)) next.delete(k);
          else next.add(k);
          try { localStorage.setItem(KEY, JSON.stringify([...next])); } catch {}
          return next;
        });
      },
    }),
    [set, ready],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useFavorites(): Favs {
  const c = useContext(Ctx);
  if (!c) throw new Error("useFavorites must be used within FavoritesProvider");
  return c;
}
