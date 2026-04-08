import { FLEET, GRID_SIZE } from "./constants";

export interface PlacedShip {
  size: number;
  cells: [number, number][];
}

export class InvalidPlacement extends Error {}

export function validateFleetPlacement(ships: PlacedShip[]): void {
  if (!Array.isArray(ships) || ships.length !== FLEET.length) {
    throw new InvalidPlacement("wrong_ship_count");
  }
  // Match sizes (multiset)
  const expected = [...FLEET].sort((a, b) => a - b);
  const got = ships.map((s) => s.size).sort((a, b) => a - b);
  for (let i = 0; i < expected.length; i++) {
    if (expected[i] !== got[i]) throw new InvalidPlacement("wrong_ship_sizes");
  }

  const seen = new Set<string>();
  for (const ship of ships) {
    if (!Array.isArray(ship.cells) || ship.cells.length !== ship.size) {
      throw new InvalidPlacement("ship_cell_count_mismatch");
    }
    // Check straight line (all same x or all same y, and contiguous)
    const xs = ship.cells.map((c) => c[0]);
    const ys = ship.cells.map((c) => c[1]);
    const allSameX = xs.every((v) => v === xs[0]);
    const allSameY = ys.every((v) => v === ys[0]);
    if (!allSameX && !allSameY) throw new InvalidPlacement("ship_not_straight");
    const sorted = [...ship.cells].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    for (let i = 1; i < sorted.length; i++) {
      const prev = sorted[i - 1]!;
      const cur = sorted[i]!;
      const dx = cur[0] - prev[0];
      const dy = cur[1] - prev[1];
      if (allSameX && (dy !== 1 || dx !== 0)) throw new InvalidPlacement("ship_not_contiguous");
      if (allSameY && (dx !== 1 || dy !== 0)) throw new InvalidPlacement("ship_not_contiguous");
    }
    for (const [x, y] of ship.cells) {
      if (x < 0 || y < 0 || x >= GRID_SIZE || y >= GRID_SIZE) {
        throw new InvalidPlacement("out_of_grid");
      }
      const key = `${x},${y}`;
      if (seen.has(key)) throw new InvalidPlacement("ships_overlap");
      seen.add(key);
    }
  }
}
