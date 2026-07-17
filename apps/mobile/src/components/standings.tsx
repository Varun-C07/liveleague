import { View, Text, StyleSheet } from "react-native";
import type { StandingRowDto } from "@liveleagues/core/api-shape";
import type { StandingRow } from "@liveleagues/core/sports/types";
import type { TeamOutlook, OutlookState } from "@liveleagues/core/group-scenarios";
import { colors, fonts } from "../theme/theme";

const stateColor = (s: OutlookState): string =>
  s === "through" ? colors.win : s === "contention" ? colors.gold : s === "out" ? colors.lose : colors.textFaint;

// ── Soccer: one World Cup group table ────────────────────────────────────────
// Rows arrive pre-sorted. Top 2 advance (green rank); best third-placed teams
// (codes in `bestThirds`) get a gold dot. `outlook` (optional) adds the live
// qualification verdict per team below the table. Mirrors the web GroupCard.
export function GroupCard({
  group,
  rows,
  bestThirds,
  outlook,
}: {
  group: string;
  rows: StandingRowDto[];
  bestThirds: Set<string>;
  outlook?: Record<string, TeamOutlook>;
}) {
  // Verdicts worth surfacing: anything that isn't a plain "still alive".
  const verdicts = outlook
    ? rows.map((r) => outlook[r.code]).filter((o): o is TeamOutlook => !!o && o.state !== "alive")
    : [];
  return (
    <View style={styles.card}>
      <Text style={styles.groupTitle}>GROUP {group}</Text>
      <View style={styles.headRow}>
        <Text style={[styles.h, styles.rankCol]}>#</Text>
        <Text style={[styles.h, styles.teamCol]}>TEAM</Text>
        <Text style={[styles.h, styles.numCol]}>P</Text>
        <Text style={[styles.h, styles.numCol]}>GD</Text>
        <Text style={[styles.h, styles.ptsCol]}>PTS</Text>
      </View>
      {rows.map((r, i) => {
        const top2 = i < 2;
        const third = i === 2 && bestThirds.has(r.code);
        return (
          <View key={r.code} style={[styles.row, i > 0 && styles.rowBorder]}>
            <View style={styles.rankCol}>
              <Text style={[styles.rank, { color: top2 ? colors.win : third ? colors.gold : colors.textFaint }]}>
                {i + 1}
              </Text>
              {(top2 || third) && (
                <View style={[styles.pip, { backgroundColor: top2 ? colors.win : colors.gold }]} />
              )}
            </View>
            <View style={styles.teamCol}>
              <Text style={styles.flag}>{r.flag}</Text>
              <Text style={styles.team} numberOfLines={1}>{r.name}</Text>
            </View>
            <Text style={[styles.num, styles.numCol]}>{r.P}</Text>
            <Text style={[styles.num, styles.numCol, { color: r.GD > 0 ? colors.win : r.GD < 0 ? colors.lose : colors.textFaint }]}>
              {r.GD > 0 ? `+${r.GD}` : r.GD}
            </Text>
            <Text style={[styles.pts, styles.ptsCol]}>{r.Pts}</Text>
          </View>
        );
      })}
      {verdicts.length > 0 ? (
        <View style={styles.qual}>
          {verdicts.map((o) => (
            <View key={o.code} style={styles.qualRow}>
              <View style={[styles.qualDot, { backgroundColor: stateColor(o.state) }]} />
              <Text style={styles.qualCode}>{o.code}</Text>
              <Text style={styles.qualLine} numberOfLines={1}>{o.line}</Text>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

// ── F1: a championship table (drivers or constructors) ───────────────────────
// Generic StandingRow with a `metrics` array (PTS, W). First metric is the
// headline (points); the rest render dim.
export function ChampionshipTable({ title, rows, accent }: { title: string; rows: StandingRow[]; accent: string }) {
  return (
    <View style={styles.card}>
      <View style={styles.f1Head}>
        <View style={[styles.bar, { backgroundColor: accent }]} />
        <Text style={styles.f1Title}>{title}</Text>
      </View>
      {rows.map((r, i) => {
        const pts = r.metrics[0]?.value;
        const wins = r.metrics[1];
        return (
          <View key={r.code + i} style={[styles.row, i > 0 && styles.rowBorder]}>
            <Text style={[styles.rank, styles.rankCol, { color: i === 0 ? colors.gold : colors.textFaint }]}>{r.rank}</Text>
            <View style={[styles.chip, { backgroundColor: r.color || colors.textFaint }]} />
            <Text style={[styles.team, styles.f1Team]} numberOfLines={1}>{r.name}</Text>
            {wins != null && <Text style={styles.wins}>{wins.value} {wins.label}</Text>}
            <Text style={[styles.pts, styles.ptsCol]}>{pts}</Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 14,
    padding: 13,
    marginBottom: 12,
  },
  groupTitle: { color: colors.textDim, fontSize: 13, fontWeight: "800", letterSpacing: 0.8, marginBottom: 8 },
  headRow: { flexDirection: "row", alignItems: "center", paddingBottom: 6 },
  h: { color: colors.textFaint, fontSize: 10, fontWeight: "700", letterSpacing: 0.4 },
  row: { flexDirection: "row", alignItems: "center", paddingVertical: 6 },
  rowBorder: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  rankCol: { width: 24, flexDirection: "row", alignItems: "center", gap: 4 },
  rank: { fontFamily: fonts.mono, fontSize: 12, fontWeight: "800" },
  pip: { width: 5, height: 5, borderRadius: 3 },
  teamCol: { flex: 1, flexDirection: "row", alignItems: "center", gap: 8, minWidth: 0 },
  flag: { fontSize: 15 },
  team: { color: colors.text, fontSize: 13, fontWeight: "600", flexShrink: 1 },
  numCol: { width: 34, textAlign: "right" },
  num: { fontFamily: fonts.mono, fontSize: 12, color: colors.textDim },
  // qualification verdicts
  qual: { marginTop: 10, paddingTop: 9, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border, gap: 5 },
  qualRow: { flexDirection: "row", alignItems: "center", gap: 7 },
  qualDot: { width: 6, height: 6, borderRadius: 3 },
  qualCode: { width: 34, color: colors.textDim, fontSize: 11, fontWeight: "800", fontFamily: fonts.mono },
  qualLine: { flex: 1, color: colors.textDim, fontSize: 11.5 },
  ptsCol: { width: 40, textAlign: "right" },
  pts: { fontFamily: fonts.mono, fontSize: 14, fontWeight: "800", color: colors.text },
  // F1
  f1Head: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  bar: { width: 3, height: 15, borderRadius: 2 },
  f1Title: { color: colors.text, fontSize: 14, fontWeight: "800", letterSpacing: 0.3 },
  f1Team: { flex: 1, marginLeft: 8 },
  chip: { width: 10, height: 10, borderRadius: 3 },
  wins: { fontFamily: fonts.mono, fontSize: 11, color: colors.textFaint, marginRight: 10 },
});
