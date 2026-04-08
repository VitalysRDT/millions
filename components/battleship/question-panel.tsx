"use client";

import { motion, AnimatePresence } from "framer-motion";
import type { BattleshipQuestionPublic } from "@/lib/games/shared/types";
import { AnswerButton } from "@/components/millionaire/answer-button";
import { useCountdown } from "@/hooks/use-countdown";

export function QuestionPanel({
  question,
  deadlineAt,
  selectedIdx,
  revealedCorrectIdx,
  onSelect,
  myChoiceWasCorrect,
}: {
  question: BattleshipQuestionPublic;
  deadlineAt: number;
  selectedIdx: number | null;
  revealedCorrectIdx?: number;
  myChoiceWasCorrect?: boolean;
  onSelect: (i: 0 | 1 | 2 | 3) => void;
}) {
  const remaining = useCountdown(deadlineAt);
  const isRevealed = revealedCorrectIdx !== undefined;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="surface-elevated rounded-3xl p-6 max-w-2xl mx-auto"
    >
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs uppercase tracking-widest text-white/40">
          {question.category} · Niveau {question.difficulty}
        </p>
        <div className="flex items-center gap-2">
          <span className="text-xs text-white/40">Récompense :</span>
          <span className="text-xs font-bold text-gold">
            {question.patternReward === "single" ? "1 tir" : question.patternReward === "line3" ? "Ligne 3" : "Croix 5"}
          </span>
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.h2
          key={question.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-display text-2xl font-semibold text-center mb-6"
        >
          {question.text}
        </motion.h2>
      </AnimatePresence>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
        {question.answers.map((a, i) => {
          let state: "idle" | "selected" | "correct" | "wrong" | "locked" = "idle";
          if (isRevealed) {
            if (i === revealedCorrectIdx) state = "correct";
            else if (i === selectedIdx && !myChoiceWasCorrect) state = "wrong";
            else state = "locked";
          } else if (selectedIdx !== null) state = selectedIdx === i ? "selected" : "locked";
          return (
            <AnswerButton
              key={i}
              index={i as 0 | 1 | 2 | 3}
              text={a}
              state={state}
              onClick={() => onSelect(i as 0 | 1 | 2 | 3)}
            />
          );
        })}
      </div>

      <div className="text-center">
        <span
          className={`inline-block px-4 py-1.5 rounded-full text-sm font-mono ${
            remaining <= 5 ? "bg-danger/20 text-danger" : "bg-gold/15 text-gold"
          }`}
        >
          {remaining}s
        </span>
      </div>
    </motion.div>
  );
}
