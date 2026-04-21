"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Grid, type GridCellState } from "./grid";
import { FLEET, GRID_SIZE } from "@/lib/games/battleship/constants";
import { RotateCw, Shuffle, Trash2 } from "lucide-react";
import { postJson } from "@/lib/utils/fetcher";

interface PlacedShip {
  size: number;
  cells: [number, number][];
}

function emptyGrid(): GridCellState[][] {
  return Array.from({ length: GRID_SIZE }, () =>
    Array.from({ length: GRID_SIZE }, () => "empty" as GridCellState),
  );
}

function shipFootprint(
  size: number,
  origin: [number, number],
  horizontal: boolean,
): [number, number][] | null {
  const [x, y] = origin;
  const cells: [number, number][] = [];
  for (let i = 0; i < size; i++) {
    const cx = horizontal ? x + i : x;
    const cy = horizontal ? y : y + i;
    if (cx < 0 || cy < 0 || cx >= GRID_SIZE || cy >= GRID_SIZE) return null;
    cells.push([cx, cy]);
  }
  return cells;
}

function overlaps(a: [number, number][], b: [number, number][]): boolean {
  const set = new Set(a.map(([x, y]) => `${x},${y}`));
  return b.some(([x, y]) => set.has(`${x},${y}`));
}

export function PlacementBoard({
  code,
  onPlaced,
}: {
  code: string;
  onPlaced: () => void;
}) {
  const [placed, setPlaced] = useState<PlacedShip[]>([]);
  const [pendingIdx, setPendingIdx] = useState<number>(0);
  const [horizontal, setHorizontal] = useState(true);
  const [hover, setHover] = useState<[number, number] | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const remainingFleet = FLEET.slice(pendingIdx);
  const currentSize = remainingFleet[0];

  const grid: GridCellState[][] = (() => {
    const g = emptyGrid();
    for (const ship of placed) {
      for (const [x, y] of ship.cells) g[x]![y] = "ship";
    }
    if (currentSize !== undefined && hover) {
      const cells = shipFootprint(currentSize, hover, horizontal);
      if (cells && !cells.some(([x, y]) => g[x]![y] === "ship")) {
        for (const [x, y] of cells) g[x]![y] = "ship-preview";
      }
    }
    return g;
  })();

  const click = (x: number, y: number) => {
    if (currentSize === undefined) return;
    const cells = shipFootprint(currentSize, [x, y], horizontal);
    if (!cells) return;
    if (placed.some((p) => overlaps(p.cells, cells))) return;
    setPlaced([...placed, { size: currentSize, cells }]);
    setPendingIdx(pendingIdx + 1);
    setError(null);
  };

  const reset = () => {
    setPlaced([]);
    setPendingIdx(0);
    setError(null);
  };

  const auto = () => {
    const all: PlacedShip[] = [];
    for (const size of FLEET) {
      let attempt = 0;
      while (attempt < 200) {
        attempt++;
        const x = Math.floor(Math.random() * GRID_SIZE);
        const y = Math.floor(Math.random() * GRID_SIZE);
        const horiz = Math.random() < 0.5;
        const cells = shipFootprint(size, [x, y], horiz);
        if (!cells) continue;
        if (all.some((p) => overlaps(p.cells, cells))) continue;
        all.push({ size, cells });
        break;
      }
    }
    if (all.length === FLEET.length) {
      setPlaced(all);
      setPendingIdx(FLEET.length);
      setError(null);
    }
  };

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

  const allPlaced = placed.length === FLEET.length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="screen max-w-[900px] mx-auto px-5 sm:px-7 py-10"
    >
      <div className="text-center mb-6">
        <div className="eyebrow mb-2">Placement</div>
        <h2 className="display m-0" style={{ fontSize: "clamp(28px, 5vw, 42px)", lineHeight: 1 }}>
          Place ta flotte
        </h2>
        <p className="muted text-sm mt-3">
          {!allPlaced && currentSize !== undefined
            ? `Place ton bateau de ${currentSize} cases (${remainingFleet.length} restant${remainingFleet.length > 1 ? "s" : ""})`
            : "Flotte prête !"}
        </p>
      </div>

      <div className="flex flex-col items-center gap-6">
        <Grid
          cells={grid}
          onCellClick={click}
          onCellHover={(x, y) => setHover([x, y])}
          onCellLeave={() => setHover(null)}
          maxWidthPx={460}
        />

        <div className="flex flex-wrap gap-2 justify-center">
          {FLEET.map((size, i) => {
            const done = i < pendingIdx;
            const current = i === pendingIdx;
            return (
              <div
                key={i}
                className="mono text-xs px-3 py-1.5 rounded-lg"
                style={{
                  background: done
                    ? "oklch(72% 0.18 150 / 0.2)"
                    : current
                      ? "var(--accent-soft)"
                      : "var(--ink-2)",
                  color: done
                    ? "var(--good)"
                    : current
                      ? "var(--accent)"
                      : "var(--fg-2)",
                  border: current ? "1px solid var(--accent-edge)" : "1px solid transparent",
                  textDecoration: done ? "line-through" : "none",
                }}
              >
                {size}
              </div>
            );
          })}
        </div>

        <div className="flex flex-wrap gap-2.5 justify-center">
          <button onClick={() => setHorizontal(!horizontal)} className="btn">
            <RotateCw className="w-4 h-4" />
            <span className="hidden sm:inline">{horizontal ? "Horizontal" : "Vertical"}</span>
            <span className="sm:hidden">{horizontal ? "H" : "V"}</span>
          </button>
          <button onClick={auto} className="btn">
            <Shuffle className="w-4 h-4" />
            <span className="hidden sm:inline">Aléatoire</span>
            <span className="sm:hidden">Auto</span>
          </button>
          <button onClick={reset} className="btn">
            <Trash2 className="w-4 h-4" />
            <span className="hidden sm:inline">Effacer</span>
          </button>
        </div>

        <button
          onClick={submit}
          disabled={!allPlaced || submitting}
          className="btn btn-primary w-full max-w-xs sm:w-auto"
          style={{ padding: "16px 28px" }}
        >
          {submitting ? "Validation…" : "Valider la flotte"}
        </button>

        {error && (
          <p className="text-sm" style={{ color: "var(--bad)" }}>
            {error}
          </p>
        )}
      </div>
    </motion.div>
  );
}
