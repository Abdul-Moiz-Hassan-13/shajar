import type { Person } from "./types";

export const NODE_WIDTH = 130;
export const NODE_HEIGHT = 130;
const UNIT_GAP = 40;
const SPOUSE_GAP = 24;
const GEN_GAP = 90;

export interface TreeNode {
  person: Person;
  x: number; // center x
  y: number; // top y
  gen: number;
}

export type SpouseEdgeStatus = "married" | "widowed" | "divorced";

export interface SpouseEdge {
  x1: number;
  x2: number;
  y: number;
  status: SpouseEdgeStatus;
}

export interface ParentEdge {
  childX: number;
  childTopY: number;
  parentMidX: number;
  parentBottomY: number;
  midY: number;
}

export interface TreeLayout {
  nodes: TreeNode[];
  spouseEdges: SpouseEdge[];
  parentEdges: ParentEdge[];
  width: number;
  height: number;
}

export function computeLayout(people: Person[]): TreeLayout {
  const byId = new Map(people.map((p) => [p.id, p]));

  // Compute generations by relaxing to a fixed point: a person's generation
  // is at least one more than their parents', and spouses share a generation.
  // Repeating both rules until nothing changes lets a generation bump (e.g.
  // a spouse pulled forward to match their partner) correctly cascade to
  // that spouse's own children from an earlier relationship.
  const genCache = new Map<string, number>();
  for (const p of people) genCache.set(p.id, 0);

  let changed = true;
  let iterations = 0;
  const maxIterations = people.length + 5;
  while (changed && iterations < maxIterations) {
    changed = false;
    iterations++;
    for (const p of people) {
      const validParentIds = p.parentIds.filter((pid) => byId.has(pid));
      if (validParentIds.length === 0) continue;
      const newGen =
        1 + Math.max(...validParentIds.map((pid) => genCache.get(pid)!));
      if (newGen > genCache.get(p.id)!) {
        genCache.set(p.id, newGen);
        changed = true;
      }
    }
    for (const p of people) {
      for (const sid of p.spouseIds) {
        if (!byId.has(sid)) continue;
        const g1 = genCache.get(p.id)!;
        const g2 = genCache.get(sid)!;
        if (g1 !== g2) {
          const max = Math.max(g1, g2);
          genCache.set(p.id, max);
          genCache.set(sid, max);
          changed = true;
        }
      }
    }
  }

  const maxGen = people.length > 0 ? Math.max(...genCache.values()) : 0;

  const positions = new Map<string, number>(); // id -> center x
  const nodes: TreeNode[] = [];
  const spouseEdges: SpouseEdge[] = [];

  // Build a global list of "units" (a person plus every spouse they're
  // transitively connected to via marriage, all pulled to the same
  // generation already). Every person belongs to exactly one unit.
  //
  // At each node, its OTHER spouses (besides whichever one we arrived from)
  // are recursively expanded the same way; with one other spouse, that whole
  // branch goes to the right (the existing default); with two or more, the
  // first-listed branch goes to the left and the rest go to the right. This
  // lets e.g. a first wife sit left of a husband, and his second wife's own
  // prior husband sit further right of her, all in one row.
  const units: Person[][] = [];
  const unitIndexOf = new Map<string, number>();
  {
    const visited = new Set<string>();

    function expand(person: Person, cameFromId: string | null): Person[] {
      visited.add(person.id);
      const others = person.spouseIds
        .filter((sid) => sid !== cameFromId && !visited.has(sid) && byId.has(sid))
        .map((sid) => byId.get(sid)!);

      const branches = others.map((s) => expand(s, person.id));

      if (branches.length === 0) return [person];
      if (branches.length === 1) {
        const branch = branches[0];
        const other = branch[0];
        // Simple monogamous pair — neither has ever had another spouse on
        // record — gets the husband-left, wife-right convention, regardless
        // of which one triggered this expansion. Anyone who's had more than
        // one spouse (either side of this pair) keeps the existing
        // first-branch-left chain ordering untouched.
        const isSimplePair =
          branch.length === 1 &&
          person.spouseIds.length === 1 &&
          other.spouseIds.length === 1;
        if (isSimplePair && person.gender === "female" && other.gender === "male") {
          return [other, person];
        }
        return [person, ...branch];
      }
      return [...branches[0], person, ...branches.slice(1).flat()];
    }

    for (const p of people) {
      if (visited.has(p.id)) continue;
      const unit = expand(p, null);
      const idx = units.length;
      units.push(unit);
      for (const member of unit) unitIndexOf.set(member.id, idx);
    }
  }

  // Figure out which unit "owns" each unit as a child (i.e. is its parent
  // couple), using whichever member of the unit is actually someone's child.
  // When cousins marry, BOTH members can have valid parents; prefer whoever
  // has an explicit sibling order set, since that's a signal their birth
  // family's branch is the one actively being tracked, so they stay grouped
  // with their own siblings rather than drifting to their spouse's side.
  const ownerUnitIndex = new Map<number, number | null>();
  const repMemberOf = new Map<number, Person | null>();
  units.forEach((unit, idx) => {
    const candidates = unit.filter((m) =>
      m.parentIds.some((pid) => byId.has(pid)),
    );
    const rep =
      candidates.find((m) => m.siblingOrder !== undefined) ?? candidates[0];
    repMemberOf.set(idx, rep ?? null);
    if (!rep) {
      ownerUnitIndex.set(idx, null);
      return;
    }
    const validParentIds = rep.parentIds.filter((pid) => byId.has(pid));
    const ownerIdx = unitIndexOf.get(validParentIds[0]);
    ownerUnitIndex.set(idx, ownerIdx ?? null);
  });

  const childUnitsOf = new Map<number, number[]>();
  units.forEach((_unit, idx) => {
    const owner = ownerUnitIndex.get(idx)!;
    if (owner === null) return;
    if (!childUnitsOf.has(owner)) childUnitsOf.set(owner, []);
    childUnitsOf.get(owner)!.push(idx);
  });

  function sortChildUnits(unitIdxs: number[]): number[] {
    return [...unitIdxs].sort((a, b) => {
      const repA = repMemberOf.get(a);
      const repB = repMemberOf.get(b);
      const orderA = repA?.siblingOrder ?? Number.MAX_SAFE_INTEGER;
      const orderB = repB?.siblingOrder ?? Number.MAX_SAFE_INTEGER;
      if (orderA !== orderB) return orderA - orderB;
      return a - b; // stable fallback: original unit creation order
    });
  }

  function unitWidth(idx: number): number {
    const unit = units[idx];
    return unit.length * NODE_WIDTH + (unit.length - 1) * SPOUSE_GAP;
  }

  // Pass 1 (bottom-up): how much horizontal room does each unit's whole
  // descendant subtree need?
  const subtreeWidthCache = new Map<number, number>();
  function subtreeWidth(idx: number): number {
    if (subtreeWidthCache.has(idx)) return subtreeWidthCache.get(idx)!;
    const children = childUnitsOf.get(idx) ?? [];
    const intrinsic = unitWidth(idx);
    let result = intrinsic;
    if (children.length > 0) {
      const childrenTotal =
        children.reduce((sum, c) => sum + subtreeWidth(c), 0) +
        UNIT_GAP * (children.length - 1);
      result = Math.max(intrinsic, childrenTotal);
    }
    subtreeWidthCache.set(idx, result);
    return result;
  }
  units.forEach((_u, idx) => subtreeWidth(idx));

  // Pass 2 (top-down): place each unit centered within the room its subtree
  // was allotted, then place its children centered under it in turn.
  function assign(idx: number, leftEdge: number): void {
    const unit = units[idx];
    const width = subtreeWidth(idx);
    const center = leftEdge + width / 2;
    const intrinsic = unitWidth(idx);
    const gen = genCache.get(unit[0].id)!;
    const y = gen * (NODE_HEIGHT + GEN_GAP);

    let memberCursor = center - intrinsic / 2;
    const unitXs: number[] = [];
    for (const person of unit) {
      const cx = memberCursor + NODE_WIDTH / 2;
      positions.set(person.id, cx);
      nodes.push({ person, x: cx, y, gen });
      unitXs.push(cx);
      memberCursor += NODE_WIDTH + SPOUSE_GAP;
    }
    for (let i = 0; i < unitXs.length - 1; i++) {
      const a = unit[i];
      const b = unit[i + 1];
      const status: SpouseEdgeStatus =
        a.isDeceased || b.isDeceased
          ? "widowed"
          : (a.divorcedSpouseIds ?? []).includes(b.id) ||
              (b.divorcedSpouseIds ?? []).includes(a.id)
            ? "divorced"
            : "married";
      spouseEdges.push({
        x1: unitXs[i] + NODE_WIDTH / 2,
        x2: unitXs[i + 1] - NODE_WIDTH / 2,
        y: y + NODE_HEIGHT / 2,
        status,
      });
    }

    const children = sortChildUnits(childUnitsOf.get(idx) ?? []);
    if (children.length === 0) return;
    const childrenTotal =
      children.reduce((sum, c) => sum + subtreeWidth(c), 0) +
      UNIT_GAP * (children.length - 1);
    let childCursor = center - childrenTotal / 2;
    for (const childIdx of children) {
      assign(childIdx, childCursor);
      childCursor += subtreeWidth(childIdx) + UNIT_GAP;
    }
  }

  // Root units are those with no owner (no parents on record). Lay them out
  // left to right, each reserving the full width its descendants need.
  const rootUnitIdxs = units
    .map((_u, idx) => idx)
    .filter((idx) => ownerUnitIndex.get(idx) === null);

  let rootCursor = 0;
  for (const idx of rootUnitIdxs) {
    assign(idx, rootCursor);
    rootCursor += subtreeWidth(idx) + UNIT_GAP;
  }

  // Every couple's bus line sits at the same height within a generation gap
  // (the vertical midpoint), so all sibling groups read as level with one
  // another. Two unrelated bus lines may occasionally cross when their
  // spans overlap in x — that's a normal, readable crossing, not a merge.
  const parentEdges: ParentEdge[] = [];
  for (const p of people) {
    const validParentIds = p.parentIds.filter((pid) => byId.has(pid));
    const parentXs = validParentIds
      .map((pid) => positions.get(pid))
      .filter((x): x is number => x !== undefined);
    if (parentXs.length === 0) continue;
    const childTopY = genCache.get(p.id)! * (NODE_HEIGHT + GEN_GAP);
    // Use the parents' own (actual) generation to find their bottom edge,
    // rather than assuming the child is exactly one generation below — a
    // spouse pulled forward to match a much-younger partner can otherwise
    // sit many generations below their real parents, which would make this
    // line start from nowhere instead of from the parents themselves.
    const parentGen = Math.max(
      ...validParentIds.map((pid) => genCache.get(pid)!),
    );
    const parentBottomY = parentGen * (NODE_HEIGHT + GEN_GAP) + NODE_HEIGHT;
    // Route the horizontal jog through the gap right after the parents'
    // own row — that band is always circle-free — rather than splitting
    // the full distance 50/50, which for a multi-generation gap (e.g. a
    // spouse pulled forward several generations) would land the jog inside
    // some unrelated row's circles in between.
    const midY = Math.min(parentBottomY + GEN_GAP / 2, childTopY);
    parentEdges.push({
      childX: positions.get(p.id)!,
      childTopY,
      parentMidX: parentXs.reduce((a, b) => a + b, 0) / parentXs.length,
      parentBottomY,
      midY,
    });
  }

  const width =
    nodes.length > 0
      ? Math.max(...nodes.map((n) => n.x + NODE_WIDTH / 2)) + 40
      : NODE_WIDTH;
  const height = (maxGen + 1) * (NODE_HEIGHT + GEN_GAP);

  return { nodes, spouseEdges, parentEdges, width, height };
}
