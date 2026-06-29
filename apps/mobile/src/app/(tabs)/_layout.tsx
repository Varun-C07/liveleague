import { Tabs } from "expo-router";
import { Text, View } from "react-native";

import { theme } from "@/theme/palette";

// Placeholder tab icon (dependency-free): a small rounded chip with the tab's
// initial. Swap for real icons (react-native-svg / SF Symbols) — Varun's pass.
function TabChip({ letter, active }: { letter: string; active: boolean }) {
  const color = active ? theme.accent : theme.textDim;
  return (
    <View
      style={{
        width: 26,
        height: 26,
        borderRadius: 8,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: color + "22",
      }}
    >
      <Text style={{ color, fontSize: 13, fontWeight: "700" }}>{letter}</Text>
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.accent,
        tabBarInactiveTintColor: theme.textDim,
        tabBarStyle: {
          backgroundColor: theme.surface,
          borderTopColor: theme.border,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ focused }) => <TabChip letter="H" active={focused} />,
        }}
      />
      <Tabs.Screen
        name="soccer"
        options={{
          title: "World Cup",
          tabBarIcon: ({ focused }) => <TabChip letter="W" active={focused} />,
        }}
      />
      <Tabs.Screen
        name="f1"
        options={{
          title: "Formula 1",
          tabBarIcon: ({ focused }) => <TabChip letter="F" active={focused} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ focused }) => <TabChip letter="P" active={focused} />,
        }}
      />
    </Tabs>
  );
}
