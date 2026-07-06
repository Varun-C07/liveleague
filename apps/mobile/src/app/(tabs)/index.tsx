import { ScrollView, View, Text, Pressable, RefreshControl, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLiveTicker } from "@liveleagues/core/hooks/useLive";
import type { Game, SportSummary } from "@liveleagues/core/sports/types";
import { OVERVIEW_SNAPSHOT } from "@liveleagues/core/snapshots";
import { colors, fonts } from "../../theme/theme";
import { MatchCard, gameToCard, raceToCard, type MatchCardData } from "../../components/MatchCard";
import { Loading, ErrorState } from "../../components/states";

// Home (read-only): the cross-sport overview, straight from the shared core hook
// (the same /api/live query the web app polls). Seeded with a bundled snapshot so
// it renders instantly and survives a backend outage; live data replaces it on the
// first successful fetch. No logic is duplicated here.
export default function Home() {
  const insets = useSafeAreaInsets();
  const { data: ov, isLoading, isError, error, refetch, isRefetching } = useLiveTicker(OVERVIEW_SNAPSHOT);

  if (isLoading) return <Loading label="Loading scores…" />;
  if (isError) {
    return <ErrorState title="Couldn't load scores" message={(error as Error)?.message} onRetry={() => refetch()} />;
  }

  const sports = (ov?.sports ?? []).filter((s) => s.id === "soccer" || s.id === "f1");

  // Ticker = a horizontal glance strip across the visible sports (live first, then
  // soonest). Reuses the same card mappers so nothing is re-derived.
  const ticker = sports
    .flatMap((s) => s.topGames.map((g) => (s.id === "f1" ? raceToCard(g) : gameToCard(g, true))))
    .sort((a, b) => statusRank(a.status) - statusRank(b.status) || a.utc.localeCompare(b.utc));

  // Hero = the single most relevant game (a live one if any, else soonest upcoming).
  const all = sports.flatMap((s) => s.topGames.map((g) => ({ g, sportId: s.id })));
  const hero = pickHero(all);
  const heroAccent = hero?.sportId === "f1" ? colors.f1 : colors.accent;

  // Sections = each sport's remaining games (hero removed). Skip empty sections.
  const sections = sports
    .map((s) => ({ sport: s, games: s.topGames.filter((g) => g.id !== hero?.g.id) }))
    .filter((x) => x.games.length > 0);

  const hasAny = !!hero || sections.length > 0;

  return (
    <ScrollView
      style={styles.fill}
      contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: 24, paddingHorizontal: 16 }}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.accent} />}
    >
      <View style={styles.headerRow}>
        <Text style={styles.wordmark}>
          Live<Text style={{ color: colors.accent }}>Leagues</Text>
        </Text>
        {ov && ov.totalLive > 0 ? (
          <View style={styles.liveBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.liveTxt}>{ov.totalLive} LIVE</Text>
          </View>
        ) : null}
      </View>

      <Ticker items={ticker} />

      {!hasAny ? (
        <View style={[styles.card, styles.center, { paddingVertical: 28 }]}>
          <Text style={styles.dim}>No live or upcoming games right now.</Text>
        </View>
      ) : (
        <>
          {hero ? (
            <MatchCard m={gameToCard(hero.g, hero.sportId === "soccer")} hero accent={heroAccent} pressable />
          ) : null}
          {sections.map(({ sport, games }) => <SportSection key={sport.id} sport={sport} games={games} />)}
        </>
      )}
    </ScrollView>
  );
}

function pickHero(all: { g: Game; sportId: string }[]): { g: Game; sportId: string } | null {
  const byTime = (a: { g: Game }, b: { g: Game }) => a.g.utc.localeCompare(b.g.utc);
  const live = all.filter((x) => x.g.status === "live").sort(byTime);
  if (live.length) return live[0];
  const sched = all.filter((x) => x.g.status === "sched").sort(byTime);
  return sched[0] ?? all[0] ?? null;
}

const statusRank = (s: MatchCardData["status"]) => (s === "live" ? 0 : s === "sched" ? 1 : 2);

// Horizontal live-score strip. Each chip taps through to the match/race detail.
function Ticker({ items }: { items: MatchCardData[] }) {
  if (items.length === 0) return null;
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.tickerRow}
      style={styles.ticker}
    >
      {items.map((m) => <TickerChip key={`tick-${m.id}`} m={m} />)}
    </ScrollView>
  );
}

function TickerChip({ m }: { m: MatchCardData }) {
  const router = useRouter();
  const live = m.status === "live";
  const isRace = m.round != null;
  const eyebrow = live ? m.minute ?? "LIVE" : m.status === "final" ? "FT" : clock(m.utc);
  return (
    <Pressable
      onPress={() =>
        router.push(isRace ? { pathname: "/race/[id]", params: { id: m.id } } : { pathname: "/match/[id]", params: { id: m.id } })
      }
      style={({ pressed }) => [styles.chip, pressed && { opacity: 0.85 }]}
    >
      <View style={styles.chipTop}>
        {live ? <View style={styles.chipDot} /> : null}
        <Text style={[styles.chipEye, live && { color: colors.live }]} numberOfLines={1}>{eyebrow}</Text>
      </View>
      {isRace ? (
        <>
          <Text style={styles.chipRound}>R{m.round}</Text>
          <Text style={styles.chipGP} numberOfLines={1}>{m.label}</Text>
        </>
      ) : (
        <>
          <View style={styles.chipTeamRow}>
            <Text style={styles.chipTeam} numberOfLines={1}>{m.homeFlag ? `${m.homeFlag} ` : ""}{m.homeCode}</Text>
            <Text style={styles.chipScore}>{m.homeScore ?? ""}</Text>
          </View>
          <View style={styles.chipTeamRow}>
            <Text style={styles.chipTeam} numberOfLines={1}>{m.awayFlag ? `${m.awayFlag} ` : ""}{m.awayCode}</Text>
            <Text style={styles.chipScore}>{m.awayScore ?? ""}</Text>
          </View>
        </>
      )}
    </Pressable>
  );
}

function clock(utc: string): string {
  try {
    return new Date(utc).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  } catch {
    return "";
  }
}

function SportSection({ sport, games }: { sport: SportSummary; games: Game[] }) {
  const isF1 = sport.id === "f1";
  return (
    <View style={{ marginBottom: 22 }}>
      <View style={styles.sectionHead}>
        <View style={[styles.bar, { backgroundColor: isF1 ? colors.f1 : colors.accent }]} />
        <Text style={styles.sectionTitle}>{sport.name.toUpperCase()}</Text>
        {sport.liveCount > 0 ? <Text style={styles.sectionLive}>{sport.liveCount} live</Text> : null}
      </View>
      {games.map((g) => <MatchCard key={g.id} m={gameToCard(g, sport.id === "soccer")} pressable />)}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: colors.bg },
  center: { alignItems: "center", justifyContent: "center" },
  dim: { color: colors.textDim, fontSize: 13, marginTop: 8 },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 18 },
  wordmark: { color: colors.text, fontSize: 24, fontWeight: "800", letterSpacing: 0.3 },
  liveBadge: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 9, paddingVertical: 4, borderRadius: 6, backgroundColor: colors.surfaceHi },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.live },
  liveTxt: { color: colors.live, fontSize: 11, fontFamily: fonts.mono, letterSpacing: 0.5 },
  sectionHead: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 },
  bar: { width: 3, height: 16, borderRadius: 2 },
  sectionTitle: { color: colors.text, fontSize: 14, fontWeight: "800", letterSpacing: 0.6 },
  sectionLive: { color: colors.live, fontSize: 11, fontFamily: fonts.mono, marginLeft: 4 },
  card: { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: StyleSheet.hairlineWidth, borderRadius: 14, padding: 13, marginBottom: 8 },
  // live ticker
  ticker: { marginBottom: 18, marginHorizontal: -16 },
  tickerRow: { gap: 8, paddingHorizontal: 16 },
  chip: {
    width: 132, backgroundColor: colors.surface, borderColor: colors.border,
    borderWidth: StyleSheet.hairlineWidth, borderRadius: 12, padding: 10, gap: 4,
  },
  chipTop: { flexDirection: "row", alignItems: "center", gap: 5, marginBottom: 2 },
  chipDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.live },
  chipEye: { color: colors.textFaint, fontSize: 10, fontFamily: fonts.mono, letterSpacing: 0.3, flex: 1 },
  chipTeamRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  chipTeam: { color: colors.text, fontSize: 13, fontWeight: "700", flex: 1 },
  chipScore: { color: colors.text, fontSize: 13, fontFamily: fonts.mono, minWidth: 14, textAlign: "right" },
  chipRound: { color: colors.f1, fontSize: 17, fontFamily: fonts.mono, marginTop: 2 },
  chipGP: { color: colors.textDim, fontSize: 11.5, fontWeight: "600" },
});
