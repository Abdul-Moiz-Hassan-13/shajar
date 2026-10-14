"use client";

import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { useLanguage } from "@/components/LanguageProvider";
import { localizeNumber } from "@/lib/i18n/numerals";

export function HomeContent({
  peopleCount,
  generations,
  couples,
  living,
}: {
  peopleCount: number;
  generations: number;
  couples: number;
  living: number;
}) {
  const { t, locale } = useLanguage();
  const { isAdmin } = useAuth();

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
          {isAdmin && (
            <Link
              href="/people/new"
              className="rounded-lg bg-black px-6 py-3 text-sm font-medium text-white shadow-lg shadow-black/10 transition hover:scale-105 dark:bg-white dark:text-black"
            >
              {t.home.plantSeed}
            </Link>
          )}
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
    <div className={`home-content -mt-2 flex flex-col gap-8 ${isAdmin ? "" : "home-nonadmin-home"}`}>
      <div className="home-welcome-panel relative flex items-center justify-center overflow-hidden rounded-3xl border border-black/10 bg-gradient-to-br from-emerald-500/10 via-transparent to-teal-400/10 px-6 py-4 dark:border-white/10">
        <div className="pointer-events-none absolute -left-20 -top-20 h-64 w-64 rounded-full bg-emerald-400/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -right-20 h-64 w-64 rounded-full bg-teal-400/20 blur-3xl" />
        <div className="relative flex h-full w-full flex-col items-center justify-center gap-2 text-center">
          <span className="home-welcome-title text-3xl font-bold tracking-tight text-emerald-500">
            {t.home.welcomeBack}
          </span>
          <p className="max-w-md text-lg text-black/70 dark:text-white/70">
            {t.home.subtitle(peopleCount, generations)}
          </p>
        </div>
      </div>

      <div className="home-stats-grid grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((s) => (
          <div
            key={s.label}
            className="home-stat-card flex flex-col items-center gap-0 rounded-xl border border-black/10 py-0 dark:border-white/10"
          >
            <span className="text-xl">{s.icon}</span>
            <span className="text-xl font-bold">{localizeNumber(s.value, locale)}</span>
            <span className="text-xs uppercase tracking-wide text-black/50 dark:text-white/50">
              {s.label}
            </span>
          </div>
        ))}
      </div>

      <div className="home-actions-grid grid gap-3 sm:grid-cols-2">
        <Link
          href="/tree"
          className={`home-action-card home-admin-action-card group flex flex-col gap-2 rounded-xl border border-black/10 bg-gradient-to-br from-emerald-500/5 to-transparent p-3 transition hover:border-emerald-500/40 dark:border-white/10 ${isAdmin ? "" : "home-nonadmin-action-card"}`}
        >
          <span className="home-map-icon flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/15 text-2xl" aria-hidden="true">
            <span className="home-map-label home-map-label-admin">🗺️</span>
          </span>
          <span className="font-semibold group-hover:text-emerald-500">
            {t.home.exploreTree}
          </span>
          <span className="text-sm text-black/60 dark:text-white/60">
            {t.home.exploreTreeDesc}
          </span>
        </Link>
        {!isAdmin && (
          <Link
            href="/relations"
            className="home-action-card home-admin-action-card home-nonadmin-action-card group flex flex-col gap-2 rounded-xl border border-black/10 bg-gradient-to-br from-teal-400/5 to-transparent p-3 transition hover:border-teal-400/40 dark:border-white/10"
          >
            <span className="home-add-icon flex h-12 w-12 items-center justify-center rounded-xl bg-teal-400/15 text-2xl" aria-hidden="true">
              <span className="home-add-label">🔗</span>
            </span>
            <span className="font-semibold group-hover:text-teal-400">
              {t.nav.relations}
            </span>
            <span className="text-sm text-black/60 dark:text-white/60">
              {t.relations.subtitle}
            </span>
          </Link>
        )}
        {isAdmin && (
          <Link
            href="/people/new"
            className="home-action-card home-admin-action-card group flex flex-col gap-2 rounded-xl border border-black/10 bg-gradient-to-br from-teal-400/5 to-transparent p-3 transition hover:border-teal-400/40 dark:border-white/10"
          >
            <span className="home-add-icon flex h-12 w-12 items-center justify-center rounded-xl bg-teal-400/15 text-2xl" aria-hidden="true">
              <span className="home-add-label">➕</span>
            </span>
            <span className="font-semibold group-hover:text-teal-400">
              {t.home.addSomeoneNew}
            </span>
            <span className="text-sm text-black/60 dark:text-white/60">
              {t.home.addSomeoneNewDesc}
            </span>
          </Link>
        )}
      </div>

    </div>
  );
}
