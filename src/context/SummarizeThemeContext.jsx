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

const SummarizeThemeContext = createContext(null);

export function SummarizeThemeProvider({ children }) {
  const [mode, setMode] = useState("light"); // light | dark
  const [accent, setAccent] = useState("coral-pink");

  const theme = {
    mode,
    accent,
    colors: {
      background: mode === "light" ? "#ffffff" : "#0f172a",
      card: mode === "light" ? "#ffffff" : "#111827",
      text: mode === "light" ? "#111827" : "#e5e7eb",
      border: mode === "light" ? "#e5e7eb" : "#1f2937",
      ...themeStyles[accent],
    },
  };

  return (
    <SummarizeThemeContext.Provider
      value={{
        theme,
        setMode,
        setAccent,
      }}
    >
      {children}
    </SummarizeThemeContext.Provider>
  );
}

/* ───────── Hook ───────── */

export function useSummarizeTheme() {
  const context = useContext(SummarizeThemeContext);
  if (!context) {
    throw new Error(
      "useSummarizeTheme must be used inside SummarizeThemeProvider"
    );
  }
  return context;
}
