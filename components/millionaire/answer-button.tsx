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
  onClick?: () => void;
  disabled?: boolean;
}) {
  const isHidden = state === "hidden";

  return (
    <motion.button
      onClick={onClick}
      disabled={disabled || isHidden || state === "locked" || state === "correct" || state === "wrong"}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: isHidden ? 0.15 : 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.06 }}
      whileHover={!disabled && !isHidden && state === "idle" ? { scale: 1.02 } : {}}
      whileTap={!disabled && state === "idle" ? { scale: 0.98 } : {}}
      className={cn(
        "relative group flex items-center gap-4 px-5 py-4 rounded-2xl border-2 text-left transition-all",
        state === "idle" &&
          "bg-bg-surface/80 border-bg-border hover:border-gold/50 hover:bg-bg-surface",
        state === "selected" && "bg-gold/20 border-gold shadow-gold-soft",
        state === "locked" && "bg-bg-surface/80 border-white/10 opacity-60",
        state === "correct" && "bg-success/20 border-success shadow-[0_0_25px_rgba(33,210,124,0.4)]",
        state === "wrong" && "bg-danger/20 border-danger shadow-[0_0_25px_rgba(255,84,112,0.4)]",
        state === "hidden" && "bg-bg-surface/30 border-bg-border line-through grayscale",
      )}
    >
      <span
        className={cn(
          "flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg",
          state === "correct"
            ? "bg-success text-bg-deep"
            : state === "wrong"
              ? "bg-danger text-bg-deep"
              : state === "selected"
                ? "bg-gold text-bg-deep"
                : "bg-white/10 text-white",
        )}
      >
        {LETTERS[index]}
      </span>
      <span className="font-medium text-white/90">{text}</span>
    </motion.button>
  );
}
