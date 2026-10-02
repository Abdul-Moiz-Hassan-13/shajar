"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/components/LanguageProvider";
import { displayFullName } from "@/lib/personName";
import { genderTagStyle } from "@/lib/personColors";
import type { Person } from "@/lib/types";

export function PersonDetails({ person, people }: { person: Person; people: Person[] }) {
  const { t, locale } = useLanguage();
  const router = useRouter();
  const byId = new Map(people.map((entry) => [entry.id, entry]));
  const related = (ids: string[]) => ids.map((id) => byId.get(id)).filter(Boolean) as Person[];
  const parents = related(person.parentIds);
  const spouses = related(person.spouseIds);
  const children = people
    .filter((entry) => entry.parentIds.includes(person.id))
    .sort((a, b) => (a.siblingOrder ?? Number.MAX_SAFE_INTEGER) - (b.siblingOrder ?? Number.MAX_SAFE_INTEGER));

  return (
    <div className="person-details-page relative flex flex-col gap-5">
      <button
        type="button"
        onClick={() => router.back()}
        className="person-details-back absolute start-0 top-0 hidden rounded-xl border px-4 py-2 text-sm font-medium transition md:inline-flex"
      >
        <span className="person-details-back-label">{t.people.backToPeople}</span>
      </button>
      <div className="mx-auto flex w-full max-w-xl flex-col gap-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          {displayFullName(person, locale)}
        </h1>
        {person.isDeceased && <p className="mt-1 text-sm text-black/60 dark:text-white/60">🕊️ {t.people.colDeceased}</p>}
      </div>

      <div className="person-details-grid grid gap-4 sm:grid-cols-2">
        <section className="person-details-section rounded-xl border p-4">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-black/50 dark:text-white/50">{t.form.parents}</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {parents.length > 0 ? parents.map((parent) => (
              <Link key={parent.id} href={`/people/${parent.id}`} style={genderTagStyle(parent.gender)} className="rounded-full border px-3 py-1 text-sm transition hover:brightness-110">
                <span className="person-details-tag-label">{displayFullName(parent, locale)}</span>
              </Link>
            )) : <span className="text-sm text-black/50 dark:text-white/50">-</span>}
          </div>
        </section>
        <section className="person-details-section rounded-xl border p-4">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-black/50 dark:text-white/50">{t.form.spouses}</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {spouses.length > 0 ? spouses.map((spouse) => (
              <Link key={spouse.id} href={`/people/${spouse.id}`} style={genderTagStyle(spouse.gender)} className="rounded-full border px-3 py-1 text-sm transition hover:brightness-110">
                <span className="person-details-tag-label">{displayFullName(spouse, locale)}</span>
              </Link>
            )) : <span className="text-sm text-black/50 dark:text-white/50">-</span>}
          </div>
        </section>
      </div>

      {children.length > 0 && (
        <section className="person-details-section rounded-xl border p-4">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-black/50 dark:text-white/50">{t.families.childrenLabel}</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {children.map((child) => (
              <Link key={child.id} href={`/people/${child.id}`} style={genderTagStyle(child.gender)} className="rounded-full border px-3 py-1 text-sm transition hover:brightness-110">
                <span className="person-details-tag-label">{displayFullName(child, locale)}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {(person.notes || person.siblingOrder !== undefined) && (
        <section className="person-details-section rounded-xl border p-4">
          {person.siblingOrder !== undefined && <p className="text-sm"><span className="font-medium">{t.people.siblingOrder}:</span> {person.siblingOrder}</p>}
          {person.notes && <p className="mt-3 whitespace-pre-wrap text-sm text-black/70 dark:text-white/70">{person.notes}</p>}
        </section>
      )}

      <button
        type="button"
        onClick={() => router.back()}
        className="person-details-back self-start rounded-xl border px-4 py-2 text-sm font-medium transition md:hidden"
      >
        <span className="person-details-back-label">{t.people.backToPeople}</span>
      </button>
      </div>
    </div>
  );
}
