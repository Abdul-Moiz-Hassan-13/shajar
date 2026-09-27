import type { Gender, Person } from "./types";

export type EdgeType = "up" | "down" | "spouse" | "sibling";

export interface RelationshipStep {
  person: Person;
  /** How we got here from the previous step (ignored for the first step). */
  edgeFromPrevious: EdgeType;
}

export interface RelationshipResult {
  path: RelationshipStep[];
  label: string;
  /** The real, uncollapsed sequence of people connecting them — useful for
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

function ordinal(n: number): string {
  const v = n % 100;
  if (v >= 11 && v <= 13) return `${n}th`;
  switch (n % 10) {
    case 1:
      return `${n}st`;
    case 2:
      return `${n}nd`;
    case 3:
      return `${n}rd`;
    default:
      return `${n}th`;
  }
}

function greatPrefix(n: number): string {
  return n > 0 ? "Great-".repeat(n) : "";
}

function pick(gender: Gender, male: string, female: string, neutral: string): string {
  if (gender === "male") return male;
  if (gender === "female") return female;
  return neutral;
}

function parentTerm(gender: Gender): string {
  return pick(gender, "Father", "Mother", "Parent");
}
function childTerm(gender: Gender): string {
  return pick(gender, "Son", "Daughter", "Child");
}
function siblingTerm(gender: Gender, half: boolean): string {
  return half
    ? pick(gender, "Half-brother", "Half-sister", "Half-sibling")
    : pick(gender, "Brother", "Sister", "Sibling");
}
function grandparentTerm(gender: Gender, levelsAboveParent: number): string {
  // levelsAboveParent: 1 = grandparent, 2 = great-grandparent, ...
  const prefix = levelsAboveParent === 1 ? "Grand" : `${greatPrefix(levelsAboveParent - 1)}Grand`;
  return prefix + pick(gender, "father", "mother", "parent");
}
function grandchildTerm(gender: Gender, levelsBelowChild: number): string {
  const prefix = levelsBelowChild === 1 ? "Grand" : `${greatPrefix(levelsBelowChild - 1)}Grand`;
  return prefix + pick(gender, "son", "daughter", "child");
}
function auntUncleTerm(gender: Gender, level: number): string {
  const base = pick(gender, "Uncle", "Aunt", "Aunt/Uncle");
  if (level === 1) return base;
  const prefix = level === 2 ? "Grand-" : `${greatPrefix(level - 2)}Grand-`;
  return prefix + base;
}
function nieceNephewTerm(gender: Gender, level: number): string {
  const base = pick(gender, "Nephew", "Niece", "Niece/Nephew");
  if (level === 1) return base;
  const prefix = level === 2 ? "Grand-" : `${greatPrefix(level - 2)}Grand-`;
  return prefix + base;
}
function spouseTerm(gender: Gender): string {
  return pick(gender, "Husband", "Wife", "Spouse");
}

function classify(
  edgeTypes: EdgeType[],
  personA: Person,
  personB: Person,
): string {
  const g = personB.gender;

  if (edgeTypes.length === 0) return "Same person";
  if (edgeTypes.length === 1) {
    if (edgeTypes[0] === "up") return parentTerm(g);
    if (edgeTypes[0] === "down") return childTerm(g);
    return spouseTerm(g);
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
      if (u === 1) return parentTerm(g);
      return grandparentTerm(g, u - 1);
    }
    if (u === 0) {
      if (d === 1) return childTerm(g);
      return grandchildTerm(g, d - 1);
    }
    if (u === 1 && d === 1) {
      const sharedParents = personA.parentIds.filter((pid) =>
        personB.parentIds.includes(pid),
      ).length;
      return siblingTerm(g, sharedParents < 2);
    }
    if (u === 1 && d >= 2) {
      return nieceNephewTerm(g, d - 1);
    }
    if (d === 1 && u >= 2) {
      return auntUncleTerm(g, u - 1);
    }
    const degree = Math.min(u, d) - 1;
    const removed = Math.abs(u - d);
    const base = `${ordinal(degree)} cousin`;
    if (removed === 0) return base;

    // "Removed" cousins are confusing jargon — phrase them plainly instead:
    // whichever person is more generations from the shared ancestor is
    // effectively looking at the *other* person's parent's cousin (or, from
    // the other direction, their cousin's child).
    function ancestorWord(n: number): string {
      if (n === 1) return "parent's";
      if (n === 2) return "grandparent's";
      return `${greatPrefix(n - 2)}grandparent's`;
    }
    function descendantWord(n: number): string {
      if (n === 1) return "child";
      if (n === 2) return "grandchild";
      return `${greatPrefix(n - 2)}grandchild`;
    }
    return u > d
      ? `${ancestorWord(removed)} ${base}`
      : `${base}'s ${descendantWord(removed)}`;
  }

  const key = edgeTypes.join(",");
  const inLawMap: Record<string, string> = {
    "up,spouse": pick(g, "Step-father", "Step-mother", "Step-parent"),
    "spouse,down": pick(g, "Step-son", "Step-daughter", "Step-child"),
    "spouse,up": pick(g, "Father-in-law", "Mother-in-law", "Parent-in-law"),
    "down,spouse": pick(g, "Son-in-law", "Daughter-in-law", "Child-in-law"),
    "up,down,spouse": pick(g, "Brother-in-law", "Sister-in-law", "Sibling-in-law"),
    "spouse,up,down": pick(g, "Brother-in-law", "Sister-in-law", "Sibling-in-law"),
    "spouse,down,down": pick(g, "Step-grandson", "Step-granddaughter", "Step-grandchild"),
  };
  if (inLawMap[key]) return inLawMap[key];

  return "Related";
}

export function findRelationship(
  people: Person[],
  idA: string,
  idB: string,
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

  const label = classify(edgeTypes, personA, personB);

  // For DISPLAY only, collapse an "up" immediately followed by "down" (i.e.
  // passing through a shared parent to reach one of their other children)
  // into a single "sibling" hop, hiding that parent — e.g. an uncle relation
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
