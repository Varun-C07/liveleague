import { useMemo } from "react";
import { FlatList, View, Text, RefreshControl, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLiveTicker, useLiveBundle } from "@liveleagues/core/hooks/useLive";
import type { Game, LiveBundle } from "@liveleagues/core/sports/types";
import { colors, fonts } from "../../theme/theme";
import { MatchCard, raceToCard, type MatchCardData } from "../../components/MatchCard";
import { Loading, ErrorState } from "../../components/states";

// useLiveBundle needs an initial seed (built for SSR on web); on device we start
// empty and it fetches /api/f1 (via the apiBase shim). No new fetch here.
const EMPTY: LiveBundle = { sport: "f1", source: "snapshot", syncedAt: "", liveCount: 0, games: [] };

export default function F1() {
  const insets = useSafeAreaInsets();
  const overview = useLiveTicker();
  const { data: bundle, isLoading, isError, error, refetch, isRefetching } = useLiveBundle("f1", EMPTY);

  const f1 = overview.data?.sports.find((s) => s.id === "f1");
  const races = bundle?.games ?? [];

  // Featured hero = next/most relevant race (live if any, else soonest upcoming),
  // from the overview's topGames; full schedule from the bundle, sorted by round.
  const hero = useMemo(() => pickRace(f1?.topGames ?? []) ?? pickRace(races), [f1, races]);
  const schedule = useMemo<MatchCardData[]>(() => [...races].sort(scheduleOrder).map(raceToCard), [races]);

  if (isLoading && races.length === 0) return <Loading label="Loading schedule…" />;
  if (isError && races.length === 0) {
    return <ErrorState title="Couldn't load schedule" message={(error as Error)?.message} onRetry={() => refetch()} />;
  }

  const rounds = races.length;
  const heroName = hero ? hero.venue || hero.label : null;

  return (
    <FlatList
      style={styles.fill}
      contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: 24, paddingHorizontal: 16 }}
      data={schedule}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => <MatchCard m={item} pressable />}
      ListHeaderComponent={
        <View>
          <Text style={styles.title}>Formula 1</Text>
          <Text style={[styles.stat, rounds > 0 && styles.statMono]}>
            {rounds > 0 ? `${rounds} rounds${heroName ? ` · next ${heroName}` : ""}` : "Season schedule"}
          </Text>
          {hero ? <MatchCard m={raceToCard(hero)} hero accent={colors.f1} pressable /> : null}
          {schedule.length > 0 ? (
            <View style={styles.subLabel}>
              <View style={styles.bar} />
              <Text style={styles.subTitle}>SCHEDULE</Text>
            </View>
          ) : null}
        </View>
      }
      ListEmptyComponent={
        <View style={[styles.card, styles.empty]}>
          <Text style={styles.dim}>No schedule available yet.</Text>
        </View>
      }
      refreshControl={
        <RefreshControl
          refreshing={isRefetching}
          onRefresh={() => { refetch(); overview.refetch(); }}
          tintColor={colors.accent}
        />
      }
    />
  );
}

const roundOf = (g: Game): number => (g.extra.sport === "f1" ? g.extra.round : 0);

// Upcoming/live races first (in round order), completed rounds after (also in
// round order) — so mid-season the next races lead the schedule instead of the
// already-run ones, while each group stays chronological.
function scheduleOrder(a: Game, b: Game): number {
  const fa = a.status === "final" ? 1 : 0;
  const fb = b.status === "final" ? 1 : 0;
  if (fa !== fb) return fa - fb;
  return roundOf(a) - roundOf(b);
}

function pickRace(races: Game[]): Game | null {
  const byTime = (a: Game, b: Game) => a.utc.localeCompare(b.utc);
  const live = races.filter((g) => g.status === "live").sort(byTime);
  if (live.length) return live[0];
  const sched = races.filter((g) => g.status === "sched").sort(byTime);
  return sched[0] ?? races[0] ?? null;
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: colors.bg },
  title: { color: colors.text, fontSize: 26, fontWeight: "800" },
  stat: { color: colors.textDim, fontSize: 13, marginTop: 4, marginBottom: 18 },
  statMono: { fontFamily: fonts.mono },
  subLabel: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 4, marginBottom: 10 },
  subTitle: { color: colors.text, fontSize: 14, fontWeight: "800", letterSpacing: 0.6 },
  bar: { width: 3, height: 16, borderRadius: 2, backgroundColor: colors.f1 },
  card: { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: StyleSheet.hairlineWidth, borderRadius: 14, padding: 13 },
  empty: { alignItems: "center", paddingVertical: 28 },
  dim: { color: colors.textDim, fontSize: 13 },
});
