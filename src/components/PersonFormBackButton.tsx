"use client";

import { useRouter } from "next/navigation";
import { useLanguage } from "@/components/LanguageProvider";

export function PersonFormBackButton({ returnTo }: { returnTo?: string }) {
  const router = useRouter();
  const { t, locale } = useLanguage();

  return (
    <button
      type="button"
      onClick={() => (returnTo ? router.push(returnTo) : router.back())}
      aria-label={t.people.backToPeople}
      title={t.people.backToPeople}
      className="person-form-back relative self-start rounded-xl border border-black/15 p-2.5 text-sm font-medium transition md:absolute md:start-0 md:top-0 dark:border-white/20"
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className={`h-5 w-5 ${locale === "ur" ? "rotate-180" : ""}`}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M5 12H22" />
        <path d="m12 19-7-7 7-7" />
      </svg>
    </button>
  );
}
