"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { FamilyTree } from "@/components/FamilyTree";
import { useLanguage } from "@/components/LanguageProvider";
import { genderTagStyle } from "@/lib/personColors";
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
  const [isNarrowViewport, setIsNarrowViewport] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 640px)");
    const updateViewport = () => setIsNarrowViewport(media.matches);
    updateViewport();
    media.addEventListener("change", updateViewport);
    return () => media.removeEventListener("change", updateViewport);
  }, []);

  useEffect(() => {
    if (!openA && !openB) return;
    function closeOnOutsidePointer(event: PointerEvent) {
      if (!(event.target instanceof Element)) return;
      if (!event.target.closest(".relation-person-field")) {
        setOpenA(false);
        setOpenB(false);
      }
    }
    document.addEventListener("pointerdown", closeOnOutsidePointer, true);
    return () =>
      document.removeEventListener("pointerdown", closeOnOutsidePointer, true);
  }, [openA, openB]);
  const result = useMemo(() => {
    if (!idA || !idB || idA === idB) return "none";
    return findRelationship(people, idA, idB, locale);
  }, [idA, idB, locale, people]);

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
  const candidatesA = sorted.filter(
    (p) => p.id !== idB && (idA && openA ? true : matches(p, queryA)),
  );
  const candidatesB = sorted.filter(
    (p) => p.id !== idA && (idB && openB ? true : matches(p, queryB)),
  );

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
    setOpenA((prev) => !prev);
  }
  function toggleOpenB() {
    setOpenB((prev) => !prev);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="relation-picker-panel rounded-2xl border border-black/10 p-4 dark:border-white/10 sm:p-6">
        <div className="grid items-start gap-4 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] sm:gap-5">
        <label className={`relation-person-field relative z-10 flex min-w-0 flex-col gap-2 rounded-xl border border-black/10 p-3 text-sm dark:border-white/10 ${openA ? "z-30" : ""}`}>
          <span className="flex items-center gap-2 font-medium">
            <span
              style={personA ? genderTagStyle(personA.gender) : undefined}
              className="relation-person-index flex h-7 min-w-7 items-center justify-center rounded-full border border-black/10 px-2 text-xs font-bold dark:border-white/10"
            >
              A
            </span>
            {t.relations.personA}
          </span>
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
              className="relation-search-input w-full rounded-xl border border-black/15 bg-white px-3 py-2.5 pe-10 text-sm transition dark:border-white/20 dark:bg-neutral-950"
            />
            <button
              type="button"
              onClick={toggleOpenA}
              aria-label={t.relations.toggleList}
              className="relation-list-toggle absolute inset-y-0 end-0 flex w-10 items-center justify-center text-xs text-black/50 transition dark:text-white/50"
            >
              ▼
            </button>
            {openA && (
              <div className="relation-dropdown absolute inset-x-0 top-[calc(100%+0.4rem)] z-20 max-h-56 overflow-x-hidden overflow-y-auto rounded-xl border border-black/15 bg-white p-1 shadow-xl dark:border-white/20 dark:bg-neutral-950">
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
                    className="relation-candidate flex w-full min-w-0 items-center justify-start rounded-lg px-2 py-1.5 text-start text-sm transition hover:bg-black/5 dark:hover:bg-white/10"
                  >
                    <span style={genderTagStyle(p.gender)} className="max-w-full min-w-0 rounded-full border px-2.5 py-0.5 whitespace-normal break-words">
                      {displayFullName(p, locale)}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </label>

        <div aria-hidden="true" className="relation-picker-connector hidden h-10 w-10 items-center justify-center self-center rounded-full border border-black/10 text-lg text-black/45 dark:border-white/10 dark:text-white/45 sm:flex">
          ↔
        </div>

        <label className={`relation-person-field relative z-10 flex min-w-0 flex-col gap-2 rounded-xl border border-black/10 p-3 text-sm dark:border-white/10 ${openB ? "z-30" : ""}`}>
          <span className="flex items-center gap-2 font-medium">
            <span
              style={personB ? genderTagStyle(personB.gender) : undefined}
              className="relation-person-index flex h-7 min-w-7 items-center justify-center rounded-full border border-black/10 px-2 text-xs font-bold dark:border-white/10"
            >
              B
            </span>
            {t.relations.personB}
          </span>
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
              className="relation-search-input w-full rounded-xl border border-black/15 bg-white px-3 py-2.5 pe-10 text-sm transition dark:border-white/20 dark:bg-neutral-950"
            />
            <button
              type="button"
              onClick={toggleOpenB}
              aria-label={t.relations.toggleList}
              className="relation-list-toggle absolute inset-y-0 end-0 flex w-10 items-center justify-center text-xs text-black/50 transition dark:text-white/50"
            >
              ▼
            </button>
            {openB && (
              <div className="relation-dropdown absolute inset-x-0 top-[calc(100%+0.4rem)] z-20 max-h-56 overflow-x-hidden overflow-y-auto rounded-xl border border-black/15 bg-white p-1 shadow-xl dark:border-white/20 dark:bg-neutral-950">
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
                    className="relation-candidate flex w-full min-w-0 items-center justify-start rounded-lg px-2 py-1.5 text-start text-sm transition hover:bg-black/5 dark:hover:bg-white/10"
                  >
                    <span style={genderTagStyle(p.gender)} className="max-w-full min-w-0 rounded-full border px-2.5 py-0.5 whitespace-normal break-words">
                      {displayFullName(p, locale)}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </label>
        </div>

      </div>

      {idA && idB && idA !== idB && result === null && (
        <p className="relation-status rounded-xl border border-dashed border-black/15 px-4 py-3 text-sm text-black/60 dark:border-white/20 dark:text-white/60">
          {t.relations.noConnection}
        </p>
      )}

      {result && result !== "none" && result !== null && (
        <div
          key={`${idA}:${idB}:${locale}`}
          className="relationship-result-card flex flex-col gap-5 rounded-2xl border border-black/10 p-4 dark:border-white/10 sm:p-6"
        >
          <div className="relationship-summary rounded-xl border border-black/10 p-4 dark:border-white/10">
            <span className="text-xs uppercase tracking-wide text-black/50 dark:text-white/50">
              {t.relations.relationshipLabel}
            </span>
            <p className="mt-1 text-xl font-bold tracking-tight sm:text-2xl">
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
            <div className="mt-3 flex flex-wrap items-center gap-2.5 text-sm">
              {result.path.map((step, i) => (
                <span key={step.person.id} className="flex items-center gap-2.5">
                  {i > 0 && (
                    <span className="relationship-edge rounded-full border border-black/10 px-2 py-1 text-xs whitespace-nowrap text-black/50 dark:border-white/10 dark:text-white/50">
                      {arrow} ({EDGE_LABEL[step.edgeFromPrevious]}) {arrow}
                    </span>
                  )}
                  <span
                    style={genderTagStyle(step.person.gender)}
                    className="rounded-full border px-3 py-1.5 font-medium"
                  >
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
            <div className="relationship-graph-frame mt-3 rounded-xl border border-black/10 p-2 dark:border-white/10 sm:p-3">
              <FamilyTree
                key={`${idA}:${idB}:${isNarrowViewport ? "mobile" : "desktop"}`}
                people={result.rawPeople}
                center
                baseZoom={isNarrowViewport ? 0.8 : 1}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
