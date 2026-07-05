import { ScrollView, Text, StyleSheet } from "react-native";
import { Stack, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLiveBundle } from "@liveleagues/core/hooks/useLive";
import { F1_SNAPSHOT } from "@liveleagues/core/snapshots";
import { colors, fonts } from "../../theme/theme";
import { MatchCard, raceToCard } from "../../components/MatchCard";
import { Loading, NotFound, ComingSoon } from "../../components/states";

// Read-only F1 race detail. Reads the SAME ["sport","f1"] query the F1 tab uses
// (React Query dedupes — no new fetch), seeded with the bundled snapshot, and
// selects by id.
export default function RaceDetail() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, isLoading } = useLiveBundle("f1", F1_SNAPSHOT);

  const g = (data?.games ?? []).find((x) => x.id === id) ?? null;

  if (isLoading && !g) return <Loading label="Loading race…" />;
  if (!g) return <NotFound label="Race not found" />;

  const round = g.extra.sport === "f1" ? g.extra.round : null;
  const meta = [longDate(g.utc), [g.city, g.country].filter(Boolean).join(", ")]
    .filter(Boolean)
    .join("  ·  ");

  return (
    <ScrollView style={styles.fill} contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 24 }}>
      <Stack.Screen options={{ title: round != null ? `Round ${round}` : "Race" }} />
      <MatchCard m={raceToCard(g)} hero accent={colors.f1} />
      <Text style={styles.meta}>{meta}</Text>
      <ComingSoon title="Results" />
      <ComingSoon title="Standings impact" />
    </ScrollView>
  );
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
