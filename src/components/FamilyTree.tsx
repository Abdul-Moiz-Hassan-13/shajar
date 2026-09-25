"use client";

import Link from "next/link";
import { useMemo } from "react";
import { NODE_HEIGHT, NODE_WIDTH, computeLayout } from "@/lib/treeLayout";
import type { Person } from "@/lib/types";

function fullName(p: Person): string {
  return `${p.firstName} ${p.lastName}`.trim();
}

function lifespan(p: Person): string {
  if (!p.birthDate && !p.deathDate) return "";
  return `${p.birthDate?.slice(0, 4) ?? "?"} – ${
    p.deathDate?.slice(0, 4) ?? ""
  }`;
}

const GENDER_COLOR: Record<Person["gender"], string> = {
  female: "#e6a4c4",
  male: "#8fb8de",
  other: "#c9c2e8",
};

export function FamilyTree({ people }: { people: Person[] }) {
  const layout = useMemo(() => computeLayout(people), [people]);

  if (people.length === 0) {
    return (
      <p className="text-black/60 dark:text-white/60">
        Nothing to show yet.{" "}
        <Link href="/people/new" className="underline">
          Add someone
        </Link>{" "}
        to get started.
      </p>
    );
  }

  const padding = 20;

  return (
    <div className="overflow-auto rounded-md border border-black/10 dark:border-white/10">
      <svg
        width={layout.width + padding * 2}
        height={layout.height + padding * 2}
        className="min-w-full"
      >
        <g transform={`translate(${padding}, ${padding})`}>
          {layout.parentEdges.map((edge, i) => {
            const midY = edge.parentBottomY + (edge.childTopY - edge.parentBottomY) / 2;
            const d = `M ${edge.parentMidX} ${edge.parentBottomY} L ${edge.parentMidX} ${midY} L ${edge.childX} ${midY} L ${edge.childX} ${edge.childTopY}`;
            return (
              <path
                key={i}
                d={d}
                fill="none"
                stroke="currentColor"
                strokeOpacity={0.3}
                strokeWidth={1.5}
              />
            );
          })}

          {layout.spouseEdges.map((edge, i) => (
            <line
              key={i}
              x1={edge.x1}
              x2={edge.x2}
              y1={edge.y}
              y2={edge.y}
              stroke="currentColor"
              strokeOpacity={0.3}
              strokeWidth={1.5}
            />
          ))}

          {layout.nodes.map((node) => (
            <g
              key={node.person.id}
              transform={`translate(${node.x - NODE_WIDTH / 2}, ${node.y})`}
            >
              <Link href={`/people/${node.person.id}`}>
                <rect
                  width={NODE_WIDTH}
                  height={NODE_HEIGHT}
                  rx={10}
                  fill={GENDER_COLOR[node.person.gender]}
                  fillOpacity={0.18}
                  stroke={GENDER_COLOR[node.person.gender]}
                  strokeWidth={1.5}
                />
                <text
                  x={NODE_WIDTH / 2}
                  y={NODE_HEIGHT / 2 - 4}
                  textAnchor="middle"
                  className="fill-black dark:fill-white"
                  fontSize={13}
                  fontWeight={600}
                >
                  {fullName(node.person)}
                </text>
                <text
                  x={NODE_WIDTH / 2}
                  y={NODE_HEIGHT / 2 + 16}
                  textAnchor="middle"
                  className="fill-black/60 dark:fill-white/60"
                  fontSize={11}
                >
                  {lifespan(node.person)}
                </text>
              </Link>
            </g>
          ))}
        </g>
      </svg>
    </div>
  );
}
