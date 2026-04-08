export const GRID_SIZE = 10;

// Standard fleet sizes — must total 17 cells
export const FLEET: readonly number[] = [5, 4, 3, 3, 2];

export const QUESTION_TIMER_MS = 15_000;

export type ShotPattern = "single" | "line3" | "cross5";

export function patternForDifficulty(d: number): ShotPattern {
  if (d <= 2) return "single";
  if (d <= 4) return "line3";
  return "cross5";
}

export function patternCellCount(p: ShotPattern): number {
  if (p === "single") return 1;
  if (p === "line3") return 3;
  return 5;
}
