"use client";

import Link from "next/link";
import { useLanguage } from "@/components/LanguageProvider";

export function TreeHeader() {
  const { t } = useLanguage();

  return (
    <div className="tree-page-header flex items-center justify-between gap-4">
      <h1 className="text-2xl font-semibold">{t.tree.title}</h1>
      <Link
        href="/people/new"
        className="tree-add-button rounded-xl bg-black px-4 py-2 text-sm font-medium text-white transition dark:bg-white dark:text-black"
      >
        <span className="urdu-add-person-label">{t.people.addPerson}</span>
      </Link>
    </div>
  );
}
