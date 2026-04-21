"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Grid, type GridCellState } from "./grid";
import { FLEET, GRID_SIZE } from "@/lib/games/battleship/constants";
import { RotateCw, Shuffle, Trash2, Undo2, Check } from "lucide-react";
import { postJson } from "@/lib/utils/fetcher";

interface PlacedShip {
  size: number;
  horizontal: boolean;
  cells: [number, number][];
}

interface DragState {
  size: number;
  horizontal: boolean;
  /** If set, we are repositioning an already-placed ship at this index. */
  fromIndex?: number;
  /** Offset within the ship where the pointer grabbed (0..size-1). */
  grabOffset: number;
  x: number;
  y: number;
}

function footprint(
  size: number,
  origin: [number, number],
  horizontal: boolean,
): [number, number][] | null {
  const [ox, oy] = origin;
  const cells: [number, number][] = [];
  for (let i = 0; i < size; i++) {
    const cx = horizontal ? ox + i : ox;
    const cy = horizontal ? oy : oy + i;
    if (cx < 0 || cy < 0 || cx >= GRID_SIZE || cy >= GRID_SIZE) return null;
    cells.push([cx, cy]);
  }
  return cells;
}

function overlaps(a: [number, number][], b: [number, number][]): boolean {
  const set = new Set(a.map(([x, y]) => `${x},${y}`));
  return b.some(([x, y]) => set.has(`${x},${y}`));
}

function emptyGrid(): GridCellState[][] {
  return Array.from({ length: GRID_SIZE }, () =>
    Array.from({ length: GRID_SIZE }, () => "empty" as GridCellState),
  );
}

/** Hit-test the grid using data attributes set by the Grid component. */
function cellFromPoint(clientX: number, clientY: number): [number, number] | null {
  const el = document.elementFromPoint(clientX, clientY);
  if (!el) return null;
  let node: Element | null = el;
  while (node) {
    if (node instanceof HTMLElement) {
      const xAttr = node.dataset.cellX;
      const yAttr = node.dataset.cellY;
      if (xAttr !== undefined && yAttr !== undefined) {
        return [Number(xAttr), Number(yAttr)];
      }
    }
    node = node.parentElement;
  }
  return null;
}

export function PlacementBoard({
  code,
  onPlaced,
}: {
  code: string;
  onPlaced: () => void;
}) {
  const [placed, setPlaced] = useState<PlacedShip[]>([]);
  const [history, setHistory] = useState<PlacedShip[][]>([]);
  const [drag, setDrag] = useState<DragState | null>(null);
  const [hoverCell, setHoverCell] = useState<[number, number] | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const remaining = useMemo(() => {
    const pool = [...FLEET];
    for (const p of placed) {
      const idx = pool.indexOf(p.size);
      if (idx !== -1) pool.splice(idx, 1);
    }
    return pool;
  }, [placed]);

  const allPlaced = placed.length === FLEET.length;

  const pushAndSet = (next: PlacedShip[]) => {
    setHistory((h) => [...h, placed]);
    setPlaced(next);
  };

  const undo = () => {
    setHistory((h) => {
      if (h.length === 0) return h;
      const prev = h[h.length - 1]!;
      setPlaced(prev);
      return h.slice(0, -1);
    });
  };

  const reset = () => {
    if (placed.length === 0) return;
    setHistory((h) => [...h, placed]);
    setPlaced([]);
  };

  const rotateDrag = () => {
    setDrag((d) => (d ? { ...d, horizontal: !d.horizontal } : d));
  };

  const auto = () => {
    const all: PlacedShip[] = [];
    for (const size of FLEET) {
      let tries = 0;
      while (tries < 200) {
        tries++;
        const x = Math.floor(Math.random() * GRID_SIZE);
        const y = Math.floor(Math.random() * GRID_SIZE);
        const horiz = Math.random() < 0.5;
        const cells = footprint(size, [x, y], horiz);
        if (!cells) continue;
        if (all.some((p) => overlaps(p.cells, cells))) continue;
        all.push({ size, horizontal: horiz, cells });
        break;
      }
    }
    if (all.length === FLEET.length) pushAndSet(all);
  };

  // Start drag from the dock (new ship)
  const startDragFromDock = (size: number, e: React.PointerEvent) => {
    e.preventDefault();
    setDrag({
      size,
      horizontal: true,
      grabOffset: 0,
      x: e.clientX,
      y: e.clientY,
    });
  };

  // Start drag from a placed ship (reposition)
  const startDragFromShip = (index: number, grabOffset: number, e: React.PointerEvent) => {
    e.preventDefault();
    const ship = placed[index];
    if (!ship) return;
    setDrag({
      size: ship.size,
      horizontal: ship.horizontal,
      fromIndex: index,
      grabOffset,
      x: e.clientX,
      y: e.clientY,
    });
  };

  // Global pointer handlers
  useEffect(() => {
    if (!drag) return;
    const onMove = (e: PointerEvent) => {
      setDrag((d) => (d ? { ...d, x: e.clientX, y: e.clientY } : d));
      setHoverCell(cellFromPoint(e.clientX, e.clientY));
    };
    const onUp = (e: PointerEvent) => {
      const cell = cellFromPoint(e.clientX, e.clientY);
      const currentDrag = drag;
      setDrag(null);
      setHoverCell(null);
      if (!cell || !currentDrag) return;
      // Adjust origin by grabOffset (keeps the visual anchor under the pointer)
      const origin: [number, number] = currentDrag.horizontal
        ? [cell[0] - currentDrag.grabOffset, cell[1]]
        : [cell[0], cell[1] - currentDrag.grabOffset];
      const fp = footprint(currentDrag.size, origin, currentDrag.horizontal);
      if (!fp) return;
      const others =
        currentDrag.fromIndex !== undefined
          ? placed.filter((_, i) => i !== currentDrag.fromIndex)
          : placed;
      if (others.some((p) => overlaps(p.cells, fp))) return;
      const newShip: PlacedShip = {
        size: currentDrag.size,
        horizontal: currentDrag.horizontal,
        cells: fp,
      };
      const next =
        currentDrag.fromIndex !== undefined
          ? placed.map((p, i) => (i === currentDrag.fromIndex ? newShip : p))
          : [...placed, newShip];
      pushAndSet(next);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "r" || e.key === "R" || e.key === " ") {
        e.preventDefault();
        rotateDrag();
      } else if (e.key === "Escape") {
        setDrag(null);
        setHoverCell(null);
      }
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      window.removeEventListener("keydown", onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drag, placed]);

  // Grid with preview overlays
  const grid: GridCellState[][] = (() => {
    const g = emptyGrid();
    for (let i = 0; i < placed.length; i++) {
      if (drag?.fromIndex === i) continue; // hide the ship being repositioned
      const p = placed[i]!;
      for (const [x, y] of p.cells) g[x]![y] = "ship";
    }
    if (drag && hoverCell) {
      const origin: [number, number] = drag.horizontal
        ? [hoverCell[0] - drag.grabOffset, hoverCell[1]]
        : [hoverCell[0], hoverCell[1] - drag.grabOffset];
      const fp = footprint(drag.size, origin, drag.horizontal);
      if (fp) {
        const others =
          drag.fromIndex !== undefined
            ? placed.filter((_, i) => i !== drag.fromIndex)
            : placed;
        const valid = !others.some((p) => overlaps(p.cells, fp));
        for (const [x, y] of fp) {
          g[x]![y] = valid ? "ship-preview" : "ship-invalid";
        }
      }
    }
    return g;
  })();

  // Custom onCellClick that starts a drag on an already-placed ship
  const cellClick = (x: number, y: number) => {
    const idx = placed.findIndex((p) => p.cells.some(([cx, cy]) => cx === x && cy === y));
    if (idx === -1) return;
    // No-op: repositioning is handled via pointerdown, not click.
  };

  // We attach pointerdown handler on the grid wrapper to catch interactions
  // on already-placed ship cells (re-drag).
  const gridWrapRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const wrap = gridWrapRef.current;
    if (!wrap) return;
    const onDown = (e: PointerEvent) => {
      if (drag) return;
      const cell = cellFromPoint(e.clientX, e.clientY);
      if (!cell) return;
      const idx = placed.findIndex((p) =>
        p.cells.some(([cx, cy]) => cx === cell[0] && cy === cell[1]),
      );
      if (idx === -1) return;
      const ship = placed[idx]!;
      // Work out grabOffset along the ship axis
      const anchor = ship.horizontal ? ship.cells[0]![0] : ship.cells[0]![1];
      const point = ship.horizontal ? cell[0] : cell[1];
      const grabOffset = Math.max(0, Math.min(ship.size - 1, point - anchor));
      startDragFromShip(idx, grabOffset, e as unknown as React.PointerEvent);
    };
    wrap.addEventListener("pointerdown", onDown);
    return () => wrap.removeEventListener("pointerdown", onDown);
  }, [drag, placed]);

  const submit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      await postJson(`/api/battleship/${code}/place`, {
        ships: placed.map((s) => ({ size: s.size, cells: s.cells })),
      });
      onPlaced();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="screen max-w-[960px] mx-auto px-5 sm:px-7 py-10"
      style={{ touchAction: drag ? "none" : "auto" }}
    >
      <div className="text-center mb-6">
        <div className="eyebrow mb-2">Placement</div>
        <h2
          className="display m-0"
          style={{ fontSize: "clamp(28px, 5vw, 42px)", lineHeight: 1 }}
        >
          Place ta flotte
        </h2>
        <p className="muted text-sm mt-3 px-2">
          Attrape un bateau du dock, glisse-le sur la grille, relâche pour le poser.{" "}
          <span className="hidden sm:inline">Touche R ou Espace pour tourner.</span>
        </p>
      </div>

      {/* DOCK — remaining ships */}
      <div
        className="surface-soft flex flex-wrap items-center justify-center gap-3 p-4 mb-6"
        style={{ minHeight: 90 }}
      >
        <div className="eyebrow mr-2">Flotte</div>
        {remaining.length === 0 && (
          <div className="muted text-sm italic">Tous les bateaux sont placés !</div>
        )}
        {remaining.map((size, i) => (
          <ShipDockItem
            key={`${size}-${i}`}
            size={size}
            horizontal={drag?.size === size ? drag.horizontal : true}
            onPointerDown={(e) => startDragFromDock(size, e)}
            dimmed={drag?.size === size && drag?.fromIndex === undefined}
          />
        ))}
      </div>

      {/* GRID */}
      <div ref={gridWrapRef} className="flex justify-center mb-6 select-none">
        <Grid
          cells={grid}
          onCellClick={cellClick}
          onCellHover={(x, y) => setHoverCell([x, y])}
          onCellLeave={() => !drag && setHoverCell(null)}
          maxWidthPx={460}
        />
      </div>

      {/* ACTIONS */}
      <div className="flex flex-wrap gap-2.5 justify-center mb-5">
        <button
          onClick={rotateDrag}
          disabled={!drag}
          className="btn"
          title="Pivoter le bateau en main (R / Espace)"
        >
          <RotateCw className="w-4 h-4" />
          <span className="hidden sm:inline">Pivoter</span>
        </button>
        <button onClick={undo} disabled={history.length === 0} className="btn">
          <Undo2 className="w-4 h-4" />
          <span className="hidden sm:inline">Annuler</span>
        </button>
        <button onClick={reset} disabled={placed.length === 0} className="btn">
          <Trash2 className="w-4 h-4" />
          <span className="hidden sm:inline">Effacer</span>
        </button>
        <button onClick={auto} className="btn">
          <Shuffle className="w-4 h-4" />
          <span className="hidden sm:inline">Aléatoire</span>
        </button>
      </div>

      <div className="flex justify-center">
        <button
          onClick={submit}
          disabled={!allPlaced || submitting}
          className="btn btn-primary w-full max-w-xs"
          style={{ padding: "16px 28px" }}
        >
          <Check className="w-4 h-4" />
          {submitting ? "Validation…" : "Valider la flotte"}
        </button>
      </div>

      {error && (
        <p className="text-sm text-center mt-4" style={{ color: "var(--bad)" }}>
          {error}
        </p>
      )}

      {/* GHOST — follows the pointer while dragging */}
      {drag && (
        <div
          className="pointer-events-none fixed z-50"
          style={{
            left: drag.x,
            top: drag.y,
            transform: "translate(-50%, -50%)",
          }}
        >
          <ShipPreviewVisual size={drag.size} horizontal={drag.horizontal} mini />
        </div>
      )}
    </motion.div>
  );
}

function ShipDockItem({
  size,
  horizontal,
  onPointerDown,
  dimmed,
}: {
  size: number;
  horizontal: boolean;
  onPointerDown: (e: React.PointerEvent) => void;
  dimmed?: boolean;
}) {
  return (
    <button
      onPointerDown={onPointerDown}
      className="flex items-center gap-2 px-3 py-2 rounded-lg transition-all"
      style={{
        background: "var(--ink-2)",
        border: "1px solid var(--ink-3)",
        cursor: "grab",
        touchAction: "none",
        opacity: dimmed ? 0.35 : 1,
      }}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--accent-edge)")}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = "")}
    >
      <ShipPreviewVisual size={size} horizontal={horizontal} mini />
      <span className="mono text-xs" style={{ color: "var(--fg-2)" }}>
        {size}
      </span>
    </button>
  );
}

function ShipPreviewVisual({
  size,
  horizontal,
  mini,
}: {
  size: number;
  horizontal: boolean;
  mini?: boolean;
}) {
  const cell = mini ? 14 : 24;
  const cells = Array.from({ length: size });
  return (
    <div
      className="inline-flex"
      style={{
        flexDirection: horizontal ? "row" : "column",
        gap: 2,
      }}
    >
      {cells.map((_, i) => (
        <div
          key={i}
          style={{
            width: cell,
            height: cell,
            background: "oklch(40% 0.08 270)",
            border: "1px solid oklch(50% 0.1 270)",
            borderRadius: 3,
          }}
        />
      ))}
    </div>
  );
}
