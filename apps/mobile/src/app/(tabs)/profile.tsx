import { Text } from "react-native";

import { Card, Screen } from "@/components/Screen";
import { theme } from "@/theme/palette";

export default function ProfileScreen() {
  return (
    <Screen title="Profile" accent={theme.gold}>
      <Card>
        <Text style={{ color: theme.textDim, fontSize: 13, lineHeight: 19 }}>
          Sign in (Supabase: Google + email; Sign in with Apple to add), followed
          teams, friend leagues and the $5 bundle live here. Auth talks only to
          the authClient seam; payments via the Purchases seam (free in beta).
        </Text>
      </Card>
    </Screen>
  );
}
