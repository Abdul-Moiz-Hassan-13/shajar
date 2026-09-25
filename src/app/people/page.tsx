import Link from "next/link";
import { DeletePersonButton } from "@/components/DeletePersonButton";
import { getAllPeople } from "@/lib/store";
import type { Person } from "@/lib/types";

function fullName(p: Person): string {
  return `${p.firstName} ${p.lastName}`.trim();
}

function names(ids: string[], byId: Map<string, Person>): string {
  const found = ids.map((id) => byId.get(id)).filter(Boolean) as Person[];
  if (found.length === 0) return "—";
  return found.map(fullName).join(", ");
}

export default async function PeoplePage() {
  const people = await getAllPeople();
  const byId = new Map(people.map((p) => [p.id, p]));
  const sorted = [...people].sort((a, b) =>
    fullName(a).localeCompare(fullName(b)),
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">People</h1>
        <Link
          href="/people/new"
          className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white dark:bg-white dark:text-black"
        >
          Add a person
        </Link>
      </div>

      {sorted.length === 0 ? (
        <p className="text-black/60 dark:text-white/60">
          No one here yet.{" "}
          <Link href="/people/new" className="underline">
            Add the first person
          </Link>
          .
        </p>
      ) : (
        <div className="overflow-x-auto rounded-md border border-black/10 dark:border-white/10">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-black/10 bg-black/[0.02] dark:border-white/10 dark:bg-white/[0.03]">
              <tr>
                <th className="px-4 py-2 font-medium">Name</th>
                <th className="px-4 py-2 font-medium">Born</th>
                <th className="px-4 py-2 font-medium">Died</th>
                <th className="px-4 py-2 font-medium">Parents</th>
                <th className="px-4 py-2 font-medium">Spouses</th>
                <th className="px-4 py-2 font-medium" />
              </tr>
            </thead>
            <tbody>
              {sorted.map((p) => (
                <tr
                  key={p.id}
                  className="border-b border-black/5 last:border-0 dark:border-white/5"
                >
                  <td className="px-4 py-2">{fullName(p)}</td>
                  <td className="px-4 py-2">{p.birthDate ?? "—"}</td>
                  <td className="px-4 py-2">{p.deathDate ?? "—"}</td>
                  <td className="px-4 py-2">{names(p.parentIds, byId)}</td>
                  <td className="px-4 py-2">{names(p.spouseIds, byId)}</td>
                  <td className="px-4 py-2">
                    <div className="flex items-center gap-3">
                      <Link
                        href={`/people/${p.id}`}
                        className="text-sm hover:underline"
                      >
                        Edit
                      </Link>
                      <DeletePersonButton id={p.id} name={fullName(p)} />
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
