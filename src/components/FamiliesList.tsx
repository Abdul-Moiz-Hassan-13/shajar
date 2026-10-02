"use client";

import Link from "next/link";
import { Fragment, useLayoutEffect, useMemo, useRef, useState } from "react";
import { FamilyTree } from "@/components/FamilyTree";
import { useLanguage } from "@/components/LanguageProvider";
import type { Family } from "@/lib/families";
import type { Person } from "@/lib/types";
import { GENDER_COLOR, genderTagStyle } from "@/lib/personColors";
import { displayFullName } from "@/lib/personName";
import { computeLayout } from "@/lib/treeLayout";

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

function parentsLeftToRight(parents: Person[]): Person[] {
  const rank = (person: Person) =>
    person.gender === "male" ? 0 : person.gender === "female" ? 1 : 2;
  return parents
    .map((person, index) => ({ person, index }))
    .sort((a, b) => rank(a.person) - rank(b.person) || a.index - b.index)
    .map(({ person }) => person);
}

function childrenInTreeOrder(children: Person[]): Person[] {
  return children
    .map((person, index) => ({ person, index }))
    .sort((a, b) => {
      const orderA = a.person.siblingOrder ?? Number.MAX_SAFE_INTEGER;
      const orderB = b.person.siblingOrder ?? Number.MAX_SAFE_INTEGER;
      return orderA - orderB || a.index - b.index;
    })
    .map(({ person }) => person);
}

export function FamiliesList({ families }: { families: Family[] }) {
  const { t, locale } = useLanguage();
  const [query, setQuery] = useState("");
  const [openFamily, setOpenFamily] = useState<Family | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const graphContainerRef = useRef<HTMLDivElement>(null);
  const [graphWidth, setGraphWidth] = useState(0);
  const [heightFit, setHeightFit] = useState<{ familyId: string; zoom: number } | null>(null);

  const filtered = useMemo(
    () => families.filter((f) => familyMatches(f, query)),
    [families, query],
  );
  const openFamilyIndex = openFamily
    ? filtered.findIndex((family) => family.id === openFamily.id)
    : -1;
  const graphFitReady = heightFit?.familyId === openFamily?.id;

  function moveGraph(direction: -1 | 1) {
    const nextFamily = filtered[openFamilyIndex + direction];
    if (nextFamily) setOpenFamily(nextFamily);
  }

  const graphPeople = useMemo(() => {
    if (!openFamily) return [];
    const parentIds = new Set(openFamily.parents.map((p) => p.id));
    return [
      ...parentsLeftToRight(openFamily.parents).map((p) => ({
        ...p,
        parentIds: [],
        spouseIds: p.spouseIds.filter((id) => parentIds.has(id)),
        divorcedSpouseIds: p.divorcedSpouseIds?.filter((id) => parentIds.has(id)),
      })),
      ...childrenInTreeOrder(openFamily.children).map((c) => ({
        ...c,
        parentIds: c.parentIds.filter((id) => parentIds.has(id)),
        spouseIds: [],
        divorcedSpouseIds: [],
      })),
    ];
  }, [openFamily]);

  const graphLayout = useMemo(
    () => (openFamily ? computeLayout(graphPeople) : null),
    [openFamily, graphPeople],
  );
  const graphBaseZoom = graphLayout && graphWidth > 0
    ? Math.min(
        0.95,
        (graphWidth - 2) / (graphLayout.width + 40),
        heightFit && heightFit.familyId === openFamily?.id ? heightFit.zoom : Infinity,
      )
    : 0.95;

  const hasOpenFamily = openFamily !== null;
  useLayoutEffect(() => {
    if (!hasOpenFamily) return;
    const dialog = dialogRef.current;
    if (!dialog) return;
    dialog.showModal();
    return () => {
      if (dialog.open) dialog.close();
    };
  }, [hasOpenFamily]);

  useLayoutEffect(() => {
    if (!openFamily || !graphLayout) return;
    const dialog = dialogRef.current;
    const graphContainer = graphContainerRef.current;
    if (!dialog || !graphContainer) return;
    const measure = () => {
      setGraphWidth(graphContainer.clientWidth);
      const canvas = graphContainer.querySelector("svg")?.parentElement;
      if (!canvas) return;
      const style = getComputedStyle(dialog);
      const maxHeight = parseFloat(style.maxHeight);
      const borders = parseFloat(style.borderTopWidth) + parseFloat(style.borderBottomWidth);
      const fixedHeight = dialog.scrollHeight - canvas.offsetHeight;
      const fit = Math.max(
        0.05,
        (maxHeight - borders - fixedHeight - 4) / (graphLayout.height + 40),
      );
      const zoom = Number(fit.toFixed(4));
      setHeightFit((current) =>
        current?.familyId === openFamily.id && current.zoom === zoom
          ? current
          : { familyId: openFamily.id, zoom },
      );
    };
    const observer = new ResizeObserver(measure);
    observer.observe(graphContainer);
    window.addEventListener("resize", measure);
    measure();
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [openFamily, graphLayout]);

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
          {filtered.map((family, familyIndex) => {
            const displayedParents = parentsLeftToRight(family.parents);
            const displayedChildren = childrenInTreeOrder(family.children);
            const primaryColor = GENDER_COLOR[displayedParents[0]?.gender ?? "other"];
            const secondaryColor =
              GENDER_COLOR[
                displayedParents[1]?.gender ??
                  displayedParents[0]?.gender ??
                  "other"
              ];
            return (
              <div
                key={family.id}
                style={{
                  "--family-primary": primaryColor,
                  "--family-secondary": secondaryColor,
                  animationDelay: `${Math.min(familyIndex, 12) * 45}ms`,
                } as React.CSSProperties}
                className="family-card group relative flex flex-col gap-4 overflow-hidden rounded-2xl border p-5 shadow-sm"
              >
                <div
                  dir="ltr"
                  className="family-parent-row relative flex flex-wrap items-center gap-2.5"
                >
                  {displayedParents.map((p, i) => (
                    <Fragment key={p.id}>
                      {i > 0 && (
                        <span
                          className="family-parent-plus flex h-7 w-7 items-center justify-center rounded-full text-sm font-semibold"
                          aria-hidden="true"
                        >
                          <span className="family-parent-plus-label">+</span>
                        </span>
                      )}
                      <Link
                        href={`/people/${p.id}`}
                        style={genderTagStyle(p.gender)}
                        dir={locale === "ur" ? "rtl" : "ltr"}
                        className="family-parent-pill rounded-full border px-3 py-1 text-sm font-semibold transition hover:brightness-110"
                      >
                        <span className="family-parent-label">
                          {displayFullName(p, locale)}
                          {p.isDeceased && " 🕊️"}
                        </span>
                      </Link>
                    </Fragment>
                  ))}
                  {displayedParents.length === 1 && (
                    <span
                      dir={locale === "ur" ? "rtl" : "ltr"}
                      className="text-xs text-black/40 dark:text-white/40"
                    >
                      ({t.families.unknownParent})
                    </span>
                  )}
                  {family.status === "divorced" && (
                    <span
                      dir={locale === "ur" ? "rtl" : "ltr"}
                      className="rounded-full bg-black/5 px-2 py-0.5 text-xs dark:bg-white/10"
                    >
                      {t.form.divorced}
                    </span>
                  )}
                </div>

                <div className="relative flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs uppercase tracking-wide text-black/50 dark:text-white/50">
                      {t.families.childrenLabel}
                    </span>
                    <span className="family-child-count flex h-6 min-w-6 items-center justify-center rounded-full px-2 text-xs font-semibold">
                      <span className="family-child-count-label">{displayedChildren.length}</span>
                    </span>
                  </div>
                  {displayedChildren.length === 0 ? (
                    <p className="family-empty-children mt-2 rounded-xl border border-dashed px-3 py-3 text-sm text-black/50 dark:text-white/50">
                      {t.families.noChildren}
                    </p>
                  ) : (
                    <div dir="ltr" className="family-child-row mt-2 flex flex-wrap gap-2">
                      {displayedChildren.map((c) => (
                          <Link
                            key={c.id}
                            href={`/people/${c.id}`}
                            style={genderTagStyle(c.gender)}
                            dir={locale === "ur" ? "rtl" : "ltr"}
                            className="family-child-pill rounded-full border px-3 py-1 text-sm transition hover:-translate-y-0.5 hover:brightness-110 hover:shadow-sm"
                          >
                          <span className="family-child-label">
                            {displayFullName(c, locale)}
                            {c.isDeceased && " 🕊️"}
                          </span>
                          </Link>
                      ))}
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setOpenFamily(family)}
                  className={`family-graph-button relative mt-auto w-full min-w-0 overflow-hidden rounded-xl border px-4 py-2 text-center text-sm font-medium whitespace-normal transition sm:w-auto ${locale === "ur" ? "sm:self-start" : "sm:self-end"}`}
                >
                  {t.families.showGraph}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {openFamily && (
        <dialog
          ref={dialogRef}
          aria-labelledby="family-graph-title"
          onClose={() => setOpenFamily(null)}
          onKeyDown={(event) => {
            if (event.altKey || event.ctrlKey || event.metaKey) return;
            if (
              event.target instanceof Element &&
              event.target.closest('input, textarea, select, [contenteditable="true"]')
            ) return;
            if (event.key === "ArrowLeft" && openFamilyIndex > 0) {
              event.preventDefault();
              moveGraph(-1);
            } else if (event.key === "ArrowRight" && openFamilyIndex < filtered.length - 1) {
              event.preventDefault();
              moveGraph(1);
            }
          }}
          className={`family-graph-dialog fixed inset-0 m-auto max-h-[96vh] w-[calc(100%-2rem)] max-w-5xl rounded-2xl border border-black/15 bg-white p-0 text-neutral-900 shadow-2xl backdrop:bg-black/70 dark:border-white/20 dark:bg-neutral-950 dark:text-white ${graphFitReady ? "overflow-y-auto" : "overflow-y-hidden"}`}
        >
          <div className="family-graph-header flex items-start justify-between gap-4 border-b border-black/10 px-4 py-4 dark:border-white/10 sm:px-6 sm:py-5">
            <div className="min-w-0">
              <h2 id="family-graph-title" className="text-xl font-bold tracking-tight">
                {t.families.graphTitle}
              </h2>
              <div dir="ltr" className="mt-2 flex flex-wrap items-center gap-2">
                {parentsLeftToRight(openFamily.parents).map((parent, index) => (
                  <Fragment key={parent.id}>
                    {index > 0 && (
                      <span className="text-sm text-black/35 dark:text-white/35">+</span>
                    )}
                    <span
                      style={genderTagStyle(parent.gender)}
                      dir={locale === "ur" ? "rtl" : "ltr"}
                      className="rounded-full border px-3 py-1 text-sm font-medium"
                    >
                      <span className="family-parent-label">
                        {displayFullName(parent, locale)}
                      </span>
                    </span>
                  </Fragment>
                ))}
              </div>
            </div>
            <button
              type="button"
              autoFocus
              onClick={() => dialogRef.current?.close()}
              className="family-modal-close shrink-0 rounded-xl border border-black/15 px-3 py-2 text-sm font-medium transition dark:border-white/20"
            >
              <span className="family-modal-close-label">{t.families.closeGraph}</span>
            </button>
          </div>
          <div dir="ltr" className="family-graph-nav flex items-center justify-between gap-3 border-b border-black/10 px-4 py-3 dark:border-white/10 sm:px-6">
            <button
              type="button"
              aria-label={t.families.previousGraph}
              title={t.families.previousGraph}
              disabled={openFamilyIndex <= 0}
              onClick={() => moveGraph(-1)}
              className="family-graph-arrow flex h-11 w-11 items-center justify-center rounded-full border border-black/15 text-xl transition disabled:opacity-35 dark:border-white/20"
            >
              <span className="family-graph-arrow-icon">←</span>
            </button>
            <span className="family-graph-position min-w-20 rounded-full px-3 py-1.5 text-center text-sm font-medium text-black/65 dark:text-white/65">
              <span className="family-graph-position-label">
                {openFamilyIndex + 1} / {filtered.length}
              </span>
            </span>
            <button
              type="button"
              aria-label={t.families.nextGraph}
              title={t.families.nextGraph}
              disabled={openFamilyIndex < 0 || openFamilyIndex >= filtered.length - 1}
              onClick={() => moveGraph(1)}
              className="family-graph-arrow flex h-11 w-11 items-center justify-center rounded-full border border-black/15 text-xl transition disabled:opacity-35 dark:border-white/20"
            >
              <span className="family-graph-arrow-icon">→</span>
            </button>
          </div>
          <div className="p-3 sm:p-5">
            <div key={openFamily.id} ref={graphContainerRef} className={`family-graph-content min-w-0 w-full ${graphFitReady ? "" : "invisible"}`}>
              {graphWidth > 0 && (
                <FamilyTree
                  key={`${openFamily.id}:${graphBaseZoom}`}
                  people={graphPeople}
                  center
                  baseZoom={graphBaseZoom}
                />
              )}
            </div>
          </div>
        </dialog>
      )}
    </div>
  );
}
