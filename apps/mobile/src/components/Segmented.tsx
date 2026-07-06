import { View, Text, Pressable, StyleSheet } from "react-native";
import { colors } from "../theme/theme";

// A small segmented pill control (e.g. Fixtures | Groups). Active segment gets the
// accent fill; scarce accent, used only for the current selection.
export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: readonly T[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <View style={styles.wrap}>
      {options.map((opt) => {
        const on = opt === value;
        return (
          <Pressable
            key={opt}
            onPress={() => onChange(opt)}
            style={[styles.seg, on && styles.segOn]}
            accessibilityRole="button"
            accessibilityState={{ selected: on }}
          >
            <Text style={[styles.label, on ? styles.labelOn : styles.labelOff]}>{opt}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 10,
    padding: 3,
    alignSelf: "flex-start",
    gap: 3,
    marginBottom: 16,
  },
  seg: { paddingVertical: 7, paddingHorizontal: 16, borderRadius: 8 },
  segOn: { backgroundColor: colors.accent },
  label: { fontSize: 13, fontWeight: "700" },
  labelOn: { color: colors.onAccent },
  labelOff: { color: colors.textDim },
});
