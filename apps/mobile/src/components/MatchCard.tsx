import { View, Text, Pressable, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import type { Game } from "@liveleagues/core/sports/types";
import type { ApiMatch } from "@liveleagues/core/api-shape";
import { colors, fonts } from "../theme/theme";

// One shared match card for Home + World Cup. Flags are optional (emoji text, so
// never a broken image) — Home opts out to stay identical; World Cup opts in.
export type MatchCardData = {
  id: string;
  label: string;
  status: "sched" | "live" | "final";
  homeCode: string;
  homeFlag?: string | null;
  homeScore: number | null;
  awayCode: string;
  awayFlag?: string | null;
  awayScore: number | null;
  utc: string;
  minute?: string | null;
  venue?: string | null;
  round?: number | null; // F1: present -> renders the race layout (no teams/score)
};

const venueOf = (venue?: string, city?: string) => [venue, city].filter(Boolean).join(", ") || null;

// Map the overview `Game` shape (topGames) → card data. `showFlags` keeps Home
// flag-free (unchanged) while World Cup's featured strip shows flags.
export function gameToCard(g: Game, showFlags = false): MatchCardData {
  return {
    id: g.id,
    label: g.label,
    status: g.status,
    homeCode: g.home.code || g.home.name,
    homeFlag: showFlags ? g.home.logo : null,
    homeScore: g.home.score,
    awayCode: g.away.code || g.away.name,
    awayFlag: showFlags ? g.away.logo : null,
    awayScore: g.away.score,
    utc: g.utc,
    minute: g.extra.sport === "soccer" ? g.extra.minute : null,
    venue: venueOf(g.venue, g.city),
  };
}

// Map the full-fixtures `ApiMatch` shape (/api/soccer) → card data (with flags).
export function matchToCard(m: ApiMatch): MatchCardData {
  return {
    id: `soccer-${m.n}`,
    label: m.stage,
    status: m.status === "ft" ? "final" : m.status,
    homeCode: m.home.code || m.home.name,
    homeFlag: m.home.flag,
    homeScore: m.homeScore,
    awayCode: m.away.code || m.away.name,
    awayFlag: m.away.flag,
    awayScore: m.awayScore,
    utc: m.utc,
    minute: m.minute,
    venue: venueOf(m.venue, m.city),
  };
}

// Map an F1 race `Game` → card data. `round` flips MatchCard into race layout;
// `label` is the circuit/GP, `venue` the location (no teams/score, no flags).
export function raceToCard(g: Game): MatchCardData {
  return {
    id: g.id,
    label: g.venue || g.label,
    status: g.status,
    homeCode: "",
    homeScore: null,
    awayCode: "",
    awayScore: null,
    utc: g.utc,
    minute: null,
    venue: venueOf(g.city, g.country),
    round: g.extra.sport === "f1" ? g.extra.round : null,
  };
}

export function MatchCard({ m, hero, accent, pressable }: { m: MatchCardData; hero?: boolean; accent?: string; pressable?: boolean }) {
  const router = useRouter();
  const live = m.status === "live";
  const ft = m.status === "final";
  const score = m.homeScore == null ? "vs" : `${m.homeScore}–${m.awayScore}`;
  const status = live ? m.minute ?? "LIVE" : ft ? "FT" : kickoff(m.utc);
  const home = m.homeFlag ? `${m.homeFlag} ${m.homeCode}` : m.homeCode;
  const away = m.awayFlag ? `${m.awayCode} ${m.awayFlag}` : m.awayCode;

  const content = (() => {
  // F1 race layout: leading round number (red), circuit + location + date/time.
  if (m.round != null) {
    const raceAccent = accent ?? colors.f1;
    if (hero) {
      return (
        <View style={s.heroCard}>
          <View style={[s.heroStrip, { backgroundColor: raceAccent }]} />
          <View style={s.heroBody}>
            <View style={s.raceHeroTop}>
              <Text style={[s.raceHeroRound, { color: raceAccent }]}>{`R${m.round}`}</Text>
              <Text style={s.raceHeroName} numberOfLines={1}>{m.label}</Text>
            </View>
            <View style={s.heroFooter}>
              {live ? <View style={s.liveDot} /> : null}
              <Text style={[s.heroStatus, live && { color: colors.live }]}>
                {live ? "LIVE" : `${dateShort(m.utc)} · ${kickoff(m.utc)}`}
              </Text>
              {m.venue ? <Text style={s.heroVenue} numberOfLines={1}>· {m.venue}</Text> : null}
            </View>
          </View>
        </View>
      );
    }
    return (
      <View style={[s.card, s.row]}>
        <Text style={[s.raceRound, { color: raceAccent }]}>{`R${m.round}`}</Text>
        <View style={{ flex: 1 }}>
          <Text style={s.raceName} numberOfLines={1}>{m.label}</Text>
          {m.venue ? <Text style={s.raceLoc} numberOfLines={1}>{m.venue}</Text> : null}
        </View>
        <View style={s.statusWrap}>
          {live ? <View style={s.liveDot} /> : null}
          <Text style={[s.status, live && { color: colors.live }]}>{live ? "LIVE" : dateShort(m.utc)}</Text>
        </View>
      </View>
    );
  }

  // Larger hero variant: sport-accent top strip, bigger teams/score, venue line.
  if (hero) {
    return (
      <View style={s.heroCard}>
        <View style={[s.heroStrip, { backgroundColor: accent ?? colors.accent }]} />
        <View style={s.heroBody}>
          <Text style={s.eyebrow} numberOfLines={1}>{m.label}</Text>
          <View style={s.heroTeams}>
            <Text style={s.heroTeam} numberOfLines={1}>{home}</Text>
            <Text style={[s.heroScore, live && { color: colors.live }]}>{score}</Text>
            <Text style={[s.heroTeam, { textAlign: "right" }]} numberOfLines={1}>{away}</Text>
          </View>
          <View style={s.heroFooter}>
            {live ? <View style={s.liveDot} /> : null}
            <Text style={[s.heroStatus, live && { color: colors.live }]}>{status}</Text>
            {m.venue ? <Text style={s.heroVenue} numberOfLines={1}>· {m.venue}</Text> : null}
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={[s.card, s.row]}>
      <View style={{ flex: 1 }}>
        <Text style={s.eyebrow} numberOfLines={1}>{m.label}</Text>
        <View style={s.teams}>
          <Text style={s.team} numberOfLines={1}>{home}</Text>
          <Text style={[s.score, live && { color: colors.live }]}>{score}</Text>
          <Text style={[s.team, { textAlign: "right" }]} numberOfLines={1}>{away}</Text>
        </View>
      </View>
      <View style={s.statusWrap}>
        {live ? <View style={s.liveDot} /> : null}
        <Text style={[s.status, live && { color: colors.live }]}>{status}</Text>
      </View>
    </View>
  );
  })();

  if (!pressable) return content;
  return (
    <Pressable
      onPress={() =>
        router.push(
          m.round != null
            ? { pathname: "/race/[id]", params: { id: m.id } }
            : { pathname: "/match/[id]", params: { id: m.id } },
        )
      }
      style={({ pressed }) => (pressed ? { opacity: 0.85 } : null)}
    >
      {content}
    </Pressable>
  );
}

function kickoff(utc: string): string {
  try {
    return new Date(utc).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  } catch {
    return "";
  }
}

function dateShort(utc: string): string {
  try {
    return new Date(utc).toLocaleDateString("en-US", { month: "short", day: "numeric" }).toUpperCase();
  } catch {
    return "";
  }
}

const s = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: StyleSheet.hairlineWidth, borderRadius: 14, padding: 13, marginBottom: 8 },
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  eyebrow: { color: colors.textFaint, fontSize: 10, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 7 },
  teams: { flexDirection: "row", alignItems: "center", gap: 10 },
  team: { color: colors.text, fontSize: 14, fontWeight: "700", flex: 1 },
  score: { color: colors.text, fontSize: 16, fontFamily: fonts.mono, minWidth: 48, textAlign: "center" },
  statusWrap: { flexDirection: "row", alignItems: "center", gap: 5, minWidth: 56, justifyContent: "flex-end" },
  status: { color: colors.textDim, fontSize: 11, fontFamily: fonts.mono },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.live },
  // hero variant
  heroCard: { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: StyleSheet.hairlineWidth, borderRadius: 16, marginBottom: 16, overflow: "hidden" },
  heroStrip: { height: 3, width: "100%" },
  heroBody: { padding: 16 },
  heroTeams: { flexDirection: "row", alignItems: "center", gap: 12, marginTop: 2 },
  heroTeam: { color: colors.text, fontSize: 19, fontWeight: "800", flex: 1 },
  heroScore: { color: colors.text, fontSize: 30, fontFamily: fonts.mono, minWidth: 64, textAlign: "center" },
  heroFooter: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 12 },
  heroStatus: { color: colors.textDim, fontSize: 12, fontFamily: fonts.mono },
  heroVenue: { color: colors.textFaint, fontSize: 12, fontWeight: "500", flex: 1 },
  // F1 race variant
  raceRound: { fontSize: 17, fontFamily: fonts.mono, minWidth: 40, letterSpacing: 0.3 },
  raceName: { color: colors.text, fontSize: 14, fontWeight: "700" },
  raceLoc: { color: colors.textFaint, fontSize: 11.5, fontWeight: "500", marginTop: 2 },
  raceHeroTop: { flexDirection: "row", alignItems: "baseline", gap: 12, marginTop: 2 },
  raceHeroRound: { fontSize: 30, fontFamily: fonts.mono, letterSpacing: 0.4 },
  raceHeroName: { color: colors.text, fontSize: 19, fontWeight: "800", flex: 1 },
});
