"use client";
import { useState, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PrefsProvider } from "@/hooks/usePrefs";
import { FavoritesProvider } from "@/hooks/useFavorites";
import { AuthProvider } from "@/hooks/useAuth";
import { EntitlementsProvider } from "@/hooks/useEntitlements";

export function Providers({ children }: { children: ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 10_000,
            refetchOnWindowFocus: true,
            refetchIntervalInBackground: false,
            retry: 1,
          },
        },
      }),
  );
  return (
    <QueryClientProvider client={client}>
      <AuthProvider>
        <EntitlementsProvider>
          <PrefsProvider>
            <FavoritesProvider>{children}</FavoritesProvider>
          </PrefsProvider>
        </EntitlementsProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
