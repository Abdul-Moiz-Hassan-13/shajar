"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { FamilyTree } from "@/components/FamilyTree";
import { useLanguage } from "@/components/LanguageProvider";
import { displayFullName } from "@/lib/personName";
import { findRelationship } from "@/lib/relationship";
import type { Person } from "@/lib/types";

function fullName(p: Person): string {
  return `${p.firstName} ${p.lastName}`.trim();
}

export function RelationshipFinder({ people }: { people: Person[] }) {
  const { t, locale } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();
  const EDGE_LABEL: Record<string, string> = {
    up: t.edgeLabels.up,
    down: t.edgeLabels.down,
    spouse: t.edgeLabels.spouse,
    sibling: t.edgeLabels.sibling,
  };
  const arrow = locale === "ur" ? "←" : "→";
  const sorted = useMemo(
    () => [...people].sort((a, b) => fullName(a).localeCompare(fullName(b))),
    [people],
  );
  const byId = useMemo(() => new Map(people.map((p) => [p.id, p])), [people]);

  // Selected people persist across a page refresh via the URL (?a=&b=)
  // instead of plain component state, which a reload would otherwise reset.
  const initialIdA = searchParams.get("a") ?? "";
  const initialIdB = searchParams.get("b") ?? "";
  const initialPersonA = initialIdA ? byId.get(initialIdA) : undefined;
  const initialPersonB = initialIdB ? byId.get(initialIdB) : undefined;

  const [idA, setIdA] = useState(initialPersonA ? initialIdA : "");
  const [idB, setIdB] = useState(initialPersonB ? initialIdB : "");
  const [queryA, setQueryA] = useState(
    initialPersonA ? displayFullName(initialPersonA, locale) : "",
  );
  const [queryB, setQueryB] = useState(
    initialPersonB ? displayFullName(initialPersonB, locale) : "",
  );
  const [openA, setOpenA] = useState(false);
  const [openB, setOpenB] = useState(false);
  // Whether the user has asked for a relationship at all (vs. just having
  // picked people). The result itself is *derived*, not stored - so it can
  // never go stale relative to the current selection or language, unlike a
  // separately-tracked value that needs manual re-syncing on every change.
  const [searched, setSearched] = useState(
    Boolean(initialPersonA && initialPersonB),
  );

  const result = useMemo(() => {
    if (!searched) return null;
    if (!idA || !idB || idA === idB) return "none";
    return findRelationship(people, idA, idB, locale);
  }, [searched, idA, idB, locale, people]);

  function updateUrl(nextIdA: string, nextIdB: string) {
    const params = new URLSearchParams();
    if (nextIdA) params.set("a", nextIdA);
    if (nextIdB) params.set("b", nextIdB);
    const qs = params.toString();
    router.replace(qs ? `/relations?${qs}` : "/relations", { scroll: false });
  }

  function matches(p: Person, query: string): boolean {
    return fullName(p).toLowerCase().includes(query.trim().toLowerCase());
  }

  // Once a person is actually selected, always display their name in the
  // *current* language - derived from idA/idB + locale, not the query text
  // captured at selection time, so a later language switch can't leave a
  // stale name behind.
  const personA = idA ? byId.get(idA) : undefined;
  const personB = idB ? byId.get(idB) : undefined;
  const displayedQueryA = personA ? displayFullName(personA, locale) : queryA;
  const displayedQueryB = personB ? displayFullName(personB, locale) : queryB;

  // Exclude whichever person is already picked in the other field - the
  // same person can't be related to themselves.
  const candidatesA = sorted.filter((p) => p.id !== idB && matches(p, queryA));
  const candidatesB = sorted.filter((p) => p.id !== idA && matches(p, queryB));

  function selectA(p: Person) {
    setIdA(p.id);
    setQueryA(displayFullName(p, locale));
    setOpenA(false);
    updateUrl(p.id, idB);
  }
  function selectB(p: Person) {
    setIdB(p.id);
    setQueryB(displayFullName(p, locale));
    setOpenB(false);
    updateUrl(idA, p.id);
  }

  function toggleOpenA() {
    if (idA) {
      setIdA("");
      setQueryA("");
      updateUrl("", idB);
    }
    setOpenA((prev) => !prev);
  }
  function toggleOpenB() {
    if (idB) {
      setIdB("");
      setQueryB("");
      updateUrl(idA, "");
    }
    setOpenB((prev) => !prev);
  }

  function handleFind() {
    setSearched(true);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm">
          {t.relations.personA}
          <div className="relative">
            <input
              type="search"
              value={displayedQueryA}
              onChange={(e) => {
                setQueryA(e.target.value);
                setIdA("");
                setOpenA(true);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  if (candidatesA.length > 0) selectA(candidatesA[0]);
                }
              }}
              placeholder={t.relations.searchPlaceholder}
              className="w-full rounded-md border border-black/15 px-3 py-2 pr-8 text-sm dark:border-white/20 dark:bg-transparent"
            />
            <button
              type="button"
              onClick={toggleOpenA}
              aria-label={t.relations.toggleList}
              className="absolute inset-y-0 right-0 flex w-8 items-center justify-center text-black/50 dark:text-white/50"
            >
              ▼
            </button>
          </div>
          {(queryA || openA) && !idA && (
            <div className="max-h-48 overflow-y-auto rounded-md border border-black/15 dark:border-white/20">
              {candidatesA.length === 0 && (
                <p className="px-3 py-2 text-sm text-black/50 dark:text-white/50">
                  {t.relations.noMatches}
                </p>
              )}
              {candidatesA.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => selectA(p)}
                  className="block w-full px-3 py-1.5 text-left text-sm hover:bg-black/5 dark:hover:bg-white/10"
                >
                  {displayFullName(p, locale)}
                </button>
              ))}
            </div>
          )}
        </label>
        <label className="flex flex-col gap-1 text-sm">
          {t.relations.personB}
          <div className="relative">
            <input
              type="search"
              value={displayedQueryB}
              onChange={(e) => {
                setQueryB(e.target.value);
                setIdB("");
                setOpenB(true);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  if (candidatesB.length > 0) selectB(candidatesB[0]);
                }
              }}
              placeholder={t.relations.searchPlaceholder}
              className="w-full rounded-md border border-black/15 px-3 py-2 pr-8 text-sm dark:border-white/20 dark:bg-transparent"
            />
            <button
              type="button"
              onClick={toggleOpenB}
              aria-label={t.relations.toggleList}
              className="absolute inset-y-0 right-0 flex w-8 items-center justify-center text-black/50 dark:text-white/50"
            >
              ▼
            </button>
          </div>
          {(queryB || openB) && !idB && (
            <div className="max-h-48 overflow-y-auto rounded-md border border-black/15 dark:border-white/20">
              {candidatesB.length === 0 && (
                <p className="px-3 py-2 text-sm text-black/50 dark:text-white/50">
                  {t.relations.noMatches}
                </p>
              )}
              {candidatesB.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => selectB(p)}
                  className="block w-full px-3 py-1.5 text-left text-sm hover:bg-black/5 dark:hover:bg-white/10"
                >
                  {displayFullName(p, locale)}
                </button>
              ))}
            </div>
          )}
        </label>
      </div>

      <button
        onClick={handleFind}
        className="self-start rounded-md bg-black px-4 py-2 text-sm font-medium text-white dark:bg-white dark:text-black"
      >
        {t.relations.findRelationship}
      </button>

      {result === "none" && (
        <p className="text-sm text-black/60 dark:text-white/60">
          {t.relations.pickTwoFirst}
        </p>
      )}

      {result && result !== "none" && result === null && (
        <p className="text-sm text-black/60 dark:text-white/60">
          {t.relations.noConnection}
        </p>
      )}

      {result && result !== "none" && result !== null && (
        <div className="flex flex-col gap-4 rounded-md border border-black/10 p-4 dark:border-white/10">
          <div>
            <span className="text-xs uppercase tracking-wide text-black/50 dark:text-white/50">
              {t.relations.relationshipLabel}
            </span>
            <p className="text-xl font-semibold">
              {t.relations.isRelationOf(
                displayFullName(result.path[result.path.length - 1].person, locale),
                displayFullName(result.path[0].person, locale),
                result.label,
                result.path[result.path.length - 1].person.gender,
              )}
            </p>
          </div>
          <div>
            <span className="text-xs uppercase tracking-wide text-black/50 dark:text-white/50">
              {t.relations.connectedVia}
            </span>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-sm">
              {result.path.map((step, i) => (
                <span key={step.person.id} className="flex items-center gap-3">
                  {i > 0 && (
                    <span className="whitespace-nowrap text-black/40 dark:text-white/40">
                      {arrow} ({EDGE_LABEL[step.edgeFromPrevious]}) {arrow}
                    </span>
                  )}
                  <span className="rounded-full border border-black/15 px-3 py-1 dark:border-white/20">
                    {displayFullName(step.person, locale)}
                  </span>
                </span>
              ))}
            </div>
          </div>
          <div>
            <span className="text-xs uppercase tracking-wide text-black/50 dark:text-white/50">
              {t.relations.graph}
            </span>
            <div className="mt-2">
              <FamilyTree people={result.rawPeople} center />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
