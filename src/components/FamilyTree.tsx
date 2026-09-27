"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import { NODE_HEIGHT, NODE_WIDTH, computeLayout } from "@/lib/treeLayout";
import type { Person, PersonInput } from "@/lib/types";

const HIGHLIGHT_COLOR = "#f59e0b";

const GENDER_COLOR: Record<Person["gender"], string> = {
  female: "#e6a4c4",
  male: "#8fb8de",
  other: "#c9c2e8",
};

export function FamilyTree({
  people,
  center = false,
}: {
  people: Person[];
  /** Center the diagram in its container instead of pinning it to the left
   * — nice for a small scoped subset (e.g. a relationship graph) where the
   * content is narrower than the container; leave off for the main tree,
   * where content is usually wider than the viewport and should scroll from
   * the root ancestors on the left. */
  center?: boolean;
}) {
  const router = useRouter();
  const layout = useMemo(() => computeLayout(people), [people]);
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);
  const [pinnedKey, setPinnedKey] = useState<string | null>(null);
  const activeKey = hoveredKey ?? pinnedKey;
  const [editingId, setEditingId] = useState<string | null>(null);
  const [nameDraft, setNameDraft] = useState("");
  const clickTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleNodeClick(id: string) {
    if (clickTimeout.current) clearTimeout(clickTimeout.current);
    clickTimeout.current = setTimeout(() => {
      router.push(`/people/${id}`);
    }, 250);
  }

  function startEditing(person: Person) {
    if (clickTimeout.current) {
      clearTimeout(clickTimeout.current);
      clickTimeout.current = null;
    }
    setEditingId(person.id);
    setNameDraft(`${person.firstName} ${person.lastName}`.trim());
  }

  async function saveEditing(person: Person) {
    const trimmed = nameDraft.trim();
    setEditingId(null);
    if (!trimmed) return;

    const parts = trimmed.split(/\s+/);
    const lastName = parts.length > 1 ? parts.pop()! : "";
    const firstName = parts.join(" ");
    if (firstName === person.firstName && lastName === person.lastName) {
      return;
    }

    const input: PersonInput = {
      firstName,
      lastName,
      gender: person.gender,
      isDeceased: person.isDeceased,
      photoUrl: person.photoUrl,
      notes: person.notes,
      parentIds: person.parentIds,
      spouseIds: person.spouseIds,
      divorcedSpouseIds: person.divorcedSpouseIds,
      siblingOrder: person.siblingOrder,
    };

    const res = await fetch(`/api/people/${person.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (res.ok) router.refresh();
  }

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
    <div
      className={`overflow-auto rounded-md border border-black/10 dark:border-white/10 ${
        center ? "flex justify-center" : ""
      }`}
    >
      <svg
        width={layout.width + padding * 2}
        height={layout.height + padding * 2}
        className={center ? "shrink-0" : "min-w-full"}
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
            const hasLastName = Boolean(node.person.lastName);
            const firstNameY = hasLastName ? -9 : 0;
            const lastNameY = 9;

            const isEditing = editingId === node.person.id;

            return (
              <g
                key={node.person.id}
                transform={`translate(${node.x - NODE_WIDTH / 2}, ${node.y})`}
              >
                <g
                  className="cursor-pointer"
                  onClick={() => handleNodeClick(node.person.id)}
                  onDoubleClick={() => startEditing(node.person)}
                >
                  {/* Opaque backing so connector lines passing behind (e.g. a
                      long multi-generation trunk) never show through the
                      circle's own translucent fill. */}
                  <circle
                    cx={NODE_WIDTH / 2}
                    cy={NODE_HEIGHT / 2}
                    r={NODE_WIDTH / 2}
                    className="fill-white dark:fill-black"
                  />
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
                  {!isEditing && (
                    <>
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
                      {hasLastName && (
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
                      )}
                    </>
                  )}
                </g>
                {isEditing && (
                  <foreignObject
                    x={10}
                    y={NODE_HEIGHT / 2 - 14}
                    width={NODE_WIDTH - 20}
                    height={28}
                  >
                    <input
                      autoFocus
                      value={nameDraft}
                      onChange={(e) => setNameDraft(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      onDoubleClick={(e) => e.stopPropagation()}
                      onBlur={() => saveEditing(node.person)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") e.currentTarget.blur();
                        if (e.key === "Escape") setEditingId(null);
                      }}
                      className="w-full rounded border border-black/30 bg-white px-1 py-0.5 text-center text-[13px] font-semibold text-black outline-none dark:border-white/40 dark:bg-neutral-900 dark:text-white"
                    />
                  </foreignObject>
                )}
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
