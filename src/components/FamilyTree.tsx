"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useAuth } from "@/components/AuthProvider";
import { useLanguage } from "@/components/LanguageProvider";
import { useTheme } from "@/components/ThemeProvider";
import { displayFirstName, displayFullName, displayLastName } from "@/lib/personName";
import { NODE_HEIGHT, NODE_WIDTH, computeLayout, type TreeLayout } from "@/lib/treeLayout";
import type { Person, PersonInput } from "@/lib/types";

const HIGHLIGHT_COLOR = "#f59e0b";

const GENDER_COLOR: Record<Person["gender"], string> = {
  female: "#e6a4c4",
  male: "#8fb8de",
  other: "#c9c2e8",
};

const ZOOM_MIN = 0.25;
const ZOOM_MAX = 2;
const ZOOM_STEP = 0.15;
const PADDING = 20;

function clampZoom(z: number): number {
  return Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, z));
}

function fullName(p: Person): string {
  return `${p.firstName} ${p.lastName}`.trim();
}

// How far below the sticky nav bar a found node lands - enough that the
// nav never overlaps it, without pushing it all the way to mid-screen.
const SEARCH_RESULT_TOP_OFFSET = 300;

/** Scrolls so the given node lands near the top of the viewport (just under
 * the sticky nav) - horizontally centered within the diagram's own scroll
 * container (which does clip and scroll, since it can be narrower than its
 * content), and vertically via the browser window itself. The container has
 * no fixed height - it just grows tall enough to fit the whole diagram - so
 * vertical "scrolling" is actually the page's, not the container's;
 * adjusting only container.scrollTop would be a no-op for anything below
 * the very top of the tree. */
function centerOnNode(
  container: HTMLDivElement,
  node: { x: number; y: number },
  zoom: number,
) {
  container.scrollLeft = Math.max(
    0,
    (node.x + PADDING) * zoom - container.clientWidth / 2,
  );

  const rect = container.getBoundingClientRect();
  const nodeViewportY =
    rect.top + (node.y + NODE_HEIGHT / 2 + PADDING) * zoom - container.scrollTop;
  const targetScrollY =
    window.scrollY + nodeViewportY - SEARCH_RESULT_TOP_OFFSET;
  window.scrollTo({ top: Math.max(0, targetScrollY), behavior: "smooth" });
}

/** Scrolls so the root with the most descendants - the actual family
 * patriarch/matriarch - sits centered at the top, rather than wherever the
 * user last scrolled/zoomed to. Several disconnected fragments can each
 * have their own gen-0 root (e.g. an in-law's "TBC" placeholder with no
 * recorded parents of their own), so this picks the biggest one rather than
 * averaging every root's position, which can land in the gap between
 * unrelated branches. */
function centerOnMainRoot(
  container: HTMLDivElement,
  layout: TreeLayout,
  people: Person[],
) {
  const roots = layout.nodes.filter((n) => n.gen === 0);
  if (roots.length === 0) return;

  const childrenByParentId = new Map<string, string[]>();
  for (const p of people) {
    for (const parentId of p.parentIds) {
      childrenByParentId.set(parentId, [
        ...(childrenByParentId.get(parentId) ?? []),
        p.id,
      ]);
    }
  }
  function countDescendants(rootId: string): number {
    const seen = new Set<string>([rootId]);
    const stack = [rootId];
    while (stack.length > 0) {
      const current = stack.pop()!;
      for (const childId of childrenByParentId.get(current) ?? []) {
        if (seen.has(childId)) continue;
        seen.add(childId);
        stack.push(childId);
      }
    }
    return seen.size - 1;
  }

  const mainRoot = roots.reduce((best, n) =>
    countDescendants(n.person.id) > countDescendants(best.person.id)
      ? n
      : best,
  );

  const padding = 20;
  container.scrollLeft = Math.max(
    0,
    mainRoot.x + padding - container.clientWidth / 2,
  );
  container.scrollTop = 0;
}

const EXPORT_SCALE = 3;

/** Serializes the live tree SVG at full (unzoomed) resolution into a
 * high-DPI PNG and triggers a download. The clone is detached from the
 * page, so anything that only carries color/font via a Tailwind class
 * (rather than an inline attribute) would otherwise fall back to SVG's
 * bare initial values (e.g. fill defaults to black) - computed styles are
 * read off the still-attached original elements first and baked into the
 * clone as explicit attributes to avoid that. */
async function exportSvgAsPng(
  svgEl: SVGSVGElement,
  width: number,
  height: number,
  backgroundColor: string,
  fileName: string,
) {
  const clone = svgEl.cloneNode(true) as SVGSVGElement;
  const originals = svgEl.querySelectorAll("*");
  const clones = clone.querySelectorAll("*");
  originals.forEach((original, i) => {
    const target = clones[i];
    const cs = getComputedStyle(original);
    if (cs.fill && cs.fill !== "none") target.setAttribute("fill", cs.fill);
    if (cs.stroke && cs.stroke !== "none")
      target.setAttribute("stroke", cs.stroke);
    if (cs.fontFamily) target.setAttribute("font-family", cs.fontFamily);
  });
  clone.removeAttribute("style");
  clone.setAttribute("width", String(width));
  clone.setAttribute("height", String(height));

  const svgString = new XMLSerializer().serializeToString(clone);
  const svgUrl =
    "data:image/svg+xml;base64," +
    btoa(unescape(encodeURIComponent(svgString)));

  const canvas = document.createElement("canvas");
  canvas.width = width * EXPORT_SCALE;
  canvas.height = height * EXPORT_SCALE;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.fillStyle = backgroundColor;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const image = new Image();
  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = () => reject(new Error("Failed to render tree image"));
    image.src = svgUrl;
  });
  ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

  const blob: Blob | null = await new Promise((resolve) =>
    canvas.toBlob(resolve, "image/png"),
  );
  if (!blob) return;
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}

function touchDistance(touches: TouchList): number {
  const [a, b] = [touches[0], touches[1]];
  return Math.hypot(b.clientX - a.clientX, b.clientY - a.clientY);
}

function touchMidpoint(touches: TouchList): { x: number; y: number } {
  const [a, b] = [touches[0], touches[1]];
  return { x: (a.clientX + b.clientX) / 2, y: (a.clientY + b.clientY) / 2 };
}

/** Adjusts scroll so the content point that was under (clientX, clientY) at
 * `zoomBefore` stays under the same screen position at `zoomAfter` - without
 * this, resizing the diagram out from under the fingers as it scales reads
 * as a jarring "shake" instead of a smooth pinch. */
function keepPointStable(
  container: HTMLDivElement,
  clientX: number,
  clientY: number,
  zoomBefore: number,
  zoomAfter: number,
) {
  const rect = container.getBoundingClientRect();
  const offsetX = clientX - rect.left;
  const offsetY = clientY - rect.top;
  const contentX = (container.scrollLeft + offsetX) / zoomBefore;
  const contentY = (container.scrollTop + offsetY) / zoomBefore;
  container.scrollLeft = contentX * zoomAfter - offsetX;
  container.scrollTop = contentY * zoomAfter - offsetY;
}

export function FamilyTree({
  people,
  center = false,
}: {
  people: Person[];
  /** Center the diagram in its container instead of pinning it to the left
   * - nice for a small scoped subset (e.g. a relationship graph) where the
   * content is narrower than the container; leave off for the main tree,
   * where content is usually wider than the viewport and should scroll from
   * the root ancestors on the left. */
  center?: boolean;
}) {
  const router = useRouter();
  const { t, locale } = useLanguage();
  const { theme } = useTheme();
  const { isAdmin } = useAuth();
  const layout = useMemo(() => computeLayout(people), [people]);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);
  const [pinnedKey, setPinnedKey] = useState<string | null>(null);
  const activeKey = hoveredKey ?? pinnedKey;
  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [nameDraft, setNameDraft] = useState("");
  const clickTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [zoom, setZoom] = useState(1);
  const zoomRef = useRef(zoom);
  useEffect(() => {
    zoomRef.current = zoom;
  }, [zoom]);
  // Set by a gesture just before calling setZoom; consumed by the
  // useLayoutEffect below once the resize has actually landed in the DOM,
  // so the point under the fingers/cursor stays visually still.
  const pendingFocalPoint = useRef<{
    clientX: number;
    clientY: number;
    zoomBefore: number;
  } | null>(null);
  // Set by the "Reset zoom" button; consumed alongside pendingFocalPoint
  // once the resize lands, so resetting zoom also returns to the same
  // centered view as the initial load rather than wherever was last scrolled.
  const recenterOnReset = useRef(false);

  useLayoutEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    if (recenterOnReset.current) {
      recenterOnReset.current = false;
      if (!center) centerOnMainRoot(container, layout, people);
      return;
    }

    const pending = pendingFocalPoint.current;
    if (!pending) return;
    pendingFocalPoint.current = null;
    keepPointStable(
      container,
      pending.clientX,
      pending.clientY,
      pending.zoomBefore,
      zoom,
    );
  }, [zoom, layout, people, center]);

  useEffect(() => {
    if (center) return;
    const container = scrollRef.current;
    if (!container) return;
    centerOnMainRoot(container, layout, people);
  }, [layout, center, people]);

  // Pinch-to-zoom (touch) and trackpad pinch / ctrl+scroll (wheel). Attached
  // as native, non-passive listeners (rather than React's on* props) so
  // preventDefault() actually stops the browser's own page-zoom gesture -
  // and macOS/Windows both report a trackpad pinch as a wheel event with
  // ctrlKey set, regardless of whether Ctrl is actually held.
  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    let pinchStartDistance = 0;
    let zoomAtPinchStart = 1;

    // touchmove fires far more often than a phone can actually paint -
    // applying every single event as its own state update/reflow is what
    // made pinching feel janky. Coalescing to one update per animation
    // frame keeps it in step with what the screen can show.
    let rafId: number | null = null;
    let latestGesture: { newZoom: number; clientX: number; clientY: number } | null = null;

    function scheduleZoomUpdate() {
      if (rafId !== null) return;
      rafId = requestAnimationFrame(() => {
        rafId = null;
        const gesture = latestGesture;
        latestGesture = null;
        if (!gesture) return;
        setZoom((zoomBefore) => {
          pendingFocalPoint.current = {
            clientX: gesture.clientX,
            clientY: gesture.clientY,
            zoomBefore,
          };
          return gesture.newZoom;
        });
      });
    }

    function onTouchStart(e: TouchEvent) {
      if (e.touches.length !== 2) return;
      pinchStartDistance = touchDistance(e.touches);
      setZoom((z) => {
        zoomAtPinchStart = z;
        return z;
      });
    }

    function onTouchMove(e: TouchEvent) {
      if (e.touches.length !== 2 || pinchStartDistance === 0) return;
      e.preventDefault();
      const scale = touchDistance(e.touches) / pinchStartDistance;
      const mid = touchMidpoint(e.touches);
      latestGesture = {
        newZoom: clampZoom(zoomAtPinchStart * scale),
        clientX: mid.x,
        clientY: mid.y,
      };
      scheduleZoomUpdate();
    }

    function onTouchEnd(e: TouchEvent) {
      if (e.touches.length < 2) pinchStartDistance = 0;
    }

    function onWheel(e: WheelEvent) {
      if (!e.ctrlKey) return;
      e.preventDefault();
      const base = latestGesture?.newZoom ?? zoomRef.current;
      latestGesture = {
        newZoom: clampZoom(base * Math.exp(-e.deltaY * 0.01)),
        clientX: e.clientX,
        clientY: e.clientY,
      };
      scheduleZoomUpdate();
    }

    container.addEventListener("touchstart", onTouchStart, { passive: true });
    container.addEventListener("touchmove", onTouchMove, { passive: false });
    container.addEventListener("touchend", onTouchEnd, { passive: true });
    container.addEventListener("touchcancel", onTouchEnd, { passive: true });
    container.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      container.removeEventListener("touchstart", onTouchStart);
      container.removeEventListener("touchmove", onTouchMove);
      container.removeEventListener("touchend", onTouchEnd);
      container.removeEventListener("touchcancel", onTouchEnd);
      container.removeEventListener("wheel", onWheel);
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, []);

  const searchCandidates = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return people
      .filter((p) => fullName(p).toLowerCase().includes(q))
      .slice(0, 8);
  }, [people, searchQuery]);

  function selectSearchResult(personId: string) {
    setSearchQuery("");
    setSearchOpen(false);
    setHighlightedId(personId);
    const node = layout.nodes.find((n) => n.person.id === personId);
    const container = scrollRef.current;
    if (node && container) centerOnNode(container, node, zoomRef.current);
  }

  async function handleExport() {
    const svgEl = svgRef.current;
    if (!svgEl || isExporting) return;
    setIsExporting(true);
    try {
      await exportSvgAsPng(
        svgEl,
        layout.width + PADDING * 2,
        layout.height + PADDING * 2,
        theme === "dark" ? "#0a0a0a" : "#ffffff",
        "family-tree.png",
      );
    } finally {
      setIsExporting(false);
    }
  }

  const handleNodeClick = useCallback(
    (id: string) => {
      // Read-only visitors have nowhere to navigate to - /people/[id] is the
      // edit form, and it's gated behind login.
      if (!isAdmin) return;
      if (clickTimeout.current) clearTimeout(clickTimeout.current);
      clickTimeout.current = setTimeout(() => {
        router.push(`/people/${id}`);
      }, 250);
    },
    [router, isAdmin],
  );

  const startEditing = useCallback(
    (person: Person) => {
      if (!isAdmin) return;
      if (clickTimeout.current) {
        clearTimeout(clickTimeout.current);
        clickTimeout.current = null;
      }
      setEditingId(person.id);
      setNameDraft(`${person.firstName} ${person.lastName}`.trim());
    },
    [isAdmin],
  );

  const saveEditing = useCallback(async (person: Person) => {
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
  }, [nameDraft, router]);

  // The node/edge markup below never depends on `zoom` - only the outer
  // <svg>'s own scale transform does. Memoizing it (excluding zoom from the
  // deps) lets React bail out of reconciling this whole subtree on every
  // pinch/wheel frame, instead of re-diffing every node and edge each time
  // zoom state changes - the difference between smooth and janky pinching
  // once the tree has more than a couple dozen people.
  const treeContent = useMemo(
    () => (
      <g transform={`translate(${PADDING}, ${PADDING})`}>
        <rect
          x={0}
          y={0}
          width={layout.width}
          height={layout.height}
          fill="transparent"
          onClick={() => {
            setPinnedKey(null);
            setHighlightedId(null);
          }}
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
          const shownFirstName = displayFirstName(node.person, locale);
          const shownLastName = displayLastName(node.person, locale);
          const hasLastName = Boolean(shownLastName);
          const firstNameY = hasLastName ? -9 : 0;
          const lastNameY = 9;

          const isEditing = editingId === node.person.id;

          const isHighlighted = highlightedId === node.person.id;

          return (
            <g
              key={node.person.id}
              transform={`translate(${node.x - NODE_WIDTH / 2}, ${node.y})`}
            >
              <g
                className={isAdmin ? "cursor-pointer" : "cursor-default"}
                onClick={() => handleNodeClick(node.person.id)}
                onDoubleClick={() => startEditing(node.person)}
              >
                {isHighlighted && (
                  <circle
                    cx={NODE_WIDTH / 2}
                    cy={NODE_HEIGHT / 2}
                    r={NODE_WIDTH / 2 + 6}
                    fill="none"
                    stroke={HIGHLIGHT_COLOR}
                    strokeWidth={3}
                  />
                )}
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
                      {shownFirstName}
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
                        {shownLastName}
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
    ),
    [
      layout,
      activeKey,
      editingId,
      nameDraft,
      highlightedId,
      locale,
      isAdmin,
      handleNodeClick,
      startEditing,
      saveEditing,
    ],
  );

  if (people.length === 0) {
    return (
      <p className="text-black/60 dark:text-white/60">
        {t.tree.nothingToShow}{" "}
        <Link href="/people/new" className="underline">
          {t.tree.addSomeone}
        </Link>{" "}
        {t.tree.toGetStarted}
      </p>
    );
  }

  const padding = 20;

  return (
    <div className="flex flex-col gap-2">
      {!center && (
        <div className="relative max-w-xs">
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setSearchOpen(true);
            }}
            onFocus={() => setSearchOpen(true)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && searchCandidates.length > 0) {
                e.preventDefault();
                selectSearchResult(searchCandidates[0].id);
              }
            }}
            placeholder={t.people.searchPlaceholder}
            className="w-full rounded-md border border-black/15 px-3 py-2 text-sm dark:border-white/20 dark:bg-transparent"
          />
          {searchOpen && searchQuery && (
            <div className="absolute z-10 mt-1 max-h-48 w-full overflow-y-auto rounded-md border border-black/15 bg-white dark:border-white/20 dark:bg-neutral-900">
              {searchCandidates.length === 0 && (
                <p className="px-3 py-2 text-sm text-black/50 dark:text-white/50">
                  {t.relations.noMatches}
                </p>
              )}
              {searchCandidates.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => selectSearchResult(p.id)}
                  className="block w-full px-3 py-1.5 text-left text-sm hover:bg-black/5 dark:hover:bg-white/10"
                >
                  {displayFullName(p, locale)}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
      <div
        className={`flex items-center justify-between gap-2 ${center ? "" : "max-w-xs"}`}
      >
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setZoom((z) => clampZoom(+(z - ZOOM_STEP).toFixed(2)))}
            disabled={zoom <= ZOOM_MIN}
            aria-label={t.tree.zoomOut}
            className="rounded-md border border-black/15 px-2 py-1 text-sm disabled:opacity-40 dark:border-white/20"
          >
            −
          </button>
          <span className="w-12 text-center text-xs text-black/50 dark:text-white/50">
            {Math.round(zoom * 100)}%
          </span>
          <button
            type="button"
            onClick={() => setZoom((z) => clampZoom(+(z + ZOOM_STEP).toFixed(2)))}
            disabled={zoom >= ZOOM_MAX}
            aria-label={t.tree.zoomIn}
            className="rounded-md border border-black/15 px-2 py-1 text-sm disabled:opacity-40 dark:border-white/20"
          >
            +
          </button>
        </div>
        <div className="flex items-center gap-2">
          {zoom !== 1 && (
            <button
              type="button"
              onClick={() => {
                recenterOnReset.current = true;
                setZoom(1);
              }}
              className="rounded-md border border-black/15 px-2 py-1 text-xs dark:border-white/20"
            >
              {t.tree.resetZoom}
            </button>
          )}
          <button
            type="button"
            onClick={handleExport}
            disabled={isExporting}
            className="rounded-md border border-black/15 px-2 py-1 text-xs disabled:opacity-40 dark:border-white/20"
          >
            {isExporting ? t.tree.exporting : t.tree.exportImage}
          </button>
        </div>
      </div>
      <div
        ref={scrollRef}
        dir="ltr"
        style={{ touchAction: "pan-x pan-y" }}
        className={`overflow-auto rounded-md border border-black/10 dark:border-white/10 ${
          center ? "flex justify-center" : ""
        }`}
      >
      {/* The scaling itself happens via a CSS transform on the SVG (cheap,
          GPU-composited) rather than changing its width/height attributes
          (which would force the browser to re-lay-out every shape inside it
          on every touchmove - the cause of pinch-zoom feeling janky on
          phones). This wrapper's own box is what the scaled size actually
          is, so the scrollable area still matches. */}
      <div
        style={{
          width: (layout.width + padding * 2) * zoom,
          height: (layout.height + padding * 2) * zoom,
        }}
        className={center ? "shrink-0" : ""}
      >
      <svg
        ref={svgRef}
        viewBox={`0 0 ${layout.width + padding * 2} ${layout.height + padding * 2}`}
        width={layout.width + padding * 2}
        height={layout.height + padding * 2}
        style={{ transform: `scale(${zoom})`, transformOrigin: "0 0" }}
      >
        {treeContent}
      </svg>
      </div>
      </div>
    </div>
  );
}
