"use client";

import { useMemo } from "react";
import { useTheme } from "@/components/design/theme";
import { card, hex, Crest, Tag, Pulse, SL } from "@/components/design/primitives";
import { Trophy, TrendingUp, Check, Lock } from "@/components/design/icons";
import { isLightColor, mapGroupOutlooks } from "@/components/design/map";
import { LiveMatch } from "@/components/design/screens/soccer/LiveMatch";
import { GroupCard } from "@/components/design/screens/soccer/GroupCard";
import { Predict, Paywall } from "@/components/design/screens/soccer/Predict";
import { Fixtures } from "@/components/design/screens/soccer/Fixtures";
import { FriendLeague } from "@/components/design/screens/soccer/FriendLeague";
import { useMatches, useStandings } from "@/hooks/useMatches";
import { useEntitlements } from "@/hooks/useEntitlements";
import { useMyPredictions } from "@/hooks/usePredictions";
import { useFavorites } from "@/hooks/useFavorites";
import { splitFavKey } from "@/lib/favorites";
import type { MatchesResponse, StandingsResponse } from "@/lib/api-shape";

const INK = "#14110A";

export function Soccer({
  initialMatches,
  initialStandings,
}: {
  initialMatches: MatchesResponse;
  initialStandings: StandingsResponse;
}) {
  const { t } = useTheme();
  const { data: mr } = useMatches(initialMatches);
  const { data: sr } = useStandings(initialStandings);
  const { hasPersonal } = useEntitlements();
  const { data: predictions } = useMyPredictions();
  const { keys } = useFavorites();

  const matches = useMemo(() => mr?.matches ?? [], [mr]);
  const groups = useMemo(() => sr?.groups ?? {}, [sr]);
  const outlooks = useMemo(() => mapGroupOutlooks(groups, matches), [groups, matches]);

  const favSet = useMemo(
    () => new Set(keys.map(splitFavKey).filter((k): k is { sport: string; code: string } => !!k && k.sport === "soccer").map((k) => k.code)),
    [keys],
  );
  const predByMatch = useMemo(
    () => new Map((predictions ?? []).map((p) => [p.match_id, p])),
    [predictions],
  );

  const live = matches.filter((m) => m.status === "live");
  const sched = matches.filter((m) => m.status === "sched");
  const ft = matches.filter((m) => m.status === "ft");
  const featured = live[0] ?? sched[0] ?? null;
  const goals = ft.reduce((acc, m) => acc + (m.homeScore ?? 0) + (m.awayScore ?? 0), 0);
  const upcoming = sched.slice(0, 4);
  const myResults = ft.filter((m) => predByMatch.has(`soccer-${m.n}`)).slice(0, 10);

  const stats: [string, string, boolean][] = [
    [`${ft.length} / ${matches.length}`, "Played", false],
    [`${goals}`, "Goals", false],
    [`${live.length}`, "Live now", live.length > 0],
    [`${sched.length}`, "Upcoming", false],
  ];

  return (
    <div className="rise">
      <div style={{ padding: "32px 0 20px" }}>
        <Tag color={t.gold} bg={hex(t.gold, 0.16)}>🇺🇸🇨🇦🇲🇽 World Cup 2026</Tag>
        <h1 className="disp h-page" style={{ fontWeight: 800, margin: "14px 0 18px" }}>World Cup // Live Board</h1>
        <div style={{ display: "flex", gap: 26, flexWrap: "wrap" }}>
          {stats.map((s, i) => (
            <div key={i}>
              <div className="disp num" style={{ fontSize: 32, fontWeight: 800, color: s[2] ? t.live : t.text, display: "flex", alignItems: "center", gap: 7 }}>
                {s[2] ? <Pulse color={t.live} size={8} /> : null}{s[0]}
              </div>
              <div style={{ fontSize: 11.5, color: t.textDim, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".05em" }}>{s[1]}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="mgrid">
        <div>
          <SL t={t}><Pulse color={t.live} size={7} /> {live.length > 0 ? "Live now" : "Featured"}</SL>
          <LiveMatch m={featured} />

          <div style={{ marginTop: 26 }}>
            <Fixtures matches={matches} favSet={favSet} />
          </div>

          {myResults.length > 0 && (
            <div style={{ marginTop: 26 }}>
              <SL t={t}><Check size={15} /> Your results</SL>
              <div style={{ display: "grid", gap: 8 }}>
                {myResults.map((m) => {
                  const p = predByMatch.get(`soccer-${m.n}`)!;
                  const pts = p.points;
                  const badge =
                    pts === 3 ? { txt: "Exact +3", bg: t.gold, fg: INK } :
                    pts === 1 ? { txt: "Outcome +1", bg: t.chip, fg: t.text } :
                    pts === 0 ? { txt: "Miss +0", bg: hex(t.lose, 0.16), fg: t.lose } :
                    { txt: "Pending", bg: t.chip, fg: t.textDim };
                  return (
                    <div key={m.n} style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 14px", ...card(t) }}>
                      <Crest code={m.home.code} color={m.home.color} dark={isLightColor(m.home.color)} size={26} />
                      <span className="disp num" style={{ fontSize: 19, fontWeight: 800, minWidth: 50, textAlign: "center" }}>{m.homeScore}–{m.awayScore}</span>
                      <Crest code={m.away.code} color={m.away.color} dark={isLightColor(m.away.color)} size={26} />
                      <span style={{ flex: 1, fontSize: 12, color: t.textDim }}>Picked {p.pred_home}–{p.pred_away}</span>
                      <span style={{ fontSize: 11.5, fontWeight: 800, padding: "4px 10px", borderRadius: 6, color: badge.fg, background: badge.bg }}>{badge.txt}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div style={{ marginTop: 26 }}>
            <SL t={t}><Trophy size={15} /> Group standings</SL>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 12 }}>
              {Object.entries(groups).map(([g, rows]) => (
                <GroupCard key={g} g={g} rows={rows} favSet={favSet} outlook={outlooks[g]} />
              ))}
            </div>
          </div>
        </div>

        <div className="rail">
          <FriendLeague />
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 10 }}>
              <TrendingUp size={16} color={t.accent} />
              <span className="cond" style={{ fontWeight: 700, fontSize: 16, flex: 1 }}>Predict · next 4</span>
              {!hasPersonal && <Lock size={13} color={t.textFaint} />}
            </div>
            {!hasPersonal && <Paywall />}
            {upcoming.length === 0 ? (
              <div style={{ padding: "12px 14px", fontSize: 12.5, color: t.textDim, ...card(t) }}>No upcoming matches to predict right now.</div>
            ) : (
              <div style={{ display: "grid", gap: 8, marginTop: hasPersonal ? 0 : 10 }}>
                {upcoming.map((m) => (
                  <Predict key={m.n} m={m} existing={predByMatch.get(`soccer-${m.n}`)} canPredict={hasPersonal} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
