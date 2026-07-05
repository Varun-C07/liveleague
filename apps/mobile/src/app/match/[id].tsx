import { ScrollView, Text, StyleSheet } from "react-native";
import { Stack, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLiveTicker } from "@liveleagues/core/hooks/useLive";
import { useMatches } from "@liveleagues/core/hooks/useMatches";
import type { MatchesResponse } from "@liveleagues/core/api-shape";
import { colors, fonts } from "../../theme/theme";
import { MatchCard, matchToCard, gameToCard, type MatchCardData } from "../../components/MatchCard";
import { Loading, NotFound, ComingSoon } from "../../components/states";

const EMPTY: MatchesResponse = { source: "snapshot", syncedAt: "", liveCount: 0, total: 0, matches: [] };

// Read-only soccer match detail. A tapped card can originate from EITHER source —
// the World Cup fixtures list (`useMatches`) OR the overview topGames that feed
// Home + the featured strip (`useLiveTicker`). Both ids are `soccer-${n}`, so we
// resolve against both (same shared React Query cache — no new fetch).
export default function MatchDetail() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, isLoading: matchesLoading } = useMatches(EMPTY);
  const { data: ov, isLoading: overviewLoading } = useLiveTicker();

  const apiMatch = (data?.matches ?? []).find((x) => `soccer-${x.n}` === id) ?? null;
  const game = ov?.sports.find((s) => s.id === "soccer")?.topGames.find((g) => g.id === id) ?? null;

  let card: MatchCardData | null = null;
  let title = "Match";
  let meta = "";
  if (apiMatch) {
    card = matchToCard(apiMatch);
    title = `${apiMatch.home.code || apiMatch.home.name} v ${apiMatch.away.code || apiMatch.away.name}`;
    meta = metaLine(apiMatch.stage, apiMatch.utc, apiMatch.venue, apiMatch.city);
  } else if (game) {
    card = gameToCard(game, true);
    title = `${game.home.code || game.home.name} v ${game.away.code || game.away.name}`;
    meta = metaLine(game.label, game.utc, game.venue, game.city);
  }

  if (!card) {
    // Still loading either source → keep waiting; only "not found" once both settle.
    if (matchesLoading || overviewLoading) return <Loading label="Loading match…" />;
    return <NotFound label="Match not found" />;
  }

  return (
    <ScrollView style={styles.fill} contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 24 }}>
      <Stack.Screen options={{ title }} />
      <MatchCard m={card} hero accent={colors.accent} />
      <Text style={styles.meta}>{meta}</Text>
      <ComingSoon title="Lineups" />
      <ComingSoon title="Head-to-head" />
      <ComingSoon title="Win probability" />
    </ScrollView>
  );
}

function metaLine(stage: string, utc: string, venue?: string | null, city?: string | null): string {
  return [stage, longDate(utc), [venue, city].filter(Boolean).join(", ")].filter(Boolean).join("  ·  ");
}

function longDate(utc: string): string {
  try {
    const d = new Date(utc);
    return `${d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}, ${d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`;
  } catch {
    return "";
  }
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: colors.bg },
  meta: { color: colors.textDim, fontSize: 12.5, fontFamily: fonts.mono, marginBottom: 18, marginTop: 2 },
});
