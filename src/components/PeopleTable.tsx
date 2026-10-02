"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { DeletePersonButton } from "@/components/DeletePersonButton";
import { useLanguage } from "@/components/LanguageProvider";
import { genderTagStyle } from "@/lib/personColors";
import { displayFullName } from "@/lib/personName";
import type { Locale } from "@/lib/i18n/translations";
import type { Person } from "@/lib/types";

function fullName(p: Person): string {
  return `${p.firstName} ${p.lastName}`.trim();
}

function names(ids: string[], byId: Map<string, Person>, locale: Locale): string {
  const found = ids.map((id) => byId.get(id)).filter(Boolean) as Person[];
  if (found.length === 0) return "-";
  return found.map((p) => displayFullName(p, locale)).join(", ");
}

/** Only the current, living, non-divorced spouse(s) - not a deceased or
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
  if (found.length === 0) return "-";
  return found.map((sp) => displayFullName(sp, locale)).join(", ");
}

export function PeopleTable({ people }: { people: Person[] }) {
  const { t, locale } = useLanguage();
  const { isAdmin } = useAuth();
  const router = useRouter();
  const [query, setQuery] = useState("");

  useEffect(() => {
    const key = "people-page-scroll-y";
    const returnKey = "people-return-scroll-y";
    const previousRestoration = window.history.scrollRestoration;
    window.history.scrollRestoration = "manual";
    const restoreScroll = () => {
      const current = sessionStorage.getItem(returnKey) ?? sessionStorage.getItem(key);
      if (current) window.scrollTo({ top: Number(current), behavior: "auto" });
    };
    const restoreAfterNavigation = () => {
      window.setTimeout(restoreScroll, 0);
      window.setTimeout(restoreScroll, 100);
      window.setTimeout(restoreScroll, 300);
    };
    const firstRestore = requestAnimationFrame(restoreScroll);
    const secondRestore = window.setTimeout(restoreScroll, 150);
    const finalRestore = window.setTimeout(restoreScroll, 400);
    const restoreInterval = window.setInterval(restoreScroll, 50);
    const stopInterval = window.setTimeout(() => window.clearInterval(restoreInterval), 1200);
    window.addEventListener("popstate", restoreAfterNavigation);
    window.addEventListener("pageshow", restoreAfterNavigation);
    const saveScroll = () => sessionStorage.setItem(key, String(window.scrollY));
    window.addEventListener("scroll", saveScroll, { passive: true });
    return () => {
      cancelAnimationFrame(firstRestore);
      window.clearTimeout(secondRestore);
      window.clearTimeout(finalRestore);
      window.clearTimeout(stopInterval);
      window.clearInterval(restoreInterval);
      window.removeEventListener("popstate", restoreAfterNavigation);
      window.removeEventListener("pageshow", restoreAfterNavigation);
      window.history.scrollRestoration = previousRestoration;
      window.removeEventListener("scroll", saveScroll);
    };
  }, []);

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

  function openPerson(id: string) {
    if (isAdmin) {
      const scrollPosition = String(window.scrollY);
      sessionStorage.setItem("people-page-scroll-y", scrollPosition);
      sessionStorage.setItem("people-return-scroll-y", scrollPosition);
      router.push(`/people/${id}`);
    }
  }

  if (people.length === 0) {
    return (
      <p className="text-black/60 dark:text-white/60">
        {t.people.noOneYet}
        {isAdmin && (
          <>
            {" "}
            <Link href="/people/new" className="underline">
              {t.people.addFirstPerson}
            </Link>
          </>
        )}
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
        className="people-search-input w-full rounded-xl border border-black/15 px-3 py-2.5 text-sm dark:border-white/20 dark:bg-transparent"
      />

      {filtered.length === 0 ? (
        <p className="text-sm text-black/60 dark:text-white/60">
          {t.people.noMatches(query)}
        </p>
      ) : (
        <>
          {/* Below `sm` a wide fixed-column table only ever fit by scrolling
              sideways, which is fiddly to read a row from on a phone - a
              stacked card per person scrolls with the rest of the page
              instead. Desktop keeps the table; only one of the two renders
              at a given width. */}
          <div className="flex flex-col gap-3 sm:hidden">
            {filtered.map((p) => (
              <div
                key={p.id}
                onClick={() => openPerson(p.id)}
                onKeyDown={(event) => {
                  if (isAdmin && (event.key === "Enter" || event.key === " ")) {
                    event.preventDefault();
                    openPerson(p.id);
                  }
                }}
                role={isAdmin ? "link" : undefined}
                tabIndex={isAdmin ? 0 : undefined}
                style={{ borderColor: `color-mix(in srgb, ${p.gender === "male" ? "#8fb8de" : p.gender === "female" ? "#e6a4c4" : "var(--foreground)"} 35%, transparent)` }}
                className={`people-person-card flex flex-col gap-3 rounded-2xl border p-4 text-sm transition ${isAdmin ? "cursor-pointer" : ""}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span style={genderTagStyle(p.gender)} className="rounded-full border px-3 py-1 font-semibold">
                    {displayFullName(p, locale)}
                  </span>
                  {p.isDeceased && <span aria-label={t.people.colDeceased}>🕊️</span>}
                </div>
                <div>
                  <span className="text-xs uppercase tracking-wide text-black/50 dark:text-white/50">
                    {t.people.colParents}
                  </span>
                  <p>{names(p.parentIds, byId, locale)}</p>
                </div>
                <div>
                  <span className="text-xs uppercase tracking-wide text-black/50 dark:text-white/50">
                    {t.people.colSpouses}
                  </span>
                  <p>{currentSpouseNames(p, byId, locale)}</p>
                </div>
                {isAdmin && (
                  <div className="flex items-center gap-3 pt-1">
                    <DeletePersonButton id={p.id} name={displayFullName(p, locale)} />
                  </div>
                )}
              </div>
            ))}
          </div>

              <div className="people-table-frame hidden overflow-x-auto rounded-2xl border border-black/10 sm:block dark:border-white/10">
            <table className="people-table w-full min-w-[640px] table-fixed text-left text-sm">
              <thead className="border-b border-black/10 bg-black/[0.02] dark:border-white/10 dark:bg-white/[0.03]">
                <tr>
                  <th className={`${isAdmin ? "w-[22%]" : "w-[25%]"} px-4 py-2 font-medium`}>
                    {t.people.colName}
                  </th>
                  <th className={`${isAdmin ? "w-[10%]" : "w-[12%]"} px-4 py-2 font-medium`}>
                    {t.people.colDeceased}
                  </th>
                  <th className={`${isAdmin ? "w-[27%]" : "w-[31.5%]"} px-4 py-2 font-medium`}>
                    {t.people.colParents}
                  </th>
                  <th className={`${isAdmin ? "w-[27%]" : "w-[31.5%]"} px-4 py-2 font-medium`}>
                    {t.people.colSpouses}
                  </th>
                  {isAdmin && <th className="w-[14%] px-4 py-2 font-medium" />}
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr
                    key={p.id}
                    onClick={() => openPerson(p.id)}
                    onKeyDown={(event) => {
                      if (isAdmin && (event.key === "Enter" || event.key === " ")) {
                        event.preventDefault();
                        openPerson(p.id);
                      }
                    }}
                    role={isAdmin ? "link" : undefined}
                    tabIndex={isAdmin ? 0 : undefined}
                    className={`people-table-row border-b border-black/5 last:border-0 dark:border-white/5 ${isAdmin ? "cursor-pointer" : ""}`}
                  >
                    <td className="break-words px-4 py-2">
                      <span style={genderTagStyle(p.gender)} className="inline-flex rounded-full border px-3 py-1 font-medium">
                        {displayFullName(p, locale)}
                      </span>
                    </td>
                    <td className="break-words px-4 py-2">{p.isDeceased ? t.people.yes : "-"}</td>
                    <td className="break-words px-4 py-2">{names(p.parentIds, byId, locale)}</td>
                    <td className="break-words px-4 py-2">{currentSpouseNames(p, byId, locale)}</td>
                    {isAdmin && (
                      <td className="px-4 py-2">
                        <div className="flex items-center gap-3">
                          <DeletePersonButton id={p.id} name={displayFullName(p, locale)} />
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
