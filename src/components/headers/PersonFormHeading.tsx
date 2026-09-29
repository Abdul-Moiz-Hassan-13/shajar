"use client";

import { useLanguage } from "@/components/LanguageProvider";
import { displayFullName } from "@/lib/personName";
import type { Person } from "@/lib/types";

export function PersonFormHeading({ person }: { person?: Person }) {
  const { t, locale } = useLanguage();

  return (
    <h1 className="text-2xl font-semibold">
      {person ? t.form.editPerson(displayFullName(person, locale)) : t.form.addPerson}
    </h1>
  );
}
