"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";
import { AuthModal } from "@/components/design/auth/AuthModal";

export type AuthMode = "signin" | "signup";

type AuthModalCtx = {
  open: boolean;
  mode: AuthMode;
  // Open the auth modal on a given tab. Other CTAs (Unlock $5, Get the bundle,
  // Join or create a league) can call this with one line — they're NOT wired here.
  openAuth: (mode?: AuthMode) => void;
  closeAuth: () => void;
};

const Ctx = createContext<AuthModalCtx | undefined>(undefined);

export function AuthModalProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<AuthMode>("signin");

  const openAuth = useCallback((m: AuthMode = "signin") => {
    setMode(m);
    setOpen(true);
  }, []);
  const closeAuth = useCallback(() => setOpen(false), []);

  return (
    <Ctx.Provider value={{ open, mode, openAuth, closeAuth }}>
      {children}
      <AuthModal open={open} mode={mode} onModeChange={setMode} onClose={closeAuth} />
    </Ctx.Provider>
  );
}

export function useAuthModal(): AuthModalCtx {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAuthModal must be used within <AuthModalProvider>");
  return c;
}
