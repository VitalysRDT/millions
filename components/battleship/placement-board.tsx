"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Grid, type GridCellState } from "./grid";
import { FLEET, GRID_SIZE } from "@/lib/games/battleship/constants";
import { Button } from "@/components/ui/button";
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
      className="max-w-3xl mx-auto px-6 py-10"
    >
      <h2 className="text-display text-3xl font-bold text-center mb-2">Place ta flotte</h2>
      <p className="text-center text-white/50 text-sm mb-8">
        {!allPlaced && currentSize !== undefined
          ? `Place ton bateau de ${currentSize} cases (${remainingFleet.length} restant${remainingFleet.length > 1 ? "s" : ""})`
          : "Flotte prête !"}
      </p>

      <div className="flex flex-col items-center gap-6">
        <Grid
          cells={grid}
          onCellClick={click}
          onCellHover={(x, y) => setHover([x, y])}
          onCellLeave={() => setHover(null)}
          cellPx={38}
        />

        <div className="flex flex-wrap gap-2 justify-center">
          {FLEET.map((size, i) => (
            <div
              key={i}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono ${
                i < pendingIdx
                  ? "bg-success/20 text-success line-through"
                  : i === pendingIdx
                    ? "bg-gold/20 text-gold ring-2 ring-gold"
                    : "bg-white/[0.04] text-white/60"
              }`}
            >
              {size}
            </div>
          ))}
        </div>

        <div className="flex gap-3">
          <Button onClick={() => setHorizontal(!horizontal)} variant="ghost" size="md">
            <RotateCw className="w-4 h-4" />
            {horizontal ? "Horizontal" : "Vertical"}
          </Button>
          <Button onClick={auto} variant="ghost" size="md">
            <Shuffle className="w-4 h-4" />
            Aléatoire
          </Button>
          <Button onClick={reset} variant="ghost" size="md">
            <Trash2 className="w-4 h-4" />
            Effacer
          </Button>
        </div>

        <Button
          onClick={submit}
          disabled={!allPlaced || submitting}
          variant="gold"
          size="lg"
          className="min-w-[240px]"
        >
          {submitting ? "Validation..." : "Valider la flotte"}
        </Button>

        {error && <p className="text-danger text-sm">{error}</p>}
      </div>
    </motion.div>
  );
}
