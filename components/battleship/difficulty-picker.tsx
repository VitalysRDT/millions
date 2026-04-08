"use client";

import { motion } from "framer-motion";
import { Crosshair, Plus, Sparkles } from "lucide-react";
import { patternForDifficulty, patternCellCount } from "@/lib/games/battleship/constants";

const DIFFS = [1, 2, 3, 4, 5, 6] as const;

const labels: Record<number, string> = {
  1: "Facile",
  2: "Facile",
  3: "Moyen",
  4: "Moyen",
  5: "Difficile",
  6: "Expert",
};

export function DifficultyPicker({
  onPick,
  disabled,
}: {
  onPick: (d: number) => void;
  disabled?: boolean;
}) {
  return (
    <div className="surface-elevated rounded-2xl sm:rounded-3xl p-4 sm:p-6">
      <h3 className="text-center text-xs sm:text-sm uppercase tracking-widest text-white/40 mb-1">
        Choisis ta difficulté
      </h3>
      <p className="text-center text-white/50 text-xs mb-4 sm:mb-6">
        Plus dur = tir plus puissant
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
        {DIFFS.map((d) => {
          const p = patternForDifficulty(d);
          const cells = patternCellCount(p);
          const Icon = cells === 1 ? Crosshair : cells === 3 ? Plus : Sparkles;
          return (
            <motion.button
              key={d}
              whileHover={!disabled ? { scale: 1.04 } : {}}
              whileTap={!disabled ? { scale: 0.96 } : {}}
              onClick={() => onPick(d)}
              disabled={disabled}
              className="flex flex-col items-center gap-1.5 sm:gap-2 px-3 py-3 sm:px-4 sm:py-4 rounded-xl sm:rounded-2xl border-2 border-bg-border bg-bg-card hover:border-gold/60 hover:bg-gold/5 disabled:opacity-50 transition"
            >
              <Icon className="w-5 h-5 text-gold" />
              <span className="font-bold text-white text-sm sm:text-base">Niveau {d}</span>
              <span className="text-[10px] sm:text-xs text-white/40">{labels[d]}</span>
              <span className="text-[10px] sm:text-xs font-mono text-gold/80">
                {cells === 1 ? "1 tir" : cells === 3 ? "Ligne 3" : "Croix 5"}
              </span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
