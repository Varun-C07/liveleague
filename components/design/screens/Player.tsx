"use client";

import Link from "next/link";
import { useTheme, type Theme } from "@/components/design/theme";
import { card, hex, Crest, SL } from "@/components/design/primitives";
import { Lock } from "@/components/design/icons";
import { isLightColor } from "@/components/design/map";
import { LockedPanel } from "@/components/design/LockedPanel";
import { PAYWALL_ENABLED, SHOW_PLACEHOLDERS } from "@/lib/gating";
import { PlayerTags } from "@/components/design/PlayerTags";
import { getPlayer, playerAnalysis } from "@/components/design/screens/player/playerData";
import { hasRealSquad } from "@/components/design/screens/team/teamData";
import { TEAMS } from "@/data/teams";

const POS: Record<string, string> = { GK: "Goalkeeper", DEF: "Defender", MID: "Midfielder", FWD: "Forward" };

export function Player({ id, code }: { id: string; code: string }) {
  const { t } = useTheme();
  const profile = getPlayer(id);
  const team = TEAMS[code as keyof typeof TEAMS];

  // Generic (non-verified) players are invented — don't surface them as real.
  if (!profile || !team || (!hasRealSquad(code) && !SHOW_PLACEHOLDERS)) {
    return (
      <div className="rise" style={{ maxWidth: 720, margin: "0 auto", paddingTop: 18 }}>
        <BackLink t={t} code={code} name={team?.name ?? "fixtures"} />
        <div style={{ ...card(t), padding: 20, marginTop: 14 }}>
          <span style={{ color: t.textDim }}>Player not found.</span>
        </div>
      </div>
    );
  }

  const { player, club, stats } = profile;
  const analysis = playerAnalysis(player);
  const gk = player.isGoalkeeper || player.pos === "GK";

  const statBlocks: { label: string; value: number; color?: string }[] = gk
    ? [
        { label: "Apps", value: stats.apps },
        { label: "Mins", value: stats.minutes },
        { label: "Saves", value: stats.saves },
        { label: "Clean sheets", value: stats.cleanSheets },
        { label: "Yellow", value: stats.yellow, color: t.gold },
        { label: "Red", value: stats.red, color: t.lose },
      ]
    : [
        { label: "Apps", value: stats.apps },
        { label: "Mins", value: stats.minutes },
        { label: "Goals", value: stats.goals },
        { label: "Assists", value: stats.assists },
        { label: "Yellow", value: stats.yellow, color: t.gold },
        { label: "Red", value: stats.red, color: t.lose },
      ];

  return (
    <div className="rise" style={{ maxWidth: 720, margin: "0 auto", paddingTop: 18 }}>
      <BackLink t={t} code={code} name={team.name} />

      {/* HEADER — free */}
      <div style={{ position: "relative", overflow: "hidden", marginTop: 14, ...card(t) }}>
        <div style={{ position: "absolute", inset: 0, background: `linear-gradient(120deg, ${hex(team.color, 0.4)}, transparent 60%)` }} />
        <div style={{ position: "relative", padding: "22px 22px", display: "flex", alignItems: "center", gap: 18 }}>
          <Avatar t={t} number={player.number} name={player.name} color={team.color} />
          <div style={{ minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
              <span className="disp" style={{ fontSize: "clamp(24px,5.5vw,32px)", fontWeight: 800, lineHeight: 1 }}>{player.name}</span>
              <span className="disp num" style={{ fontSize: 18, fontWeight: 800, color: t.textDim }}>#{player.number}</span>
              <PlayerTags t={t} captain={player.isCaptain} goalkeeper={player.isGoalkeeper} size={10.5} />
            </div>
            <div style={{ fontSize: 12.5, color: t.textDim, fontWeight: 600, marginTop: 7 }}>
              {/* age + club are seeded placeholders — show only the real position
                  unless placeholders are explicitly enabled. */}
              {SHOW_PLACEHOLDERS ? `${POS[player.pos] ?? player.pos} · ${player.age} yrs · ${club}` : (POS[player.pos] ?? player.pos)}
            </div>
            <Link href={`/soccer/team/${code}`} className="ll-team-link" style={{ display: "inline-flex", alignItems: "center", gap: 7, marginTop: 9, textDecoration: "none", color: t.text }}>
              <Crest code={code} color={team.color} dark={isLightColor(team.color)} size={20} />
              <span className="cond" style={{ fontSize: 13, fontWeight: 700 }}>{team.name}</span>
            </Link>
          </div>
        </div>
      </div>

      {/* TOURNAMENT STATS — seeded placeholders (no free per-player source), hidden
          unless explicitly enabled so we don't present invented numbers as real. */}
      {SHOW_PLACEHOLDERS ? (
        <div style={{ marginTop: 26 }}>
          <SL t={t}>Tournament</SL>
          <div style={{ ...card(t), padding: "16px 14px", display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(86px,1fr))", gap: 14 }}>
            {statBlocks.map((s) => (
              <div key={s.label} style={{ textAlign: "center" }}>
                <div className="disp num" style={{ fontSize: 26, fontWeight: 800, color: s.color && s.value > 0 ? s.color : t.text, lineHeight: 1 }}>{s.value}</div>
                <div style={{ fontSize: 10.5, color: t.textDim, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em", marginTop: 5 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* PAID — player analysis behind glass. Hidden while the paywall is off:
          these ratings are placeholder (no free source), so we don't show them as
          real — the panel returns if the paywall is re-enabled. */}
      {PAYWALL_ENABLED ? (
        <div style={{ marginTop: 26 }}>
          <SL t={t}>
            Analysis
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 10.5, fontWeight: 800, letterSpacing: ".08em", textTransform: "uppercase", color: t.gold, background: hex(t.gold, 0.12), border: `1px solid ${hex(t.gold, 0.3)}`, borderRadius: 999, padding: "3px 9px" }}>
              <Lock size={11} /> Bundle
            </span>
          </SL>
          <LockedPanel t={t} title={`${player.name} · analysis`} copy="Form rating, influence heatmap and projected impact are part of the $5 World Cup Bundle.">
            <div style={{ display: "grid", gap: 10 }}>
              <Bar t={t} label="Form rating" value={analysis.rating.toFixed(1)} pct={analysis.rating * 10} color={t.win} />
              <Bar t={t} label="Influence" value={`${analysis.influence}%`} pct={analysis.influence} color={t.accent} />
              <Bar t={t} label="Projected impact" value={analysis.impact} />
              <div style={{ fontSize: 12.5, color: t.textDim, marginTop: 2 }}>{analysis.note}</div>
            </div>
          </LockedPanel>
        </div>
      ) : null}
    </div>
  );
}

function BackLink({ t, code, name }: { t: Theme; code: string; name: string }) {
  return (
    <Link href={`/soccer/team/${code}`} className="navpill" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12.5, fontWeight: 700, color: t.textDim, textDecoration: "none", padding: "5px 10px 5px 6px", borderRadius: 8 }}>
      <span style={{ fontSize: 15, lineHeight: 1 }}>←</span> Back to {name}
    </Link>
  );
}

// Default face: the shirt number on the team colour (initials if no number).
// No photo load, no broken-image icon.
function Avatar({ t, number, name, color }: { t: Theme; number: number; name: string; color: string }) {
  const initials = name
    .split(/\s+/)
    .map((s) => s.replace(/[^A-Za-z]/g, "")[0])
    .filter(Boolean)
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const label = Number.isFinite(number) && number > 0 ? String(number) : initials || "?";
  return (
    <div style={{ width: 72, height: 72, borderRadius: "50%", display: "grid", placeItems: "center", flexShrink: 0, background: `linear-gradient(150deg, ${hex(color, 0.55)}, ${t.surfaceHi})`, border: `1px solid ${hex(t.border, 0.8)}` }}>
      <span className="disp num" style={{ fontSize: 28, fontWeight: 800, color: t.text }}>{label}</span>
    </div>
  );
}

function Bar({ t, label, value, pct, color }: { t: Theme; label: string; value: string; pct?: number; color?: string }) {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, marginBottom: pct != null ? 5 : 0 }}>
        <span style={{ color: t.textDim, fontWeight: 600 }}>{label}</span>
        <span className="num" style={{ fontWeight: 800 }}>{value}</span>
      </div>
      {pct != null ? (
        <div style={{ height: 7, background: t.chip, borderRadius: 4, overflow: "hidden" }}>
          <div style={{ width: `${Math.min(100, pct)}%`, height: "100%", background: color ?? t.accent, borderRadius: 4 }} />
        </div>
      ) : null}
    </div>
  );
}
