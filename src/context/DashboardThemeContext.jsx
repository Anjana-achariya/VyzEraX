import { createContext, useContext, useState } from "react";

/* ───────── Theme Definitions ───────── */

const themeStyles = {
  "coral-pink": {
    accent: "#ff8fab",
    accentSoft: "#ffd6e4",
  },
  "coral-yellow": {
    accent: "#f4c430",
    accentSoft: "#fff2b2",
  },
  "coral-violet": {
    accent: "#9b5de5",
    accentSoft: "#e0c9ff",
  },
  "coral-blue": {
    accent: "#4dabf7",
    accentSoft: "#d6ecff",
  },
};

/* ───────── Context ───────── */

const DashboardThemeContext = createContext(null);

export function DashboardThemeProvider({ children }) {
  const [mode, setMode] = useState("light"); // light | dark
  const [accent, setAccent] = useState("coral-pink");

  const theme = {
    mode,
    accent,
    colors: {
      background: mode === "light" ? "#ffffff" : "#121212",
      card: mode === "light" ? "#ffffff" : "#1e1e1e",
      text: mode === "light" ? "#111111" : "#f5f5f5",
      border: mode === "light" ? "#e5e7eb" : "#2a2a2a",
      ...themeStyles[accent],
    },
  };

  return (
    <DashboardThemeContext.Provider
      value={{
        theme,
        setMode,
        setAccent,
      }}
    >
      {children}
    </DashboardThemeContext.Provider>
  );
}

/* ───────── Hook ───────── */

export function useDashboardTheme() {
  const context = useContext(DashboardThemeContext);
  if (!context) {
    throw new Error(
      "useDashboardTheme must be used inside DashboardThemeProvider"
    );
  }
  return context;
}
