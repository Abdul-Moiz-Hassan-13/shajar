"use client";

import Link from "next/link";
import { useLanguage } from "@/components/LanguageProvider";

export function TreeHeader() {
  const { t } = useLanguage();

  return (
    <div className="flex items-center justify-between">
      <h1 className="text-2xl font-semibold">{t.tree.title}</h1>
      <Link
        href="/people/new"
        className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white dark:bg-white dark:text-black"
      >
        {t.people.addPerson}
      </Link>
    </div>
  );
}
