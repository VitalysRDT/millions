export const GRID_SIZE = 10;

// Standard fleet sizes — must total 17 cells
export const FLEET: readonly number[] = [5, 4, 3, 3, 2];

/** Time to answer the question. */
export const QUESTION_TIMER_MS = 15_000;
/** Time to pick a cell to fire at after a correct answer. */
export const SHOOT_TIMER_MS = 20_000;
/** Duration of the reveal phase when a question is answered wrongly or timed out. */
export const REVEAL_TIMER_MS = 4_000;

/**
 * Six distinct shot shapes — one per difficulty level.
 * Pattern complexity grows monotonically with difficulty.
 *
 *   1 · single (1 cell)            2 ·· line2 (2 cells)
 *   3 ··· line3 (3 cells)          4 ⊥ tShape (4 cells)
 *   5 + cross5 (5 cells)           6 ▦ area9 (3×3 = 9 cells)
 */
export type ShotPattern =
  | "single"
  | "line2"
  | "line3"
  | "tShape"
  | "cross5"
  | "area9";

export function patternForDifficulty(d: number): ShotPattern {
  switch (d) {
    case 1:
      return "single";
    case 2:
      return "line2";
    case 3:
      return "line3";
    case 4:
      return "tShape";
    case 5:
      return "cross5";
    default:
      return "area9";
  }
}

export function patternCellCount(p: ShotPattern): number {
  switch (p) {
    case "single":
      return 1;
    case "line2":
      return 2;
    case "line3":
      return 3;
    case "tShape":
      return 4;
    case "cross5":
      return 5;
    case "area9":
      return 9;
  }
}

export function patternLabel(p: ShotPattern): string {
  switch (p) {
    case "single":
      return "Tir simple";
    case "line2":
      return "Paire horizontale";
    case "line3":
      return "Ligne 3 cases";
    case "tShape":
      return "Forme en T";
    case "cross5":
      return "Croix 5 cases";
    case "area9":
      return "Zone 3×3";
  }
}
