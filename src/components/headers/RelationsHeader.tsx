"use client";

import { useLanguage } from "@/components/LanguageProvider";

export function RelationsHeader() {
  const { t } = useLanguage();

  return (
    <div>
      <h1 className="text-2xl font-semibold">{t.relations.title}</h1>
      <p className="mt-1 text-black/60 dark:text-white/60">
        {t.relations.subtitle}
      </p>
    </div>
  );
}
