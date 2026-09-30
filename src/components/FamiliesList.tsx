"use client";

import Link from "next/link";
import { Fragment, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { FamilyTree } from "@/components/FamilyTree";
import { useLanguage } from "@/components/LanguageProvider";
import type { Family } from "@/lib/families";
import type { Person } from "@/lib/types";
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

export function FamiliesList({ families }: { families: Family[] }) {
  const { t, locale } = useLanguage();
  const { isAdmin } = useAuth();
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
      ...openFamily.parents.map((p) => ({
        ...p,
        parentIds: [],
        spouseIds: p.spouseIds.filter((id) => parentIds.has(id)),
        divorcedSpouseIds: p.divorcedSpouseIds?.filter((id) => parentIds.has(id)),
      })),
      ...openFamily.children.map((c) => ({
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
                          className="family-child-pill rounded-full border border-black/15 px-3 py-1 text-sm hover:border-emerald-500/40 hover:text-emerald-500 dark:border-white/20"
                        >
                          {displayFullName(c, locale)}
                          {c.isDeceased && " 🕊️"}
                        </Link>
                      ) : (
                        <span
                          key={c.id}
                          className="family-child-pill rounded-full border border-black/15 px-3 py-1 text-sm dark:border-white/20"
                        >
                          {displayFullName(c, locale)}
                          {c.isDeceased && " 🕊️"}
                        </span>
                      ),
                    )}
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => setOpenFamily(family)}
                className={`mt-auto w-full min-w-0 rounded-md border border-black/15 px-3 py-1.5 text-center text-sm whitespace-normal hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10 sm:w-auto ${locale === "ur" ? "sm:self-start" : "sm:self-end"}`}
              >
                {t.families.showGraph}
              </button>
            </div>
          ))}
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
          className={`fixed inset-0 m-auto max-h-[96vh] w-[calc(100%-2rem)] max-w-5xl rounded-xl border border-black/15 bg-white p-4 text-neutral-900 shadow-2xl backdrop:bg-black/70 dark:border-white/20 dark:bg-neutral-950 dark:text-white sm:p-6 ${graphFitReady ? "overflow-y-auto" : "overflow-y-hidden"}`}
        >
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <h2 id="family-graph-title" className="text-lg font-semibold">
                {t.families.graphTitle}
              </h2>
              <p className="text-sm text-black/60 dark:text-white/60">
                {openFamily.parents.map((p) => displayFullName(p, locale)).join(" + ")}
              </p>
            </div>
            <button
              type="button"
              autoFocus
              onClick={() => dialogRef.current?.close()}
              className="shrink-0 rounded-md border border-black/15 px-3 py-1 text-sm dark:border-white/20"
            >
              {t.families.closeGraph}
            </button>
          </div>
          <div dir="ltr" className="mb-3 flex items-center justify-between gap-3">
            <button
              type="button"
              aria-label={t.families.previousGraph}
              title={t.families.previousGraph}
              disabled={openFamilyIndex <= 0}
              onClick={() => moveGraph(-1)}
              className="flex h-9 w-9 items-center justify-center rounded-md border border-black/15 text-lg disabled:opacity-40 dark:border-white/20"
            >
              ←
            </button>
            <span className="min-w-16 text-center text-sm text-black/60 dark:text-white/60">
              {openFamilyIndex + 1} / {filtered.length}
            </span>
            <button
              type="button"
              aria-label={t.families.nextGraph}
              title={t.families.nextGraph}
              disabled={openFamilyIndex < 0 || openFamilyIndex >= filtered.length - 1}
              onClick={() => moveGraph(1)}
              className="flex h-9 w-9 items-center justify-center rounded-md border border-black/15 text-lg disabled:opacity-40 dark:border-white/20"
            >
              →
            </button>
          </div>
          <div ref={graphContainerRef} className={`min-w-0 w-full ${graphFitReady ? "" : "invisible"}`}>
            {graphWidth > 0 && (
              <FamilyTree
                key={`${openFamily.id}:${graphBaseZoom}`}
                people={graphPeople}
                center
                baseZoom={graphBaseZoom}
              />
            )}
          </div>
        </dialog>
      )}
    </div>
  );
}
