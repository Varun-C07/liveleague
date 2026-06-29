import { Text } from "react-native";

import { Card, Screen } from "@/components/Screen";
import { theme } from "@/theme/palette";

export default function SoccerScreen() {
  return (
    <Screen title="World Cup" accent={theme.accent}>
      <Card>
        <Text style={{ color: theme.textDim, fontSize: 13, lineHeight: 19 }}>
          Scores, standings, fixtures (free) and predictor / win-probability
          (paid) render here — native rebuild of the web Soccer screen. Reads the
          same /api/* routes via @liveleague/core hooks.
        </Text>
      </Card>
    </Screen>
  );
}
