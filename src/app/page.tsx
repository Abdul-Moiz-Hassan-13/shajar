import Link from "next/link";
import { computeLayout } from "@/lib/treeLayout";
import { getAllPeople } from "@/lib/store";
import type { Person } from "@/lib/types";

function fullName(p: Person): string {
  return `${p.firstName} ${p.lastName}`.trim();
}

export default async function Home() {
  const people = await getAllPeople();

  if (people.length === 0) {
    return (
      <div className="relative overflow-hidden rounded-3xl border border-black/10 py-24 text-center dark:border-white/10">
        <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-emerald-400/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-teal-400/20 blur-3xl" />
        <div className="relative flex flex-col items-center gap-6">
          <span className="text-7xl drop-shadow-sm">🌳</span>
          <div>
            <h1 className="bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500 bg-clip-text text-5xl font-extrabold tracking-tight text-transparent">
              Shajar
            </h1>
            <p className="mt-3 max-w-md text-black/60 dark:text-white/60">
              Every family tree starts with a single name. Plant yours and
              watch the branches grow.
            </p>
          </div>
          <Link
            href="/people/new"
            className="rounded-full bg-black px-6 py-3 text-sm font-medium text-white shadow-lg shadow-black/10 transition hover:scale-105 dark:bg-white dark:text-black"
          >
            Plant the first seed 🌱
          </Link>
        </div>
      </div>
    );
  }

  const layout = computeLayout(people);
  const generations = layout.nodes.reduce(
    (max, n) => Math.max(max, n.gen),
    0,
  ) + 1;
  const roots = people.filter((p) => p.parentIds.length === 0);
  const couples = people.filter((p) => p.spouseIds.length > 0).length / 2;
  const living = people.filter((p) => !p.isDeceased).length;

  const stats = [
    { label: "People", value: people.length, icon: "🧑‍🤝‍🧑" },
    { label: "Generations", value: generations, icon: "🌱" },
    { label: "Couples", value: Math.round(couples), icon: "💍" },
    { label: "Living", value: living, icon: "✨" },
  ];

  return (
    <div className="flex flex-col gap-12">
      <div className="relative overflow-hidden rounded-3xl border border-black/10 bg-gradient-to-br from-emerald-500/10 via-transparent to-teal-400/10 px-8 py-14 dark:border-white/10">
        <div className="pointer-events-none absolute -left-20 -top-20 h-64 w-64 rounded-full bg-emerald-400/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -right-20 h-64 w-64 rounded-full bg-teal-400/20 blur-3xl" />
        <div className="relative flex flex-col items-center gap-2 text-center">
          <span className="text-3xl font-bold tracking-tight text-emerald-500">
            Welcome back
          </span>
          <p className="max-w-md text-lg text-black/70 dark:text-white/70">
            {people.length} {people.length === 1 ? "story" : "stories"} across{" "}
            {generations} {generations === 1 ? "generation" : "generations"},
            and counting.
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
            <span className="text-2xl font-bold">{s.value}</span>
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
            Explore the tree
          </span>
          <span className="text-sm text-black/60 dark:text-white/60">
            See how everyone connects, generation by generation.
          </span>
        </Link>
        <Link
          href="/people/new"
          className="group flex flex-col gap-2 rounded-xl border border-black/10 bg-gradient-to-br from-teal-400/5 to-transparent p-6 transition hover:border-teal-400/40 dark:border-white/10"
        >
          <span className="text-2xl">➕</span>
          <span className="font-semibold group-hover:text-teal-400">
            Add someone new
          </span>
          <span className="text-sm text-black/60 dark:text-white/60">
            Bring another relative into the tree.
          </span>
        </Link>
      </div>

      {roots.length > 0 && (
        <div>
          <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-black/50 dark:text-white/50">
            The oldest branches
          </h2>
          <div className="flex flex-wrap gap-2">
            {roots.map((p) => (
              <Link
                key={p.id}
                href={`/people/${p.id}`}
                className="rounded-full border border-black/10 px-4 py-1.5 text-sm hover:border-emerald-500/40 hover:text-emerald-500 dark:border-white/10"
              >
                {fullName(p)}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
