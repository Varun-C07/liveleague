"use client";
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

type Favs = {
  has: (code: string) => boolean;
  toggle: (code: string) => void;
  list: string[];
  ready: boolean;
};

const Ctx = createContext<Favs | null>(null);
const KEY = "wc26:favorites";

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [set, setSet] = useState<Set<string>>(new Set());
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setSet(new Set(JSON.parse(raw)));
    } catch {}
    setReady(true);
  }, []);

  const value = useMemo<Favs>(
    () => ({
      ready,
      list: [...set],
      has: (code) => set.has(code),
      toggle: (code) => {
        setSet((prev) => {
          const next = new Set(prev);
          if (next.has(code)) next.delete(code);
          else next.add(code);
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
