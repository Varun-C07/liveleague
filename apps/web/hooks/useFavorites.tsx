"use client";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { favKey, splitFavKey } from "@liveleagues/core/favorites";
import { useAuth } from "@/hooks/useAuth";

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

function loadLocal(): Set<string> {
  const out = new Set<string>();
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      for (const k of JSON.parse(raw) as string[]) out.add(k);
    } else {
      // one-time migration: legacy bare codes were all soccer
      const legacy = localStorage.getItem(LEGACY_KEY);
      if (legacy)
        for (const c of JSON.parse(legacy) as string[]) out.add(favKey("soccer", c));
    }
  } catch {}
  return out;
}

function saveLocal(set: Set<string>) {
  try {
    localStorage.setItem(KEY, JSON.stringify([...set]));
  } catch {}
}

async function fetchFollows(): Promise<string[]> {
  const res = await fetch("/api/me/follows");
  if (!res.ok) throw new Error("follows_failed");
  const data = (await res.json()) as { keys: string[] };
  return data.keys ?? [];
}

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const { user, configured } = useAuth();
  const qc = useQueryClient();
  const loggedIn = configured && !!user;
  const userId = user?.id ?? null;

  // localStorage source (logged out, and pre-hydration cache).
  const [local, setLocal] = useState<Set<string>>(new Set());
  const [ready, setReady] = useState(false);
  useEffect(() => {
    setLocal(loadLocal());
    setReady(true);
  }, []);

  // DB source (logged in).
  const follows = useQuery({
    queryKey: ["follows", userId],
    queryFn: fetchFollows,
    enabled: loggedIn,
    staleTime: 30_000,
  });

  // One-time merge of localStorage favorites into the account on first login.
  const migrating = useRef(false);
  useEffect(() => {
    if (!loggedIn || !userId || !ready || migrating.current) return;
    const sentinel = `ll:favorites:migrated:${userId}`;
    if (localStorage.getItem(sentinel)) return;
    migrating.current = true;
    const localKeys = [...loadLocal()];
    (async () => {
      for (const k of localKeys) {
        const parts = splitFavKey(k);
        if (!parts) continue;
        await fetch("/api/me/follows", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sport: parts.sport, code: parts.code }),
        }).catch(() => {});
      }
      localStorage.setItem(sentinel, "1");
      qc.invalidateQueries({ queryKey: ["follows", userId] });
      migrating.current = false;
    })();
  }, [loggedIn, userId, ready, qc]);

  const value = useMemo<Favs>(() => {
    const dbKeys = follows.data ?? [];
    const active = loggedIn ? new Set(dbKeys) : local;

    function toggleLocal(sport: string, code: string) {
      const k = favKey(sport, code);
      setLocal((prev) => {
        const next = new Set(prev);
        if (next.has(k)) next.delete(k);
        else next.add(k);
        saveLocal(next);
        return next;
      });
    }

    function toggleDb(sport: string, code: string) {
      if (!userId) return;
      const k = favKey(sport, code);
      const has = (follows.data ?? []).includes(k);
      // optimistic
      qc.setQueryData<string[]>(["follows", userId], (old = []) =>
        has ? old.filter((x) => x !== k) : [...old, k],
      );
      const done = () => qc.invalidateQueries({ queryKey: ["follows", userId] });
      if (has) {
        fetch(`/api/me/follows?sport=${encodeURIComponent(sport)}&code=${encodeURIComponent(code)}`, {
          method: "DELETE",
        })
          .catch(() => {})
          .finally(done);
      } else {
        fetch("/api/me/follows", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sport, code }),
        })
          .then((r) => {
            if (!r.ok) done(); // revert (e.g. 4-cap reached)
          })
          .catch(done);
      }
    }

    return {
      ready: loggedIn ? !follows.isLoading : ready,
      keys: [...active],
      has: (sport, code) => active.has(favKey(sport, code)),
      toggle: (sport, code) =>
        loggedIn ? toggleDb(sport, code) : toggleLocal(sport, code),
    };
  }, [loggedIn, userId, local, ready, follows.data, follows.isLoading, qc]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useFavorites(): Favs {
  const c = useContext(Ctx);
  if (!c) throw new Error("useFavorites must be used within FavoritesProvider");
  return c;
}
