"use client";

import { useLanguage } from "@/components/LanguageProvider";

export function LoginHeading() {
  const { t } = useLanguage();
  return <h1 className="text-2xl font-semibold">{t.auth.login}</h1>;
}
