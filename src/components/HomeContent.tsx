"use client";

import Link from "next/link";
import { useLanguage } from "@/components/LanguageProvider";
import { localizeNumber } from "@/lib/i18n/numerals";
import { displayFullName } from "@/lib/personName";
import type { Person } from "@/lib/types";

export function HomeContent({
  peopleCount,
  generations,
  couples,
  living,
  roots,
}: {
  peopleCount: number;
  generations: number;
  couples: number;
  living: number;
  roots: Person[];
}) {
  const { t, locale } = useLanguage();

  if (peopleCount === 0) {
    return (
      <div className="relative overflow-hidden rounded-3xl border border-black/10 py-24 text-center dark:border-white/10">
        <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-emerald-400/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-teal-400/20 blur-3xl" />
        <div className="relative flex flex-col items-center gap-6">
          <span className="text-7xl drop-shadow-sm">🌳</span>
          <div>
            <h1 className="bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500 bg-clip-text text-5xl font-extrabold tracking-tight text-transparent">
              {t.brand}
            </h1>
            <p className="mt-3 max-w-md text-black/60 dark:text-white/60">
              {t.home.emptyTagline}
            </p>
          </div>
          <Link
            href="/people/new"
            className="rounded-full bg-black px-6 py-3 text-sm font-medium text-white shadow-lg shadow-black/10 transition hover:scale-105 dark:bg-white dark:text-black"
          >
            {t.home.plantSeed}
          </Link>
        </div>
      </div>
    );
  }

  const stats = [
    { label: t.home.statPeople, value: peopleCount, icon: "🧑‍🤝‍🧑" },
    { label: t.home.statGenerations, value: generations, icon: "🌱" },
    { label: t.home.statCouples, value: Math.round(couples), icon: "💍" },
    { label: t.home.statLiving, value: living, icon: "✨" },
  ];

  return (
    <div className="flex flex-col gap-12">
      <div className="relative overflow-hidden rounded-3xl border border-black/10 bg-gradient-to-br from-emerald-500/10 via-transparent to-teal-400/10 px-8 py-14 dark:border-white/10">
        <div className="pointer-events-none absolute -left-20 -top-20 h-64 w-64 rounded-full bg-emerald-400/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -right-20 h-64 w-64 rounded-full bg-teal-400/20 blur-3xl" />
        <div className="relative flex flex-col items-center gap-2 text-center">
          <span className="text-3xl font-bold tracking-tight text-emerald-500">
            {t.home.welcomeBack}
          </span>
          <p className="max-w-md text-lg text-black/70 dark:text-white/70">
            {t.home.subtitle(peopleCount, generations)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {stats.map((s) => (
          <div
            key={s.label}
            className="flex flex-col items-center gap-1 rounded-xl border border-black/10 py-6 dark:border-white/10"
          >
            <span className="text-2xl">{s.icon}</span>
            <span className="text-2xl font-bold">{localizeNumber(s.value, locale)}</span>
            <span className="text-xs uppercase tracking-wide text-black/50 dark:text-white/50">
              {s.label}
            </span>
          </div>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          href="/tree"
          className="group flex flex-col gap-2 rounded-xl border border-black/10 bg-gradient-to-br from-emerald-500/5 to-transparent p-6 transition hover:border-emerald-500/40 dark:border-white/10"
        >
          <span className="text-2xl">🗺️</span>
          <span className="font-semibold group-hover:text-emerald-500">
            {t.home.exploreTree}
          </span>
          <span className="text-sm text-black/60 dark:text-white/60">
            {t.home.exploreTreeDesc}
          </span>
        </Link>
        <Link
          href="/people/new"
          className="group flex flex-col gap-2 rounded-xl border border-black/10 bg-gradient-to-br from-teal-400/5 to-transparent p-6 transition hover:border-teal-400/40 dark:border-white/10"
        >
          <span className="text-2xl">➕</span>
          <span className="font-semibold group-hover:text-teal-400">
            {t.home.addSomeoneNew}
          </span>
          <span className="text-sm text-black/60 dark:text-white/60">
            {t.home.addSomeoneNewDesc}
          </span>
        </Link>
      </div>

      {roots.length > 0 && (
        <div>
          <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-black/50 dark:text-white/50">
            {t.home.oldestBranches}
          </h2>
          <div className="flex flex-wrap gap-2">
            {roots.map((p) => (
              <Link
                key={p.id}
                href={`/people/${p.id}`}
                className="rounded-full border border-black/10 px-4 py-1.5 text-sm hover:border-emerald-500/40 hover:text-emerald-500 dark:border-white/10"
              >
                {displayFullName(p, locale)}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
