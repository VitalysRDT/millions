import {
  GRID_SIZE,
  type Rotation,
  type ShotPattern,
  patternCellCount,
} from "./constants";
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

function inBounds([cx, cy]: [number, number]): boolean {
  return cx >= 0 && cx < GRID_SIZE && cy >= 0 && cy < GRID_SIZE;
}

/** Rotate a (dx, dy) offset around the origin by the given degrees (clockwise). */
function rotateOffset(
  [dx, dy]: [number, number],
  rotation: Rotation,
): [number, number] {
  switch (rotation) {
    case 0:
      return [dx, dy];
    case 90:
      return [-dy, dx];
    case 180:
      return [-dx, -dy];
    case 270:
      return [dy, -dx];
  }
}

/** Offset definition for each pattern at rotation 0 (relative to origin). */
function patternOffsets(pattern: ShotPattern): [number, number][] {
  switch (pattern) {
    case "single":
      return [[0, 0]];
    case "line2":
      // origin + one cell to the right
      return [
        [0, 0],
        [1, 0],
      ];
    case "line3":
      // three in a horizontal line, origin centred
      return [
        [-1, 0],
        [0, 0],
        [1, 0],
      ];
    case "tShape":
      // line3 + one cell below the centre = ⊥
      return [
        [-1, 0],
        [0, 0],
        [1, 0],
        [0, 1],
      ];
    case "cross5":
      return [
        [0, 0],
        [-1, 0],
        [1, 0],
        [0, -1],
        [0, 1],
      ];
    case "area9": {
      const out: [number, number][] = [];
      for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
          out.push([dx, dy]);
        }
      }
      return out;
    }
  }
}

/**
 * Expand an origin cell + pattern (+ optional rotation) into the cells actually fired.
 * Rotation has no visual effect on symmetric patterns but is accepted anyway.
 */
export function expandPattern(
  origin: [number, number],
  pattern: ShotPattern,
  rotation: Rotation = 0,
): [number, number][] {
  const [x, y] = origin;
  return patternOffsets(pattern)
    .map((o) => rotateOffset(o, rotation))
    .map(([dx, dy]): [number, number] => [x + dx, y + dy])
    .filter(inBounds);
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
