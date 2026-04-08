"use client";

import { TIERS_EUR, SAFETY_TIER_INDEXES } from "@/lib/games/millionaire/constants";
import { motion } from "framer-motion";

function fmt(n: number): string {
  if (n >= 1_000_000) return `${n / 1_000_000} M €`;
  if (n >= 1_000) return `${(n / 1_000).toLocaleString("fr-FR")} 000 €`.replace("000 000", "000");
  return `${n} €`;
}

function fmtSimple(n: number): string {
  if (n >= 1_000_000) return "1 000 000 €";
  if (n >= 1_000) return `${(n / 1000).toLocaleString("fr-FR")} 000 €`;
  return `${n} €`;
}

export function PrizeLadder({ currentTier }: { currentTier: number }) {
  // currentTier: 0 = no question won yet; 1..15 = tier won
  return (
    <div className="surface rounded-2xl p-3 w-full">
      <ul className="space-y-1">
        {TIERS_EUR.map((amount, i) => {
          const tierIndex = i; // 0..14
          const tierNum = i + 1;
          const isWon = currentTier >= tierNum;
          const isCurrent = currentTier + 1 === tierNum;
          const isSafety = SAFETY_TIER_INDEXES.includes(tierIndex);
          return (
            <motion.li
              key={tierNum}
              animate={
                isCurrent
                  ? { scale: [1, 1.04, 1], transition: { duration: 1.6, repeat: Infinity } }
                  : {}
              }
              className={`flex items-center justify-between px-3 py-1.5 rounded-lg text-sm ${
                isCurrent
                  ? "bg-gold-gradient text-bg-deep font-bold shadow-gold"
                  : isWon
                    ? "bg-gold/15 text-gold"
                    : isSafety
                      ? "text-white/80"
                      : "text-white/40"
              }`}
            >
              <span className="font-mono w-6 text-right opacity-70">{tierNum}</span>
              <span className="font-semibold">{fmtSimple(amount)}</span>
            </motion.li>
          );
        })}
      </ul>
    </div>
  );
}

export { fmt };
