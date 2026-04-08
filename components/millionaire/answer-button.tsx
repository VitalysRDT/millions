"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils/cn";

const LETTERS = ["A", "B", "C", "D"] as const;

export type AnswerState = "idle" | "selected" | "locked" | "correct" | "wrong" | "hidden";

export function AnswerButton({
  index,
  text,
  state,
  onClick,
  disabled,
}: {
  index: 0 | 1 | 2 | 3;
  text: string;
  state: AnswerState;
  shape?: "left" | "right";
  onClick?: () => void;
  disabled?: boolean;
}) {
  const isHidden = state === "hidden";
  const isInteractive = state === "idle" && !disabled && !isHidden;

  return (
    <motion.button
      onClick={onClick}
      disabled={
        disabled ||
        isHidden ||
        state === "locked" ||
        state === "correct" ||
        state === "wrong"
      }
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: isHidden ? 0.12 : 1, y: 0 }}
      transition={{ duration: 0.45, delay: index * 0.07, ease: [0.16, 1, 0.3, 1] }}
      whileHover={isInteractive ? { scale: 1.02, y: -2 } : {}}
      whileTap={state === "idle" ? { scale: 0.98 } : {}}
      className={cn(
        "relative group w-full h-20 md:h-24 flex items-center gap-5 pl-4 pr-6 md:pl-5 md:pr-8",
        "rounded-2xl border-2 text-left transition-all overflow-hidden",
        state === "idle" &&
          "bg-gradient-to-br from-bg-card/95 to-bg-deep/90 border-bg-border hover:border-gold/70",
        state === "selected" &&
          "bg-gradient-to-br from-gold/30 to-gold/10 border-gold shadow-gold",
        state === "locked" && "bg-bg-surface/60 border-white/10 opacity-55",
        state === "correct" &&
          "bg-gradient-to-br from-success/35 to-success/10 border-success shadow-[0_0_40px_rgba(33,210,124,0.55)]",
        state === "wrong" &&
          "bg-gradient-to-br from-danger/35 to-danger/10 border-danger shadow-[0_0_40px_rgba(255,84,112,0.55)]",
        state === "hidden" && "bg-bg-surface/30 border-bg-border line-through grayscale",
      )}
    >
      {/* Glow trail on hover */}
      {isInteractive && (
        <span className="absolute inset-0 bg-gradient-to-r from-gold/0 via-gold/10 to-gold/0 opacity-0 group-hover:opacity-100 transition-opacity" />
      )}
      <span
        className={cn(
          "relative flex-shrink-0 w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center font-bold text-xl md:text-2xl border-2 transition-all",
          state === "correct" &&
            "bg-success text-bg-deep border-success",
          state === "wrong" &&
            "bg-danger text-bg-deep border-danger",
          state === "selected" &&
            "bg-gold-gradient text-bg-deep border-gold shadow-gold",
          state === "idle" &&
            "bg-bg-deep/80 text-gold border-gold/40 group-hover:border-gold group-hover:bg-gold/15",
          state === "locked" && "bg-white/5 text-white/40 border-white/10",
          state === "hidden" && "bg-white/5 text-white/30 border-white/10",
        )}
      >
        {LETTERS[index]}
      </span>
      <span className="relative font-medium text-base md:text-lg text-white/95 leading-snug">
        {text}
      </span>
    </motion.button>
  );
}
