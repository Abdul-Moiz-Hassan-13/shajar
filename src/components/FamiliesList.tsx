"use client";

import Link from "next/link";
import { Fragment, useMemo, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { useLanguage } from "@/components/LanguageProvider";
import type { Family } from "@/lib/families";
import type { Person } from "@/lib/types";
import { displayFullName } from "@/lib/personName";

function fullName(p: Person): string {
  return `${p.firstName} ${p.lastName}`.trim();
}

function familyMatches(family: Family, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return [...family.parents, ...family.children].some((p) =>
    fullName(p).toLowerCase().includes(q),
  );
}

export function FamiliesList({ families }: { families: Family[] }) {
  const { t, locale } = useLanguage();
  const { isAdmin } = useAuth();
  const [query, setQuery] = useState("");

  const filtered = useMemo(
    () => families.filter((f) => familyMatches(f, query)),
    [families, query],
  );

  if (families.length === 0) {
    return (
      <p className="text-black/60 dark:text-white/60">{t.families.noFamilies}</p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={t.people.searchPlaceholder}
        className="w-full rounded-md border border-black/15 px-3 py-2 text-sm dark:border-white/20 dark:bg-transparent"
      />

      {filtered.length === 0 ? (
        <p className="text-sm text-black/60 dark:text-white/60">
          {t.people.noMatches(query)}
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {filtered.map((family) => (
            <div
              key={family.id}
              className="flex flex-col gap-3 rounded-md border border-black/10 p-4 dark:border-white/10"
            >
              <div className="flex flex-wrap items-center gap-2">
                {family.parents.map((p, i) => (
                  <Fragment key={p.id}>
                    {i > 0 && (
                      <span className="text-black/40 dark:text-white/40">+</span>
                    )}
                    {isAdmin ? (
                      <Link
                        href={`/people/${p.id}`}
                        className="font-semibold hover:underline"
                      >
                        {displayFullName(p, locale)}
                      </Link>
                    ) : (
                      <span className="font-semibold">
                        {displayFullName(p, locale)}
                      </span>
                    )}
                    {p.isDeceased && <span>🕊️</span>}
                  </Fragment>
                ))}
                {family.parents.length === 1 && (
                  <span className="text-xs text-black/40 dark:text-white/40">
                    ({t.families.unknownParent})
                  </span>
                )}
                {family.status === "divorced" && (
                  <span className="rounded-full bg-black/5 px-2 py-0.5 text-xs dark:bg-white/10">
                    {t.form.divorced}
                  </span>
                )}
              </div>

              <div>
                <span className="text-xs uppercase tracking-wide text-black/50 dark:text-white/50">
                  {t.families.childrenLabel}
                </span>
                {family.children.length === 0 ? (
                  <p className="mt-1 text-sm text-black/50 dark:text-white/50">
                    {t.families.noChildren}
                  </p>
                ) : (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {family.children.map((c) =>
                      isAdmin ? (
                        <Link
                          key={c.id}
                          href={`/people/${c.id}`}
                          className="rounded-full border border-black/15 px-3 py-1 text-sm hover:border-emerald-500/40 hover:text-emerald-500 dark:border-white/20"
                        >
                          {displayFullName(c, locale)}
                          {c.isDeceased && " 🕊️"}
                        </Link>
                      ) : (
                        <span
                          key={c.id}
                          className="rounded-full border border-black/15 px-3 py-1 text-sm dark:border-white/20"
                        >
                          {displayFullName(c, locale)}
                          {c.isDeceased && " 🕊️"}
                        </span>
                      ),
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
