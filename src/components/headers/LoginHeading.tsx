"use client";

import { useLanguage } from "@/components/LanguageProvider";

export function LoginHeading() {
  const { t } = useLanguage();
  return (
    <div className="space-y-2">
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
        {t.auth.login}
      </h1>
      <p className="text-base text-black/60 dark:text-white/60">
        {t.auth.loginSubtitle}
      </p>
    </div>
  );
}
