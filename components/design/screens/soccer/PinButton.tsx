"use client";

import { useTheme } from "@/components/design/theme";
import { hex } from "@/components/design/primitives";
import { Star } from "@/components/design/icons";
import { useAuth } from "@/hooks/useAuth";
import { useEntitlements } from "@/hooks/useEntitlements";

// Pin a match to the top of the board. Only shown to signed-in users; the pin
// persists on their profile and disappears when signed out.
export function PinButton({ matchId, size = 15 }: { matchId: string; size?: number }) {
  const { t } = useTheme();
  const { user, configured } = useAuth();
  const { pinnedMatch, setPin } = useEntitlements();
  if (!configured || !user) return null;

  const pinned = pinnedMatch === matchId;
  return (
    <button
      onClick={(e) => { e.stopPropagation(); setPin(pinned ? null : matchId); }}
      aria-label={pinned ? "Unpin match" : "Pin match"}
      title={pinned ? "Unpin" : "Pin to top"}
      style={{
        display: "grid", placeItems: "center", width: size + 11, height: size + 11,
        borderRadius: 8, border: "none", cursor: "pointer", flexShrink: 0,
        background: pinned ? hex(t.gold, 0.16) : "transparent", color: pinned ? t.gold : t.textFaint,
      }}
    >
      <Star size={size} color={pinned ? t.gold : t.textFaint} fill={pinned ? t.gold : "none"} />
    </button>
  );
}
