import { useEffect, useState } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import * as SplashScreen from "expo-splash-screen";
import { useFonts, JetBrainsMono_400Regular, JetBrainsMono_500Medium } from "@expo-google-fonts/jetbrains-mono";
import { ThemeProvider } from "../theme/ThemeProvider";
import { AuthProvider } from "../providers/auth";
import { colors } from "../theme/theme";
import { installApiBase } from "../lib/apiBase";

// The initial route when the app opens at "/". Without this anchor, expo-router
// (SDK 54+/v6) can land on the not-found screen for "/" even though the (tabs)
// files exist — which showed up as a 404 on the Home/front page while the other
// tabs still worked.
export const unstable_settings = { anchor: "(tabs)" };

// Point @liveleagues/core's relative /api fetches at the web origin (see apiBase).
installApiBase();

// Keep the native splash up until JetBrains Mono is loaded — no flash of the
// fallback font on the data text.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [client] = useState(
    () =>
      new QueryClient({
        // staleTime 0 so the bundled snapshot seeds render instantly but are treated
        // as stale — a live fetch fires on mount, then adaptive refetchInterval polls.
        defaultOptions: { queries: { staleTime: 0, retry: 1, refetchOnWindowFocus: false } },
      }),
  );

  const [fontsLoaded, fontError] = useFonts({ JetBrainsMono_400Regular, JetBrainsMono_500Medium });

  useEffect(() => {
    if (fontsLoaded || fontError) SplashScreen.hideAsync();
  }, [fontsLoaded, fontError]);

  // Hold render until fonts resolve (or error out, so a font CDN hiccup never
  // bricks launch). Splash stays visible meanwhile.
  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={client}>
        <ThemeProvider>
          <AuthProvider>
            <StatusBar style="light" />
            <Stack
              screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}
            >
              <Stack.Screen name="(tabs)" />
              {/* Real detail routes — native header gives back + swipe-to-go-back. */}
              <Stack.Screen
                name="match/[id]"
                options={{
                  headerShown: true,
                  title: "Match",
                  headerStyle: { backgroundColor: colors.surface },
                  headerTintColor: colors.text,
                  headerTitleStyle: { color: colors.text },
                }}
              />
              <Stack.Screen
                name="race/[id]"
                options={{
                  headerShown: true,
                  title: "Race",
                  headerStyle: { backgroundColor: colors.surface },
                  headerTintColor: colors.text,
                  headerTitleStyle: { color: colors.text },
                }}
              />
            </Stack>
          </AuthProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
