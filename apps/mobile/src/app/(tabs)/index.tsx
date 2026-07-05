import { ScrollView, View, Text, RefreshControl, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLiveTicker } from "@liveleagues/core/hooks/useLive";
import type { Game, SportSummary } from "@liveleagues/core/sports/types";
import { OVERVIEW_SNAPSHOT } from "@liveleagues/core/snapshots";
import { colors, fonts } from "../../theme/theme";
import { MatchCard, gameToCard } from "../../components/MatchCard";
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
});
