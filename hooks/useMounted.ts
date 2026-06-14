"use client";
import { useEffect, useState } from "react";

// True only after the first client render. Use to gate clock-dependent text
// (countdowns, "synced at" times) so SSR and hydration markup match.
export function useMounted(): boolean {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}
