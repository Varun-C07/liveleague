"use client";
import { Star } from "lucide-react";
import { useFavorites } from "@/hooks/useFavorites";

export function FavoritesStar({ sport, codes }: { sport: string; codes: string[] }) {
  const fav = useFavorites();
  // real team codes (2–4 chars); skips placeholders / empty sides
  const real = codes.filter((c) => c && c.trim().length >= 2 && c.trim().length <= 4);
  const anyFav = real.some((c) => fav.has(sport, c));
  if (!real.length) return null;

  return (
    <button
      className="flex-none p-1 rounded hover:bg-panel2 transition"
      aria-label={anyFav ? "Unstar teams" : "Star teams"}
      title={real.map((c) => (fav.has(sport, c) ? `★ ${c}` : `☆ ${c}`)).join("  ")}
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
        // toggle all teams in the match together to the same target state
        const target = !anyFav;
        for (const c of real) if (fav.has(sport, c) !== target) fav.toggle(sport, c);
      }}
    >
      <Star size={15} className={anyFav ? "text-gold fill-gold" : "text-dim"} />
    </button>
  );
}
