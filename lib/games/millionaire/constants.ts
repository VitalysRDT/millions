// Standard prize ladder used by the show — 15 tiers
export const TIERS_EUR: readonly number[] = [
  100, 200, 300, 500, 1_000,
  2_000, 4_000, 8_000, 16_000, 32_000,
  64_000, 125_000, 250_000, 500_000, 1_000_000,
];

// Tier indexes considered "safe": when a player fails above one,
// they fall back to the safety tier value (not zero).
export const SAFETY_TIER_INDEXES: readonly number[] = [4, 9]; // 1k€ and 32k€

export function safetyPrizeForTier(tierIdx0Based: number): number {
  if (tierIdx0Based >= 10) return TIERS_EUR[9]!;
  if (tierIdx0Based >= 5) return TIERS_EUR[4]!;
  return 0;
}

// Map a 1..15 round number to a difficulty 1..6
export function difficultyForRound(round: number): number {
  if (round <= 2) return 1;
  if (round <= 4) return 2;
  if (round <= 7) return 3;
  if (round <= 10) return 4;
  if (round <= 13) return 5;
  return 6;
}

export const QUESTION_TIMER_MS = 30_000;
export const REVEAL_DURATION_MS = 5_000;

export const ALL_JOKERS = ["fifty", "public", "phone", "switch"] as const;
export type Joker = (typeof ALL_JOKERS)[number];
