import { Text, View } from "react-native";

// Proof that the shared workspace package resolves on mobile (Metro + TS):
// barrel import…
import { SPORT_META, K_FACTOR } from "@liveleague/core";
// …and a granular subpath import.
import { accentFor } from "@liveleague/core/sports/format";

import { Card, Screen } from "@/components/Screen";
import { theme } from "@/theme/palette";

export default function HomeScreen() {
  // The three live screens map to these sports (World Cup soccer + F1).
  const live = SPORT_META.filter((s) => s.id === "soccer" || s.id === "f1");

  return (
    <Screen title="Live League">
      <Card>
        <Text style={{ color: theme.win, fontWeight: "700", fontSize: 13 }}>
          @liveleague/core wired ✓
        </Text>
        <Text style={{ color: theme.textDim, fontSize: 13, lineHeight: 19 }}>
          Shared logic + types imported from the workspace package (barrel and
          subpath). Elo K-factor constant = {K_FACTOR}.
        </Text>
      </Card>

      {live.map((s) => (
        <Card key={s.id}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <View
              style={{
                width: 4,
                height: 18,
                borderRadius: 2,
                backgroundColor: accentFor(s.id),
              }}
            />
            <Text style={{ color: theme.text, fontSize: 16, fontWeight: "700" }}>
              {s.name}
            </Text>
          </View>
          <Text style={{ color: theme.textFaint, fontSize: 12 }}>
            Screen scaffolded — live data + design come next (Varun).
          </Text>
        </Card>
      ))}
    </Screen>
  );
}
