import type { Person } from "./types";

export const NODE_WIDTH = 170;
export const NODE_HEIGHT = 88;
const UNIT_GAP = 50;
const SPOUSE_GAP = 16;
const GEN_GAP = 110;

export interface TreeNode {
  person: Person;
  x: number; // center x
  y: number; // top y
  gen: number;
}

export interface SpouseEdge {
  x1: number;
  x2: number;
  y: number;
}

export interface ParentEdge {
  childX: number;
  childTopY: number;
  parentMidX: number;
  parentBottomY: number;
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

  const genCache = new Map<string, number>();
  function genOf(id: string, stack: Set<string>): number {
    if (genCache.has(id)) return genCache.get(id)!;
    if (stack.has(id)) return 0;
    const person = byId.get(id);
    if (!person || person.parentIds.length === 0) {
      genCache.set(id, 0);
      return 0;
    }
    stack.add(id);
    const parentGens = person.parentIds
      .filter((pid) => byId.has(pid))
      .map((pid) => genOf(pid, stack));
    stack.delete(id);
    const g = parentGens.length > 0 ? 1 + Math.max(...parentGens) : 0;
    genCache.set(id, g);
    return g;
  }
  for (const p of people) genOf(p.id, new Set());

  // Pull spouses onto the same generation.
  let changed = true;
  while (changed) {
    changed = false;
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
  const gens: Person[][] = Array.from({ length: maxGen + 1 }, () => []);
  for (const p of people) gens[genCache.get(p.id)!].push(p);

  const positions = new Map<string, number>(); // id -> center x
  const nodes: TreeNode[] = [];
  const spouseEdges: SpouseEdge[] = [];

  for (let g = 0; g <= maxGen; g++) {
    const genPeople = gens[g];
    const anchor = new Map<string, number>();

    if (g === 0) {
      genPeople.forEach((p, i) => anchor.set(p.id, i));
    } else {
      genPeople.forEach((p) => {
        const parentXs = p.parentIds
          .map((pid) => positions.get(pid))
          .filter((x): x is number => x !== undefined);
        anchor.set(
          p.id,
          parentXs.length > 0
            ? parentXs.reduce((a, b) => a + b, 0) / parentXs.length
            : Number.MAX_SAFE_INTEGER,
        );
      });
    }

    const sorted = [...genPeople].sort(
      (a, b) => anchor.get(a.id)! - anchor.get(b.id)!,
    );

    const visited = new Set<string>();
    const units: Person[][] = [];
    for (const p of sorted) {
      if (visited.has(p.id)) continue;
      const unit = [p];
      visited.add(p.id);
      for (const sid of p.spouseIds) {
        if (visited.has(sid) || genCache.get(sid) !== g) continue;
        const s = byId.get(sid);
        if (s) {
          unit.push(s);
          visited.add(sid);
        }
      }
      units.push(unit);
    }

    const y = g * (NODE_HEIGHT + GEN_GAP);
    let cursor = 0;
    for (const unit of units) {
      const unitXs: number[] = [];
      for (let i = 0; i < unit.length; i++) {
        const person = unit[i];
        const cx = cursor + NODE_WIDTH / 2;
        positions.set(person.id, cx);
        nodes.push({ person, x: cx, y, gen: g });
        unitXs.push(cx);
        cursor += NODE_WIDTH + (i < unit.length - 1 ? SPOUSE_GAP : 0);
      }
      for (let i = 0; i < unitXs.length - 1; i++) {
        spouseEdges.push({
          x1: unitXs[i] + NODE_WIDTH / 2,
          x2: unitXs[i + 1] - NODE_WIDTH / 2,
          y: y + NODE_HEIGHT / 2,
        });
      }
      cursor += UNIT_GAP;
    }
  }

  const parentEdges: ParentEdge[] = [];
  for (const p of people) {
    const parentXs = p.parentIds
      .map((pid) => positions.get(pid))
      .filter((x): x is number => x !== undefined);
    if (parentXs.length === 0) continue;
    const childX = positions.get(p.id)!;
    const childTopY = genCache.get(p.id)! * (NODE_HEIGHT + GEN_GAP);
    const parentMidX =
      parentXs.reduce((a, b) => a + b, 0) / parentXs.length;
    parentEdges.push({
      childX,
      childTopY,
      parentMidX,
      parentBottomY: childTopY - GEN_GAP,
    });
  }

  const width =
    nodes.length > 0
      ? Math.max(...nodes.map((n) => n.x + NODE_WIDTH / 2)) + 40
      : NODE_WIDTH;
  const height = (maxGen + 1) * (NODE_HEIGHT + GEN_GAP);

  return { nodes, spouseEdges, parentEdges, width, height };
}
