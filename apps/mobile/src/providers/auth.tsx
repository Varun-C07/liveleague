import React, { createContext, useContext } from "react";

type AuthState = { user: null; signIn: () => void; signOut: () => void };

// BACKEND SEAM: replace with Supabase native auth (expo-auth-session deep link +
// expo-secure-store session). Beta ships signed-out / fully unlocked.
const AuthContext = createContext<AuthState>({ user: null, signIn: () => {}, signOut: () => {} });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <AuthContext.Provider value={{ user: null, signIn: () => {}, signOut: () => {} }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  return useContext(AuthContext);
}
