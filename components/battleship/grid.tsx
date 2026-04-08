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
  /** Max width in pixels of the entire grid (including coords). Defaults to 440. */
  maxWidthPx?: number;
  showCoords?: boolean;
}

const LETTERS = "ABCDEFGHIJ".split("");

export function Grid({
  cells,
  onCellClick,
  onCellHover,
  onCellLeave,
  highlight,
  maxWidthPx = 440,
  showCoords = true,
}: GridProps) {
  const isHighlight = (x: number, y: number) =>
    highlight?.some(([hx, hy]) => hx === x && hy === y) ?? false;

  // CSS grid: 11 cols (1 coord + 10 cells) or 10 cols if no coords. Cells use aspect-square.
  const cols = showCoords ? GRID_SIZE + 1 : GRID_SIZE;

  return (
    <div
      className="w-full mx-auto"
      style={{
        maxWidth: `min(100%, ${maxWidthPx}px)`,
        filter: "drop-shadow(0 6px 14px rgba(0,0,0,0.3))",
      }}
      onMouseLeave={onCellLeave}
    >
      <div
        className="grid w-full"
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
      >
        {/* Top row: empty corner + letters */}
        {showCoords && (
          <>
            <div className="aspect-square" />
            {LETTERS.map((l) => (
              <div
                key={l}
                className="aspect-square flex items-center justify-center text-white/40 text-[10px] sm:text-xs font-mono"
              >
                {l}
              </div>
            ))}
          </>
        )}
        {/* Body rows */}
        {Array.from({ length: GRID_SIZE }).map((_, y) => (
          <div key={y} className="contents">
            {showCoords && (
              <div className="aspect-square flex items-center justify-center text-white/40 text-[10px] sm:text-xs font-mono">
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
                  className={cn(
                    "aspect-square border border-white/5 transition-all relative touch-manipulation",
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
                      <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-white/30" />
                    </span>
                  )}
                  {(c === "hit" || c === "sunk") && (
                    <span className="absolute inset-0 flex items-center justify-center text-danger text-sm sm:text-base md:text-lg font-bold">
                      ✕
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
