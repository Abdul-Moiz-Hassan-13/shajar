"use client";

import { useMemo, useState } from "react";
import { FamilyTree } from "@/components/FamilyTree";
import { findRelationship } from "@/lib/relationship";
import type { Person } from "@/lib/types";

function fullName(p: Person): string {
  return `${p.firstName} ${p.lastName}`.trim();
}

const EDGE_LABEL: Record<string, string> = {
  up: "parent",
  down: "child",
  spouse: "spouse",
  sibling: "sibling",
};

export function RelationshipFinder({ people }: { people: Person[] }) {
  const sorted = useMemo(
    () => [...people].sort((a, b) => fullName(a).localeCompare(fullName(b))),
    [people],
  );

  const [idA, setIdA] = useState("");
  const [idB, setIdB] = useState("");
  const [queryA, setQueryA] = useState("");
  const [queryB, setQueryB] = useState("");
  const [result, setResult] = useState<
    ReturnType<typeof findRelationship> | "none" | null
  >(null);

  function matches(p: Person, query: string): boolean {
    return fullName(p).toLowerCase().includes(query.trim().toLowerCase());
  }

  const candidatesA = sorted.filter((p) => matches(p, queryA));
  const candidatesB = sorted.filter((p) => matches(p, queryB));

  function selectA(p: Person) {
    setIdA(p.id);
    setQueryA(fullName(p));
  }
  function selectB(p: Person) {
    setIdB(p.id);
    setQueryB(fullName(p));
  }

  function handleFind() {
    if (!idA || !idB || idA === idB) {
      setResult("none");
      return;
    }
    setResult(findRelationship(people, idA, idB));
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm">
          Person A
          <input
            type="search"
            value={queryA}
            onChange={(e) => {
              setQueryA(e.target.value);
              setIdA("");
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                if (candidatesA.length > 0) selectA(candidatesA[0]);
              }
            }}
            placeholder="Search…"
            className="rounded-md border border-black/15 px-3 py-2 text-sm dark:border-white/20 dark:bg-transparent"
          />
          {queryA && !idA && (
            <div className="max-h-48 overflow-y-auto rounded-md border border-black/15 dark:border-white/20">
              {candidatesA.length === 0 && (
                <p className="px-3 py-2 text-sm text-black/50 dark:text-white/50">
                  No matches.
                </p>
              )}
              {candidatesA.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => selectA(p)}
                  className="block w-full px-3 py-1.5 text-left text-sm hover:bg-black/5 dark:hover:bg-white/10"
                >
                  {fullName(p)}
                </button>
              ))}
            </div>
          )}
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Person B
          <input
            type="search"
            value={queryB}
            onChange={(e) => {
              setQueryB(e.target.value);
              setIdB("");
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                if (candidatesB.length > 0) selectB(candidatesB[0]);
              }
            }}
            placeholder="Search…"
            className="rounded-md border border-black/15 px-3 py-2 text-sm dark:border-white/20 dark:bg-transparent"
          />
          {queryB && !idB && (
            <div className="max-h-48 overflow-y-auto rounded-md border border-black/15 dark:border-white/20">
              {candidatesB.length === 0 && (
                <p className="px-3 py-2 text-sm text-black/50 dark:text-white/50">
                  No matches.
                </p>
              )}
              {candidatesB.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => selectB(p)}
                  className="block w-full px-3 py-1.5 text-left text-sm hover:bg-black/5 dark:hover:bg-white/10"
                >
                  {fullName(p)}
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
        Find relationship
      </button>

      {result === "none" && (
        <p className="text-sm text-black/60 dark:text-white/60">
          Pick two different people first.
        </p>
      )}

      {result && result !== "none" && result === null && (
        <p className="text-sm text-black/60 dark:text-white/60">
          No connection found between these two people in the tree.
        </p>
      )}

      {result && result !== "none" && result !== null && (
        <div className="flex flex-col gap-4 rounded-md border border-black/10 p-4 dark:border-white/10">
          <div>
            <span className="text-xs uppercase tracking-wide text-black/50 dark:text-white/50">
              Relationship
            </span>
            <p className="text-xl font-semibold">
              {fullName(result.path[result.path.length - 1].person)} is{" "}
              {fullName(result.path[0].person)}&apos;s {result.label}
            </p>
          </div>
          <div>
            <span className="text-xs uppercase tracking-wide text-black/50 dark:text-white/50">
              Connected via
            </span>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
              {result.path.map((step, i) => (
                <span key={step.person.id} className="flex items-center gap-2">
                  {i > 0 && (
                    <span className="text-black/40 dark:text-white/40">
                      → ({EDGE_LABEL[step.edgeFromPrevious]}) →
                    </span>
                  )}
                  <span className="rounded-full border border-black/15 px-3 py-1 dark:border-white/20">
                    {fullName(step.person)}
                  </span>
                </span>
              ))}
            </div>
          </div>
          <div>
            <span className="text-xs uppercase tracking-wide text-black/50 dark:text-white/50">
              Graph
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
