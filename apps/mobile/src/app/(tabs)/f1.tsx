import { Text } from "react-native";

import { Card, Screen } from "@/components/Screen";
import { theme } from "@/theme/palette";

export default function F1Screen() {
  return (
    <Screen title="Formula 1" accent={theme.crimson}>
      <Card>
        <Text style={{ color: theme.textDim, fontSize: 13, lineHeight: 19 }}>
          Races, grid, results and championship standings render here — native
          rebuild of the web F1 screen. F1 identity is crimson; cards lead with
          the round number (R8), no sport icon.
        </Text>
      </Card>
    </Screen>
  );
}
