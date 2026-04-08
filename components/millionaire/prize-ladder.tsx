"use client";

import { TIERS_EUR, SAFETY_TIER_INDEXES } from "@/lib/games/millionaire/constants";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils/cn";

function fmtSimple(n: number): string {
  if (n >= 1_000_000) return "1 000 000 €";
  if (n >= 1_000) return `${(n / 1000).toLocaleString("fr-FR")} 000 €`;
  return `${n} €`;
}

export function PrizeLadder({ currentTier }: { currentTier: number }) {
  return (
    <div className="relative">
      <div className="absolute -inset-1 rounded-[20px] sm:rounded-[24px] bg-gold-gradient opacity-15 blur-xl pointer-events-none" />
      <div className="relative border-gold-gradient rounded-[20px] sm:rounded-[24px] card-spot p-2 sm:p-3 w-full">
        <p className="text-[9px] sm:text-[10px] uppercase tracking-[0.25em] text-gold/70 text-center pt-1.5 sm:pt-2 pb-2 sm:pb-3 font-bold">
          Tableau des gains
        </p>
        <ul className="space-y-0.5 sm:space-y-1">
          {[...TIERS_EUR].reverse().map((amount, reversedIdx) => {
            const i = TIERS_EUR.length - 1 - reversedIdx;
            const tierIndex = i;
            const tierNum = i + 1;
            const isWon = currentTier >= tierNum;
            const isCurrent = currentTier + 1 === tierNum;
            const isSafety = SAFETY_TIER_INDEXES.includes(tierIndex);
            return (
              <motion.li
                key={tierNum}
                animate={
                  isCurrent
                    ? {
                        scale: [1, 1.04, 1],
                        transition: { duration: 1.6, repeat: Infinity },
                      }
                    : {}
                }
                className={cn(
                  "flex items-center justify-between px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-xs sm:text-sm transition-all relative",
                  isCurrent && "bg-gold-gradient text-bg-deep font-bold shadow-gold",
                  !isCurrent && isWon && "bg-gold/20 text-gold font-semibold",
                  !isCurrent && !isWon && isSafety && "text-white/95 font-semibold border border-gold/20",
                  !isCurrent && !isWon && !isSafety && "text-white/40",
                )}
              >
                <span
                  className={cn(
                    "font-mono w-5 sm:w-7 text-right text-[10px] sm:text-xs",
                    isCurrent ? "opacity-80" : "opacity-50",
                  )}
                >
                  {tierNum.toString().padStart(2, "0")}
                </span>
                <span className="font-semibold text-sm sm:text-base">{fmtSimple(amount)}</span>
                {isSafety && !isCurrent && (
                  <span className="absolute right-1.5 sm:right-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-gold" />
                )}
              </motion.li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
