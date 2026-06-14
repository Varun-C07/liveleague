"use client";
import { Star } from "lucide-react";
import { useFavorites } from "@/hooks/useFavorites";

export function FavoritesStar({ codes }: { codes: string[] }) {
  const fav = useFavorites();
  const real = codes.filter((c) => c && c.length === 3);
  const anyFav = real.some((c) => fav.has(c));
  if (!real.length) return null;

  return (
    <button
      className="flex-none p-1 rounded hover:bg-panel2 transition"
      aria-label={anyFav ? "Unstar teams" : "Star teams"}
      title={real.map((c) => (fav.has(c) ? `★ ${c}` : `☆ ${c}`)).join("  ")}
      onClick={(e) => {
        e.stopPropagation();
        // toggle all teams in the match together to the same target state
        const target = !anyFav;
        for (const c of real) if (fav.has(c) !== target) fav.toggle(c);
      }}
    >
      <Star size={15} className={anyFav ? "text-gold fill-gold" : "text-dim"} />
    </button>
  );
}
