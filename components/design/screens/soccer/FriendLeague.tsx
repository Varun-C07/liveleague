"use client";

import Link from "next/link";
import { useTheme } from "@/components/design/theme";
import { card, hex } from "@/components/design/primitives";
import { Users, Crown, Share2 } from "@/components/design/icons";
import { useMyLeagues } from "@/hooks/useLeagues";

// Friend-league rail card, wired to the user's real leagues. Free users see a
// join/create CTA (the conversion funnel); members see their leagues.
export function FriendLeague() {
  const { t } = useTheme();
  const { data: leagues } = useMyLeagues();
  const list = leagues ?? [];

  return (
    <div style={{ padding: 16, marginBottom: 14, ...card(t) }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span className="cond" style={{ fontWeight: 700, fontSize: 16, display: "flex", alignItems: "center", gap: 7 }}>
          <Users size={16} color={t.accent} />Friend leagues
        </span>
        <Link href="/leagues" style={{ fontSize: 11, color: t.accent, textDecoration: "none", fontWeight: 700 }}>Manage</Link>
      </div>

      {list.length === 0 ? (
        <div style={{ marginTop: 11 }}>
          <p style={{ fontSize: 12.5, color: t.textDim, lineHeight: 1.6, margin: "0 0 12px" }}>
            Join your friends&apos; league and watch the leaderboard free. Predict to climb it — that needs the bundle.
          </p>
          <Link href="/leagues" style={{ textDecoration: "none" }}>
            <span style={{ display: "block", textAlign: "center", width: "100%", padding: 10, borderRadius: 9, border: "none", background: t.accent, color: t.onAccent, fontWeight: 800, fontSize: 13, cursor: "pointer" }}>Join or create a league</span>
          </Link>
        </div>
      ) : (
        <div style={{ marginTop: 12 }}>
          {list.map((l, i) => (
            <Link key={l.id} href={`/leagues/${l.id}`} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderTop: i ? `1px solid ${hex(t.border, 0.5)}` : "none", textDecoration: "none", color: t.text }}>
              <div style={{ width: 26, height: 26, borderRadius: "50%", background: l.isOwner ? t.accent : t.chip, color: l.isOwner ? t.onAccent : t.textDim, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800 }}>
                {l.name.charAt(0).toUpperCase()}
              </div>
              <span style={{ flex: 1, fontSize: 13, fontWeight: 600 }}>
                {l.name}
                {l.isOwner ? <Crown size={12} style={{ marginLeft: 5, verticalAlign: -1, color: t.gold }} /> : null}
              </span>
              <span className="num" style={{ fontSize: 14, fontWeight: 800 }}>{l.myPoints}</span>
            </Link>
          ))}
          <Link href="/leagues" style={{ textDecoration: "none" }}>
            <span style={{ display: "flex", width: "100%", marginTop: 12, padding: 9, borderRadius: 9, border: "none", background: t.chip, color: t.text, fontWeight: 700, fontSize: 12.5, cursor: "pointer", alignItems: "center", justifyContent: "center", gap: 6 }}>
              <Share2 size={13} />New league
            </span>
          </Link>
        </div>
      )}
    </div>
  );
}
