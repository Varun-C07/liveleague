import { View, Text, ActivityIndicator, Pressable, StyleSheet } from "react-native";
import { colors } from "../theme/theme";

// Shared full-screen states (extracted from Home so Home + World Cup match).
export function Loading({ label = "Loading…" }: { label?: string }) {
  return (
    <View style={s.center}>
      <ActivityIndicator color={colors.accent} />
      <Text style={s.dim}>{label}</Text>
    </View>
  );
}

export function ErrorState({
  title = "Couldn't load",
  message,
  onRetry,
}: {
  title?: string;
  message?: string;
  onRetry: () => void;
}) {
  return (
    <View style={[s.center, { padding: 24 }]}>
      <Text style={s.title}>{title}</Text>
      <Text style={[s.dim, { textAlign: "center", marginTop: 6 }]}>
        {message ?? "Check your connection or the API URL."}
      </Text>
      <Pressable style={s.retry} onPress={onRetry}>
        <Text style={s.retryTxt}>Retry</Text>
      </Pressable>
    </View>
  );
}

export function NotFound({ label = "Not found" }: { label?: string }) {
  return (
    <View style={s.center}>
      <Text style={s.title}>{label}</Text>
    </View>
  );
}

// Honest placeholder block — labels a real feature that isn't wired yet. No
// fabricated data.
export function ComingSoon({ title }: { title: string }) {
  return (
    <View style={s.block}>
      <Text style={s.blockTitle}>{title}</Text>
      <Text style={s.soon}>Coming soon</Text>
    </View>
  );
}

const s = StyleSheet.create({
  center: { flex: 1, backgroundColor: colors.bg, alignItems: "center", justifyContent: "center" },
  dim: { color: colors.textDim, fontSize: 13, marginTop: 8 },
  title: { color: colors.text, fontSize: 16, fontWeight: "800" },
  retry: { marginTop: 16, backgroundColor: colors.accent, paddingHorizontal: 22, paddingVertical: 11, borderRadius: 10 },
  retryTxt: { color: colors.onAccent, fontWeight: "800", fontSize: 14 },
  block: { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: StyleSheet.hairlineWidth, borderRadius: 14, padding: 14, marginBottom: 10 },
  blockTitle: { color: colors.text, fontSize: 13, fontWeight: "800", textTransform: "uppercase", letterSpacing: 0.5 },
  soon: { color: colors.textFaint, fontSize: 12.5, fontWeight: "600", marginTop: 5 },
});
