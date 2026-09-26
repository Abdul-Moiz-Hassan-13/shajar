"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { NODE_HEIGHT, NODE_WIDTH, computeLayout } from "@/lib/treeLayout";
import type { Person } from "@/lib/types";

const HIGHLIGHT_COLOR = "#f59e0b";

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
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);
  const [pinnedKey, setPinnedKey] = useState<string | null>(null);
  const activeKey = hoveredKey ?? pinnedKey;

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
          <rect
            x={0}
            y={0}
            width={layout.width}
            height={layout.height}
            fill="transparent"
            onClick={() => setPinnedKey(null)}
          />
          {layout.parentEdges.map((edge, i) => {
            const key = `parent-${i}`;
            const active = key === activeKey;
            const d = `M ${edge.parentMidX} ${edge.parentBottomY} L ${edge.parentMidX} ${edge.midY} L ${edge.childX} ${edge.midY} L ${edge.childX} ${edge.childTopY}`;
            return (
              <g key={key}>
                <path
                  d={d}
                  fill="none"
                  stroke="transparent"
                  strokeWidth={14}
                  className="cursor-pointer"
                  onMouseEnter={() => setHoveredKey(key)}
                  onMouseLeave={() => setHoveredKey(null)}
                  onClick={() =>
                    setPinnedKey((prev) => (prev === key ? null : key))
                  }
                />
                <path
                  d={d}
                  fill="none"
                  stroke={active ? HIGHLIGHT_COLOR : "currentColor"}
                  strokeOpacity={active ? 1 : 0.3}
                  strokeWidth={active ? 3 : 1.5}
                  pointerEvents="none"
                />
              </g>
            );
          })}

          {layout.spouseEdges.map((edge, i) => {
            const key = `spouse-${i}`;
            const active = key === activeKey;
            return (
              <g key={key}>
                <line
                  x1={edge.x1}
                  x2={edge.x2}
                  y1={edge.y}
                  y2={edge.y}
                  stroke="transparent"
                  strokeWidth={14}
                  className="cursor-pointer"
                  onMouseEnter={() => setHoveredKey(key)}
                  onMouseLeave={() => setHoveredKey(null)}
                  onClick={() =>
                    setPinnedKey((prev) => (prev === key ? null : key))
                  }
                />
                <line
                  x1={edge.x1}
                  x2={edge.x2}
                  y1={edge.y}
                  y2={edge.y}
                  stroke={active ? HIGHLIGHT_COLOR : "currentColor"}
                  strokeOpacity={active ? 1 : 0.3}
                  strokeWidth={active ? 3 : 1.5}
                  strokeDasharray={edge.status !== "married" ? "5 4" : undefined}
                  pointerEvents="none"
                />
                {edge.status === "divorced" && (
                  <line
                    x1={(edge.x1 + edge.x2) / 2 - 5}
                    y1={edge.y + 8}
                    x2={(edge.x1 + edge.x2) / 2 + 5}
                    y2={edge.y - 8}
                    stroke={active ? HIGHLIGHT_COLOR : "currentColor"}
                    strokeWidth={2}
                    pointerEvents="none"
                  />
                )}
              </g>
            );
          })}

          {layout.nodes.map((node) => {
            const span = lifespan(node.person);
            const firstNameY = span ? -10 : -9;
            const lastNameY = span ? 8 : 9;

            return (
              <g
                key={node.person.id}
                transform={`translate(${node.x - NODE_WIDTH / 2}, ${node.y})`}
              >
                <Link href={`/people/${node.person.id}`}>
                  <circle
                    cx={NODE_WIDTH / 2}
                    cy={NODE_HEIGHT / 2}
                    r={NODE_WIDTH / 2}
                    fill={GENDER_COLOR[node.person.gender]}
                    fillOpacity={node.person.isDeceased ? 0.08 : 0.18}
                    stroke={GENDER_COLOR[node.person.gender]}
                    strokeWidth={1.5}
                    strokeDasharray={
                      node.person.isDeceased ? "5 4" : undefined
                    }
                  />
                  <text
                    x={NODE_WIDTH / 2}
                    y={NODE_HEIGHT / 2 + firstNameY}
                    textAnchor="middle"
                    className="fill-black dark:fill-white"
                    fontSize={13}
                    fontWeight={600}
                  >
                    {node.person.firstName}
                  </text>
                  <text
                    x={NODE_WIDTH / 2}
                    y={NODE_HEIGHT / 2 + lastNameY}
                    textAnchor="middle"
                    className="fill-black dark:fill-white"
                    fontSize={13}
                    fontWeight={600}
                  >
                    {node.person.lastName}
                  </text>
                  {span && (
                    <text
                      x={NODE_WIDTH / 2}
                      y={NODE_HEIGHT / 2 + 26}
                      textAnchor="middle"
                      className="fill-black/60 dark:fill-white/60"
                      fontSize={10}
                    >
                      {span}
                    </text>
                  )}
                </Link>
                {node.person.isDeceased && (
                  <g transform={`translate(${NODE_WIDTH - 20}, 20)`}>
                    <circle
                      r={12}
                      className="fill-white stroke-black/20 dark:fill-neutral-900 dark:stroke-white/30"
                      strokeWidth={1}
                    />
                    <text
                      textAnchor="middle"
                      dominantBaseline="central"
                      fontSize={13}
                    >
                      🕊️
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
}
