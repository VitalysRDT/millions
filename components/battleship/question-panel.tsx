"use client";

import { motion, AnimatePresence } from "framer-motion";
import type { BattleshipQuestionPublic } from "@/lib/games/shared/types";
import { AnswerButton } from "@/components/millionaire/answer-button";
import { useCountdown } from "@/hooks/use-countdown";
import { patternLabel } from "@/lib/games/battleship/constants";

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
  const rewardLabel = patternLabel(question.patternReward);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="surface max-w-2xl mx-auto p-6 sm:p-7"
    >
      <div className="flex items-start justify-between gap-4 mb-4 flex-wrap">
        <div>
          <div className="chip accent mb-2.5">
            Niveau {question.difficulty} · {rewardLabel}
          </div>
          <div
            className="display leading-[1.35] max-w-[540px]"
            style={{ fontSize: "clamp(18px, 3vw, 22px)" }}
          >
            <AnimatePresence mode="wait">
              <motion.span
                key={question.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                {question.text}
              </motion.span>
            </AnimatePresence>
          </div>
        </div>
        <div
          className="mono flex-shrink-0 px-3 py-1.5 rounded-full text-sm"
          style={{
            background: remaining <= 5 ? "oklch(65% 0.22 25 / 0.2)" : "var(--accent-soft)",
            color: remaining <= 5 ? "var(--bad)" : "var(--accent)",
            border: `1px solid ${remaining <= 5 ? "var(--bad)" : "var(--accent-edge)"}`,
          }}
        >
          {remaining}s
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
        {question.answers.map((a, i) => {
          let state: "idle" | "selected" | "correct" | "wrong" | "locked" = "idle";
          if (isRevealed) {
            if (i === revealedCorrectIdx) state = "correct";
            else if (i === selectedIdx && !myChoiceWasCorrect) state = "wrong";
            else state = "locked";
          } else if (selectedIdx !== null) {
            state = selectedIdx === i ? "selected" : "locked";
          }
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
    </motion.div>
  );
}
