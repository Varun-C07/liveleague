import { View, Text, Pressable, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../../providers/auth";
import { colors } from "../../theme/theme";

export default function Profile() {
  const insets = useSafeAreaInsets();
  const { user, signIn } = useAuth();
  return (
    <View style={[styles.fill, { paddingTop: insets.top + 16, paddingHorizontal: 16 }]}>
      <Text style={styles.title}>Profile</Text>
      <Text style={styles.sub}>
        {user ? "Signed in." : "Sign in to follow teams, make picks and run leagues."}
      </Text>
      {!user ? (
        <Pressable style={styles.btn} onPress={signIn}>
          <Text style={styles.btnTxt}>Sign in</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: colors.bg },
  title: { color: colors.text, fontSize: 26, fontWeight: "800" },
  sub: { color: colors.textDim, fontSize: 14, marginTop: 8, lineHeight: 20, maxWidth: 320 },
  btn: { marginTop: 18, alignSelf: "flex-start", borderColor: "rgba(255,255,255,0.15)", borderWidth: 1, paddingHorizontal: 20, paddingVertical: 11, borderRadius: 10 },
  btnTxt: { color: colors.text, fontWeight: "800", fontSize: 14 },
});
