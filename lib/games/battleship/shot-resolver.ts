import { GRID_SIZE, type ShotPattern, patternCellCount } from "./constants";
import type { PlacedShip } from "./placement-validator";

export interface InternalShipState extends PlacedShip {
  hits: string[]; // "x,y"
}

export interface CellResult {
  x: number;
  y: number;
  result: "miss" | "hit" | "sunk";
  shipSize?: number;
}

/** Expand a shot center cell + pattern into actual cells fired. */
export function expandPattern(
  origin: [number, number],
  pattern: ShotPattern,
): [number, number][] {
  const [x, y] = origin;
  if (pattern === "single") return [[x, y]];
  if (pattern === "line3")
    return [
      [x, y],
      [x - 1, y],
      [x + 1, y],
    ].filter(([cx, cy]) => cx >= 0 && cx < GRID_SIZE && cy >= 0 && cy < GRID_SIZE) as [number, number][];
  // cross5
  return [
    [x, y],
    [x - 1, y],
    [x + 1, y],
    [x, y - 1],
    [x, y + 1],
  ].filter(([cx, cy]) => cx >= 0 && cx < GRID_SIZE && cy >= 0 && cy < GRID_SIZE) as [number, number][];
}

export function validateShotCells(
  cells: [number, number][],
  pattern: ShotPattern,
): void {
  const expected = patternCellCount(pattern);
  if (cells.length < 1) throw new Error("no_cells");
  if (cells.length > expected) throw new Error("too_many_cells");
  for (const [x, y] of cells) {
    if (x < 0 || y < 0 || x >= GRID_SIZE || y >= GRID_SIZE)
      throw new Error("out_of_grid");
  }
}

/** Apply a shot to a ship list and return the per-cell results. */
export function applyShots(
  ships: InternalShipState[],
  cells: [number, number][],
): { results: CellResult[]; allSunk: boolean; sunkAny: boolean } {
  const results: CellResult[] = [];
  let sunkAny = false;
  for (const [x, y] of cells) {
    const key = `${x},${y}`;
    const hitShip = ships.find((s) =>
      s.cells.some(([sx, sy]) => sx === x && sy === y),
    );
    if (!hitShip) {
      results.push({ x, y, result: "miss" });
      continue;
    }
    if (!hitShip.hits.includes(key)) hitShip.hits.push(key);
    const sunk = hitShip.hits.length === hitShip.size;
    if (sunk) sunkAny = true;
    results.push({
      x,
      y,
      result: sunk ? "sunk" : "hit",
      shipSize: sunk ? hitShip.size : undefined,
    });
  }
  const allSunk = ships.every((s) => s.hits.length === s.size);
  return { results, allSunk, sunkAny };
}

export function shipsRemainingCount(ships: InternalShipState[]): number {
  return ships.filter((s) => s.hits.length < s.size).length;
}

export function sunkSizes(ships: InternalShipState[]): number[] {
  return ships.filter((s) => s.hits.length === s.size).map((s) => s.size);
}
