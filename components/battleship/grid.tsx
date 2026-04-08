"use client";

import { GRID_SIZE } from "@/lib/games/battleship/constants";
import { cn } from "@/lib/utils/cn";

export type GridCellState = "empty" | "ship" | "ship-preview" | "miss" | "hit" | "sunk";

export interface GridProps {
  cells: GridCellState[][]; // [x][y]
  onCellClick?: (x: number, y: number) => void;
  onCellHover?: (x: number, y: number) => void;
  onCellLeave?: () => void;
  highlight?: [number, number][];
  cellPx?: number;
  showCoords?: boolean;
}

const LETTERS = "ABCDEFGHIJ".split("");

export function Grid({
  cells,
  onCellClick,
  onCellHover,
  onCellLeave,
  highlight,
  cellPx = 36,
  showCoords = true,
}: GridProps) {
  const isHighlight = (x: number, y: number) =>
    highlight?.some(([hx, hy]) => hx === x && hy === y) ?? false;

  return (
    <div
      className="inline-block"
      style={{ filter: "drop-shadow(0 6px 14px rgba(0,0,0,0.3))" }}
      onMouseLeave={onCellLeave}
    >
      <div className="flex">
        {showCoords && <div style={{ width: cellPx, height: cellPx }} />}
        {showCoords &&
          LETTERS.map((l) => (
            <div
              key={l}
              className="flex items-center justify-center text-white/40 text-xs font-mono"
              style={{ width: cellPx, height: cellPx }}
            >
              {l}
            </div>
          ))}
      </div>
      {Array.from({ length: GRID_SIZE }).map((_, y) => (
        <div key={y} className="flex">
          {showCoords && (
            <div
              className="flex items-center justify-center text-white/40 text-xs font-mono"
              style={{ width: cellPx, height: cellPx }}
            >
              {y + 1}
            </div>
          )}
          {Array.from({ length: GRID_SIZE }).map((_, x) => {
            const c = cells[x]?.[y] ?? "empty";
            return (
              <button
                key={`${x}-${y}`}
                onClick={() => onCellClick?.(x, y)}
                onMouseEnter={() => onCellHover?.(x, y)}
                style={{ width: cellPx, height: cellPx }}
                className={cn(
                  "border border-white/5 transition-all relative",
                  c === "empty" && "bg-bg-deep/60 hover:bg-bg-surface",
                  c === "ship" && "bg-gold/40 border-gold/60",
                  c === "ship-preview" && "bg-gold/20 border-gold/40",
                  c === "miss" && "bg-white/[0.04]",
                  c === "hit" && "bg-danger/30 border-danger/60",
                  c === "sunk" && "bg-danger/60 border-danger",
                  isHighlight(x, y) && "bg-gold/30 ring-2 ring-gold",
                )}
              >
                {c === "miss" && (
                  <span className="absolute inset-0 flex items-center justify-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-white/30" />
                  </span>
                )}
                {(c === "hit" || c === "sunk") && (
                  <span className="absolute inset-0 flex items-center justify-center text-danger text-lg font-bold">
                    ✕
                  </span>
                )}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}
