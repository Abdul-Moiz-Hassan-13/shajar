"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { DeletePersonButton } from "@/components/DeletePersonButton";
import { useLanguage } from "@/components/LanguageProvider";
import { displayFullName } from "@/lib/personName";
import type { Locale } from "@/lib/i18n/translations";
import type { Person } from "@/lib/types";

function fullName(p: Person): string {
  return `${p.firstName} ${p.lastName}`.trim();
}

function names(ids: string[], byId: Map<string, Person>, locale: Locale): string {
  const found = ids.map((id) => byId.get(id)).filter(Boolean) as Person[];
  if (found.length === 0) return "—";
  return found.map((p) => displayFullName(p, locale)).join(", ");
}

/** Only the current, living, non-divorced spouse(s) — not a deceased or
 * divorced former spouse. */
function currentSpouseNames(
  p: Person,
  byId: Map<string, Person>,
  locale: Locale,
): string {
  const divorced = new Set(p.divorcedSpouseIds ?? []);
  const found = p.spouseIds
    .filter((id) => !divorced.has(id))
    .map((id) => byId.get(id))
    .filter((sp): sp is Person => sp !== undefined && !sp.isDeceased);
  if (found.length === 0) return "—";
  return found.map((sp) => displayFullName(sp, locale)).join(", ");
}

export function PeopleTable({ people }: { people: Person[] }) {
  const { t, locale } = useLanguage();
  const [query, setQuery] = useState("");

  const byId = useMemo(() => new Map(people.map((p) => [p.id, p])), [people]);

  const sorted = useMemo(
    () => [...people].sort((a, b) => fullName(a).localeCompare(fullName(b))),
    [people],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return sorted;
    return sorted.filter((p) => fullName(p).toLowerCase().includes(q));
  }, [sorted, query]);

  if (people.length === 0) {
    return (
      <p className="text-black/60 dark:text-white/60">
        {t.people.noOneYet}{" "}
        <Link href="/people/new" className="underline">
          {t.people.addFirstPerson}
        </Link>
        .
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={t.people.searchPlaceholder}
        className="w-full sm:max-w-xs rounded-md border border-black/15 px-3 py-2 text-sm dark:border-white/20 dark:bg-transparent"
      />

      {filtered.length === 0 ? (
        <p className="text-sm text-black/60 dark:text-white/60">
          {t.people.noMatches(query)}
        </p>
      ) : (
        <div className="overflow-x-auto rounded-md border border-black/10 dark:border-white/10">
          <table className="w-full min-w-[640px] table-fixed text-left text-sm">
            <thead className="border-b border-black/10 bg-black/[0.02] dark:border-white/10 dark:bg-white/[0.03]">
              <tr>
                <th className="w-[22%] px-4 py-2 font-medium">{t.people.colName}</th>
                <th className="w-[10%] px-4 py-2 font-medium">{t.people.colDeceased}</th>
                <th className="w-[27%] px-4 py-2 font-medium">{t.people.colParents}</th>
                <th className="w-[27%] px-4 py-2 font-medium">{t.people.colSpouses}</th>
                <th className="w-[14%] px-4 py-2 font-medium" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr
                  key={p.id}
                  className="border-b border-black/5 last:border-0 dark:border-white/5"
                >
                  <td className="break-words px-4 py-2">{displayFullName(p, locale)}</td>
                  <td className="break-words px-4 py-2">{p.isDeceased ? t.people.yes : "—"}</td>
                  <td className="break-words px-4 py-2">{names(p.parentIds, byId, locale)}</td>
                  <td className="break-words px-4 py-2">{currentSpouseNames(p, byId, locale)}</td>
                  <td className="px-4 py-2">
                    <div className="flex items-center gap-3">
                      <Link
                        href={`/people/${p.id}`}
                        className="text-sm hover:underline"
                      >
                        {t.people.edit}
                      </Link>
                      <DeletePersonButton id={p.id} name={displayFullName(p, locale)} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
