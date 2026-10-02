"use client";

import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { useLanguage } from "@/components/LanguageProvider";

export function PeopleHeader() {
  const { t } = useLanguage();
  const { isAdmin } = useAuth();

  return (
    <div className="people-page-header flex items-center justify-between gap-4">
      <h1 className="text-2xl font-semibold">{t.people.title}</h1>
      {isAdmin && (
        <Link
          href="/people/new"
          className="people-add-button rounded-xl bg-black px-4 py-2 text-sm font-medium text-white transition dark:bg-white dark:text-black"
        >
          {t.people.addPerson}
        </Link>
      )}
    </div>
  );
}
