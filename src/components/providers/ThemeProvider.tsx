"use client";

import * as React from "react";

const THEME_KEY = "kurpur_theme";
type Theme = "dark" | "light";

function getStoredTheme(): Theme {
  if (typeof window === "undefined") return "dark";
  return (localStorage.getItem(THEME_KEY) as Theme) || "dark";
}

function setStoredTheme(theme: Theme) {
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {}
}

const ThemeContext = React.createContext<{
  theme: Theme;
  setTheme: (t: Theme) => void;
}>({ theme: "dark", setTheme: () => {} });

export function useTheme() {
  return React.useContext(ThemeContext);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = React.useState<Theme>("dark");
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
    // Sync with document (set by layout script) so UI matches actual theme
    const docClass = document.documentElement.className;
    const t: Theme = docClass === "light" ? "light" : "dark";
    setThemeState(t);
    setStoredTheme(t);
    if (document.documentElement.className !== t) {
      document.documentElement.className = t;
    }
  }, []);

  const setTheme = React.useCallback((t: Theme) => {
    setThemeState(t);
    setStoredTheme(t);
    document.documentElement.className = t;
  }, []);

  if (!mounted) return <>{children}</>;

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
