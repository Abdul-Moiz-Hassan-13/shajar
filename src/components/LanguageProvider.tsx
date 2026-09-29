"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { translations, type Locale, type TranslationDict } from "@/lib/i18n/translations";

interface LanguageContextValue {
  locale: Locale;
  t: TranslationDict;
  toggleLocale: () => void;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);
const STORAGE_KEY = "shajar-locale";

export function LanguageProvider({
  children,
  initialLocale,
}: {
  children: ReactNode;
  /** Read server-side from the `shajar-locale` cookie so the HTML already
   * reflects the stored preference on the very first response — no flash,
   * no hydration mismatch, no client-only correction needed. */
  initialLocale: Locale;
}) {
  const [locale, setLocale] = useState<Locale>(initialLocale);

  // The server sets `lang`/`dir` on <html> to match `initialLocale` already;
  // this only re-applies them when the user toggles mid-session.
  useEffect(() => {
    document.documentElement.lang = locale === "ur" ? "ur" : "en";
    document.documentElement.dir = locale === "ur" ? "rtl" : "ltr";
  }, [locale]);

  function toggleLocale() {
    setLocale((prev) => {
      const next = prev === "en" ? "ur" : "en";
      try {
        window.localStorage.setItem(STORAGE_KEY, next);
        document.cookie = `${STORAGE_KEY}=${next}; path=/; max-age=31536000; SameSite=Lax`;
      } catch {
        // ignore
      }
      return next;
    });
  }

  return (
    <LanguageContext.Provider value={{ locale, t: translations[locale], toggleLocale }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within a LanguageProvider");
  return ctx;
}
