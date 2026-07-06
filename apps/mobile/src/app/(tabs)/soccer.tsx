import { useMemo, useState } from "react";
import { SectionList, FlatList, View, Text, RefreshControl, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLiveTicker } from "@liveleagues/core/hooks/useLive";
import { useMatches, useStandings } from "@liveleagues/core/hooks/useMatches";
import type { ApiMatch } from "@liveleagues/core/api-shape";
import { OVERVIEW_SNAPSHOT, SOCCER_SNAPSHOT, SOCCER_STANDINGS_SNAPSHOT } from "@liveleagues/core/snapshots";
import { colors, fonts } from "../../theme/theme";
import { MatchCard, gameToCard, matchToCard, type MatchCardData } from "../../components/MatchCard";
import { GroupCard } from "../../components/standings";
import { Segmented } from "../../components/Segmented";
import { Loading, ErrorState } from "../../components/states";

// Seeded with bundled snapshots so the tab opens instantly and survives a backend
// outage; live data (/api/soccer via the apiBase shim) replaces them on first fetch.
type Section = { title: string; data: MatchCardData[] };
const TABS = ["Fixtures", "Groups"] as const;

export default function Soccer() {
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<(typeof TABS)[number]>("Fixtures");
  const overview = useLiveTicker(OVERVIEW_SNAPSHOT);
  const { data: mr, isLoading, isError, error, refetch, isRefetching } = useMatches(SOCCER_SNAPSHOT);
  const { data: st, refetch: refetchStandings } = useStandings(SOCCER_STANDINGS_SNAPSHOT);

  const soccer = overview.data?.sports.find((s) => s.id === "soccer");
  const featured = (soccer?.topGames ?? []).map((g) => gameToCard(g, true));
  const matches = mr?.matches ?? [];
  const sections = useMemo<Section[]>(() => buildSections(matches), [matches]);
  const groupKeys = useMemo(() => Object.keys(st?.groups ?? {}).sort(), [st]);
  const bestThirds = useMemo(() => new Set(st?.bestThirds ?? []), [st]);

  if (isLoading && matches.length === 0) return <Loading label="Loading fixtures…" />;
  if (isError && matches.length === 0) {
    return <ErrorState title="Couldn't load fixtures" message={(error as Error)?.message} onRetry={() => refetch()} />;
  }

  const header = (showFeatured: boolean) => (
    <View>
      <Text style={styles.title}>World Cup</Text>
      <Text style={styles.stat}>
        {soccer ? `${soccer.liveCount} live · ${soccer.total} matches` : `${matches.length} matches`}
      </Text>
      <Segmented options={TABS} value={tab} onChange={setTab} />
      {showFeatured && featured.length > 0 ? (
        <View style={{ marginBottom: 4 }}>
          <View style={styles.subLabel}>
            <View style={styles.bar} />
            <Text style={styles.subTitle}>LIVE &amp; UPCOMING</Text>
          </View>
          {featured.map((c) => <MatchCard key={`feat-${c.id}`} m={c} pressable />)}
        </View>
      ) : null}
    </View>
  );

  const pad = { paddingTop: insets.top + 8, paddingBottom: 24, paddingHorizontal: 16 };
  const refresh = (
    <RefreshControl
      refreshing={isRefetching}
      onRefresh={() => { refetch(); overview.refetch(); refetchStandings(); }}
      tintColor={colors.accent}
    />
  );

  if (tab === "Groups") {
    return (
      <FlatList
        style={styles.fill}
        contentContainerStyle={pad}
        data={groupKeys}
        keyExtractor={(k) => k}
        renderItem={({ item }) => <GroupCard group={item} rows={st!.groups[item]} bestThirds={bestThirds} />}
        ListHeaderComponent={header(false)}
        ListFooterComponent={
          <Text style={styles.legend}>Top 2 advance · best 8 third-placed teams also qualify</Text>
        }
        ListEmptyComponent={
          <View style={[styles.card, styles.empty]}><Text style={styles.dim}>No standings available yet.</Text></View>
        }
        refreshControl={refresh}
      />
    );
  }

  return (
    <SectionList
      style={styles.fill}
      contentContainerStyle={pad}
      sections={sections}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => <MatchCard m={item} pressable />}
      stickySectionHeadersEnabled={false}
      renderSectionHeader={({ section }) => (
        <View style={styles.sectionHead}>
          <View style={styles.bar} />
          <Text style={styles.sectionTitle}>{section.title}</Text>
          <Text style={styles.sectionCount}>{section.data.length}</Text>
        </View>
      )}
      ListHeaderComponent={header(true)}
      ListEmptyComponent={
        <View style={[styles.card, styles.empty]}>
          <Text style={styles.dim}>No fixtures available yet.</Text>
        </View>
      }
      refreshControl={refresh}
    />
  );
}

// Order: live first, then upcoming soonest-first, then recent finals — grouped by
// (local) calendar day. Presentational only; no core logic duplicated.
function buildSections(matches: ApiMatch[]): Section[] {
  const rank = (m: ApiMatch) => (m.status === "live" ? 0 : m.status === "sched" ? 1 : 2);
  const sorted = [...matches].sort(
    (a, b) => rank(a) - rank(b) || (rank(a) === 2 ? b.utc.localeCompare(a.utc) : a.utc.localeCompare(b.utc)),
  );
  const out: Section[] = [];
  let key = "";
  for (const m of sorted) {
    const k = dayKey(m.utc);
    if (k !== key) {
      key = k;
      out.push({ title: dayLabel(m.utc), data: [] });
    }
    out[out.length - 1].data.push(matchToCard(m));
  }
  return out;
}

function dayKey(utc: string): string {
  try { return new Date(utc).toLocaleDateString("en-CA"); } catch { return utc.slice(0, 10); }
}
function dayLabel(utc: string): string {
  try {
    return new Date(utc).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }).toUpperCase();
  } catch {
    return "";
  }
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: colors.bg },
  title: { color: colors.text, fontSize: 26, fontWeight: "800" },
  stat: { color: colors.textDim, fontSize: 13, fontFamily: fonts.mono, marginTop: 4, marginBottom: 18 },
  subLabel: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 },
  subTitle: { color: colors.text, fontSize: 14, fontWeight: "800", letterSpacing: 0.6 },
  sectionHead: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 12, marginBottom: 10, backgroundColor: colors.bg },
  bar: { width: 3, height: 16, borderRadius: 2, backgroundColor: colors.accent },
  sectionTitle: { color: colors.textDim, fontSize: 12, fontWeight: "800", letterSpacing: 0.6 },
  sectionCount: { color: colors.textFaint, fontSize: 11, fontFamily: fonts.mono, marginLeft: 2 },
  card: { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: StyleSheet.hairlineWidth, borderRadius: 14, padding: 13 },
  empty: { alignItems: "center", paddingVertical: 28 },
  dim: { color: colors.textDim, fontSize: 13 },
  legend: { color: colors.textFaint, fontSize: 11, lineHeight: 16, marginTop: 4, paddingHorizontal: 2 },
});
