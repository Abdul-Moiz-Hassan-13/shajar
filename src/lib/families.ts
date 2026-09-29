import type { Person } from "./types";

export type FamilyStatus = "married" | "widowed" | "divorced" | null;

export interface Family {
  /** Stable, unique per couple (or per solo parent) — a person who remarries
   * produces a separate Family for each marriage, never a merged one. */
  id: string;
  parents: Person[];
  children: Person[];
  status: FamilyStatus;
}

function coupleKey(idA: string, idB: string): string {
  return [idA, idB].sort().join("|");
}

function coupleStatus(a: Person, b: Person): FamilyStatus {
  if (a.isDeceased || b.isDeceased) return "widowed";
  const divorced =
    (a.divorcedSpouseIds ?? []).includes(b.id) ||
    (b.divorcedSpouseIds ?? []).includes(a.id);
  return divorced ? "divorced" : "married";
}

/** Groups people into family units of exactly two parents (or one, when
 * only one is on record) plus their *direct* children only — no
 * grandchildren, no children's own spouses. Each marriage is its own unit:
 * someone who married twice appears in two separate Family entries, one per
 * spouse, each listing only the children from that specific pairing. */
export function computeFamilies(people: Person[]): Family[] {
  const byId = new Map(people.map((p) => [p.id, p]));
  const indexOf = new Map(people.map((p, i) => [p.id, i]));

  const families = new Map<string, Family>();

  // Every recorded couple (spouseIds is symmetric, so dedupe via a sorted
  // key) becomes a family, even childless ones.
  for (const p of people) {
    for (const spouseId of p.spouseIds) {
      const spouse = byId.get(spouseId);
      if (!spouse) continue;
      const key = coupleKey(p.id, spouseId);
      if (families.has(key)) continue;
      families.set(key, {
        id: key,
        parents: [p, spouse],
        children: [],
        status: coupleStatus(p, spouse),
      });
    }
  }

  // Assign every person as a child to whichever family matches their own
  // recorded parentIds exactly — two parents means the couple family (even
  // if that couple wasn't otherwise linked as spouses on record), one parent
  // means a standalone solo-parent family.
  for (const p of people) {
    const validParentIds = p.parentIds.filter((id) => byId.has(id));
    if (validParentIds.length === 2) {
      const key = coupleKey(validParentIds[0], validParentIds[1]);
      let family = families.get(key);
      if (!family) {
        const parents = validParentIds.map((id) => byId.get(id)!);
        family = { id: key, parents, children: [], status: null };
        families.set(key, family);
      }
      family.children.push(p);
    } else if (validParentIds.length === 1) {
      const key = `solo:${validParentIds[0]}`;
      let family = families.get(key);
      if (!family) {
        family = {
          id: key,
          parents: [byId.get(validParentIds[0])!],
          children: [],
          status: null,
        };
        families.set(key, family);
      }
      family.children.push(p);
    }
  }

  // Stable, roughly-generational order: earliest-appearing member first,
  // matching the data file's already-ancestors-first ordering.
  function earliestIndex(f: Family): number {
    return Math.min(
      ...f.parents.map((p) => indexOf.get(p.id) ?? Number.MAX_SAFE_INTEGER),
      ...f.children.map((c) => indexOf.get(c.id) ?? Number.MAX_SAFE_INTEGER),
    );
  }

  return [...families.values()].sort((a, b) => earliestIndex(a) - earliestIndex(b));
}
