"use client";

import { useRouter } from "next/navigation";
import { useLanguage } from "@/components/LanguageProvider";

export function PersonFormBackButton() {
  const router = useRouter();
  const { t } = useLanguage();

  return (
    <button
      type="button"
      onClick={() => router.back()}
      className="person-form-back relative self-start rounded-xl border border-black/15 px-4 py-2.5 text-sm font-medium transition md:absolute md:start-0 md:top-0 dark:border-white/20"
    >
      {t.people.backToPeople}
    </button>
  );
}
