import React, { createContext, useContext } from "react";
import { colors, type Theme } from "./theme";

const ThemeContext = createContext<Theme>(colors);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Single theme for now; structured so palette-switching can be added later.
  return <ThemeContext.Provider value={colors}>{children}</ThemeContext.Provider>;
}

export function useTheme(): Theme {
  return useContext(ThemeContext);
}
