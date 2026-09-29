import type { Locale } from "./i18n/translations";
import { relationshipTerms, type RelationshipTerms } from "./relationshipTerms";
import type { Person } from "./types";

export type EdgeType = "up" | "down" | "spouse" | "sibling";

export interface RelationshipStep {
  person: Person;
  /** How we got here from the previous step (ignored for the first step). */
  edgeFromPrevious: EdgeType;
}

export interface RelationshipResult {
  path: RelationshipStep[];
  label: string;
  /** The real, uncollapsed sequence of people connecting them - useful for
   * rendering an actual generational tree diagram of the relationship. */
  rawPeople: Person[];
}

function buildAdjacency(
  people: Person[],
): Map<string, { to: string; type: EdgeType }[]> {
  const byId = new Map(people.map((p) => [p.id, p]));
  const adj = new Map<string, { to: string; type: EdgeType }[]>();
  function pushEdge(from: string, to: string, type: EdgeType) {
    if (!adj.has(from)) adj.set(from, []);
    adj.get(from)!.push({ to, type });
  }
  for (const p of people) {
    for (const pid of p.parentIds) {
      if (!byId.has(pid)) continue;
      pushEdge(p.id, pid, "up");
      pushEdge(pid, p.id, "down");
    }
    for (const sid of p.spouseIds) {
      if (!byId.has(sid)) continue;
      pushEdge(p.id, sid, "spouse");
    }
  }
  return adj;
}

function classify(
  edgeTypes: EdgeType[],
  personA: Person,
  personB: Person,
  terms: RelationshipTerms,
): string {
  const g = personB.gender;

  if (edgeTypes.length === 0) return terms.samePerson;
  if (edgeTypes.length === 1) {
    if (edgeTypes[0] === "up") return terms.parent(g);
    if (edgeTypes[0] === "down") return terms.child(g);
    return terms.spouse(g);
  }

  const hasSpouse = edgeTypes.includes("spouse");
  const firstDownIndex = edgeTypes.indexOf("down");
  const isPureUpDown =
    !hasSpouse &&
    (firstDownIndex === -1 ||
      edgeTypes.slice(0, firstDownIndex).every((t) => t === "up")) &&
    (firstDownIndex === -1 ||
      edgeTypes.slice(firstDownIndex).every((t) => t === "down"));

  if (isPureUpDown) {
    const u = firstDownIndex === -1 ? edgeTypes.length : firstDownIndex;
    const d = firstDownIndex === -1 ? 0 : edgeTypes.length - firstDownIndex;

    if (d === 0) {
      if (u === 1) return terms.parent(g);
      return terms.grandparent(g, u - 1);
    }
    if (u === 0) {
      if (d === 1) return terms.child(g);
      return terms.grandchild(g, d - 1);
    }
    if (u === 1 && d === 1) {
      const sharedParents = personA.parentIds.filter((pid) =>
        personB.parentIds.includes(pid),
      ).length;
      return terms.sibling(g, sharedParents < 2);
    }
    if (u === 1 && d >= 2) {
      return terms.nieceNephew(g, d - 1);
    }
    if (d === 1 && u >= 2) {
      return terms.auntUncle(g, u - 1);
    }
    const degree = Math.min(u, d) - 1;
    const removed = Math.abs(u - d);
    if (removed === 0) return terms.cousin(degree, removed, "same", g);

    // "Removed" cousins are confusing jargon - phrase them plainly instead:
    // whichever person is more generations from the shared ancestor is
    // effectively looking at the *other* person's parent's cousin (or, from
    // the other direction, their cousin's child).
    return terms.cousin(degree, removed, u > d ? "ancestor" : "descendant", g);
  }

  const key = edgeTypes.join(",");
  const inLaw = terms.inLaw(key, g);
  if (inLaw) return inLaw;

  return terms.related;
}

export function findRelationship(
  people: Person[],
  idA: string,
  idB: string,
  locale: Locale = "en",
): RelationshipResult | null {
  if (idA === idB) return null;
  const byId = new Map(people.map((p) => [p.id, p]));
  const personA = byId.get(idA);
  const personB = byId.get(idB);
  if (!personA || !personB) return null;

  const adj = buildAdjacency(people);

  const visited = new Set<string>([idA]);
  const cameFrom = new Map<string, { from: string; type: EdgeType }>();
  const queue: string[] = [idA];
  let head = 0;

  while (head < queue.length) {
    const current = queue[head++];
    if (current === idB) break;
    for (const edge of adj.get(current) ?? []) {
      if (visited.has(edge.to)) continue;
      visited.add(edge.to);
      cameFrom.set(edge.to, { from: current, type: edge.type });
      queue.push(edge.to);
    }
  }

  if (!visited.has(idB)) return null;

  const idsInPath: string[] = [idB];
  const edgeTypes: EdgeType[] = [];
  let cursor = idB;
  while (cursor !== idA) {
    const step = cameFrom.get(cursor)!;
    edgeTypes.unshift(step.type);
    idsInPath.unshift(step.from);
    cursor = step.from;
  }

  const label = classify(edgeTypes, personA, personB, relationshipTerms[locale]);

  // For DISPLAY only, collapse an "up" immediately followed by "down" (i.e.
  // passing through a shared parent to reach one of their other children)
  // into a single "sibling" hop, hiding that parent - e.g. an uncle relation
  // reads as "your dad → (sibling) → your uncle" rather than spelling out
  // the grandparent in between. Left alone for a direct sibling pair (path
  // length 2), where the shared parent is itself the interesting answer to
  // "how are we related".
  const displayIds = [...idsInPath];
  const displayEdges = [...edgeTypes];
  if (displayEdges.length > 2) {
    const junction = displayEdges.indexOf("down");
    if (junction > 0 && displayEdges[junction - 1] === "up") {
      displayEdges.splice(junction - 1, 2, "sibling");
      displayIds.splice(junction, 1);
    }
  }

  const path: RelationshipStep[] = displayIds.map((id, i) => ({
    person: byId.get(id)!,
    edgeFromPrevious: i === 0 ? "up" : displayEdges[i - 1],
  }));

  const rawPeople = idsInPath.map((id) => byId.get(id)!);

  return { path, label, rawPeople };
}
