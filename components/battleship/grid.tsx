"use client";

import { GRID_SIZE } from "@/lib/games/battleship/constants";

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

  const cols = showCoords ? GRID_SIZE + 1 : GRID_SIZE;

  return (
    <div
      className="w-full mx-auto"
      style={{ maxWidth: `min(100%, ${maxWidthPx}px)` }}
      onMouseLeave={onCellLeave}
    >
      <div
        className="grid w-full"
        style={{
          gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
          gap: 2,
        }}
      >
        {showCoords && (
          <>
            <div className="aspect-square" />
            {LETTERS.map((l) => (
              <div
                key={l}
                className="aspect-square flex items-center justify-center mono"
                style={{ fontSize: 9, color: "var(--fg-3)" }}
              >
                {l}
              </div>
            ))}
          </>
        )}
        {Array.from({ length: GRID_SIZE }).map((_, y) => (
          <div key={y} className="contents">
            {showCoords && (
              <div
                className="aspect-square flex items-center justify-center mono"
                style={{ fontSize: 9, color: "var(--fg-3)" }}
              >
                {y + 1}
              </div>
            )}
            {Array.from({ length: GRID_SIZE }).map((_, x) => {
              const c = cells[x]?.[y] ?? "empty";
              const hi = isHighlight(x, y);

              let bg = "var(--ink-1)";
              let border = "var(--ink-3)";
              let content: React.ReactNode = null;

              if (c === "ship") {
                bg = "oklch(30% 0.06 270)";
                border = "oklch(40% 0.08 270)";
              } else if (c === "ship-preview") {
                bg = "var(--accent-soft)";
                border = "var(--accent-edge)";
              } else if (c === "miss") {
                bg = "var(--ink-2)";
                content = (
                  <span style={{ color: "var(--fg-3)", fontSize: 11 }}>·</span>
                );
              } else if (c === "hit") {
                bg = "var(--bad)";
                content = (
                  <span
                    style={{
                      color: "var(--fg-0)",
                      fontSize: 12,
                      fontWeight: 700,
                    }}
                  >
                    ✕
                  </span>
                );
              } else if (c === "sunk") {
                bg = "oklch(35% 0.18 25)";
                content = (
                  <span
                    style={{
                      color: "var(--fg-0)",
                      fontSize: 11,
                      fontWeight: 700,
                    }}
                  >
                    ✕
                  </span>
                );
              }

              if (hi && c === "empty") {
                bg = "var(--accent-soft)";
              }

              return (
                <button
                  key={`${x}-${y}`}
                  onClick={() => onCellClick?.(x, y)}
                  onMouseEnter={() => onCellHover?.(x, y)}
                  className="aspect-square relative touch-manipulation flex items-center justify-center transition-all"
                  style={{
                    background: bg,
                    border: `1px solid ${hi ? "var(--accent)" : border}`,
                    borderRadius: 3,
                    cursor:
                      onCellClick && c === "empty" ? "pointer" : "default",
                  }}
                >
                  {content}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
