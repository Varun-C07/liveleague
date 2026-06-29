import { ReactNode } from "react";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { theme } from "@/theme/palette";

// Shared screen scaffold: safe-area, Obsidian background, a section-style header
// (accent bar + uppercase label, matching the web design language), scroll body.
export function Screen({ title, accent, children }: { title: string; accent?: string; children?: ReactNode }) {
  const bar = accent ?? theme.accent;
  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: theme.bg }}>
      <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <View style={{ width: 4, height: 22, borderRadius: 2, backgroundColor: bar }} />
          <Text
            style={{
              color: theme.text,
              fontSize: 22,
              fontWeight: "800",
              letterSpacing: 1,
              textTransform: "uppercase",
            }}
          >
            {title}
          </Text>
        </View>
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

export function Card({ children }: { children: ReactNode }) {
  return (
    <View
      style={{
        backgroundColor: theme.surface,
        borderColor: theme.border,
        borderWidth: 1,
        borderRadius: 14,
        padding: 16,
        gap: 8,
      }}
    >
      {children}
    </View>
  );
}
