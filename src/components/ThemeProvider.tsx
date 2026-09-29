"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";

export type Theme = "light" | "dark";

interface ThemeContextValue {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);
const STORAGE_KEY = "shajar-theme";

export function ThemeProvider({
  children,
  initialTheme,
}: {
  children: ReactNode;
  /** Read server-side from the `shajar-theme` cookie so the HTML already
   * reflects the stored preference on the very first response — no flash,
   * no hydration mismatch. Without an explicit choice, the app no longer
   * silently follows the OS/browser's `prefers-color-scheme` (that's what
   * made it look different on another laptop) — it defaults to dark until
   * the user picks otherwise. */
  initialTheme: Theme;
}) {
  const [theme, setTheme] = useState<Theme>(initialTheme);

  // The server sets the `dark` class on <html> to match `initialTheme`
  // already; this only re-applies it when the user toggles mid-session.
  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  function toggleTheme() {
    setTheme((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      try {
        document.cookie = `${STORAGE_KEY}=${next}; path=/; max-age=31536000; SameSite=Lax`;
      } catch {
        // ignore
      }
      return next;
    });
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within a ThemeProvider");
  return ctx;
}
