"use client";

import { motion, AnimatePresence } from "framer-motion";
import type { MillionaireQuestionPublic } from "@/lib/games/shared/types";
import { AnswerButton, type AnswerState } from "./answer-button";

export function QuestionCard({
  question,
  round,
  totalRounds,
  selectedIdx,
  hiddenIndexes,
  revealedCorrectIdx,
  myChoiceWasCorrect,
  onSelect,
  publicVote,
  phoneFriendGuess,
}: {
  question: MillionaireQuestionPublic;
  round: number;
  totalRounds: number;
  selectedIdx: number | null;
  hiddenIndexes?: number[];
  revealedCorrectIdx?: number;
  myChoiceWasCorrect?: boolean;
  onSelect: (i: 0 | 1 | 2 | 3) => void;
  publicVote?: number[];
  phoneFriendGuess?: number;
}) {
  const isRevealed = revealedCorrectIdx !== undefined;

  function stateFor(i: 0 | 1 | 2 | 3): AnswerState {
    if (hiddenIndexes?.includes(i)) return "hidden";
    if (isRevealed) {
      if (i === revealedCorrectIdx) return "correct";
      if (i === selectedIdx && !myChoiceWasCorrect) return "wrong";
      return "locked";
    }
    if (selectedIdx === i) return "selected";
    if (selectedIdx !== null) return "locked";
    return "idle";
  }

  return (
    <div className="w-full max-w-3xl">
      <div className="text-center mb-8">
        <p className="text-white/40 text-xs uppercase tracking-widest mb-2">
          Question {round} / {totalRounds}
        </p>
        <p className="text-gold/80 text-xs uppercase tracking-wider">
          {question.category}
        </p>
      </div>
      <AnimatePresence mode="wait">
        <motion.div
          key={question.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.5 }}
          className="surface-elevated rounded-3xl p-8 mb-6"
        >
          <h2 className="text-display text-2xl md:text-3xl font-semibold text-center leading-snug">
            {question.text}
          </h2>
          {phoneFriendGuess !== undefined && (
            <p className="text-center text-gold/80 text-sm mt-4 italic">
              📞 « Je dirais la réponse {(["A", "B", "C", "D"] as const)[phoneFriendGuess]} »
            </p>
          )}
        </motion.div>
      </AnimatePresence>

      <div className="grid md:grid-cols-2 gap-3">
        {question.answers.map((a, i) => (
          <div key={i} className="relative">
            <AnswerButton
              index={i as 0 | 1 | 2 | 3}
              text={a}
              state={stateFor(i as 0 | 1 | 2 | 3)}
              onClick={() => onSelect(i as 0 | 1 | 2 | 3)}
            />
            {publicVote && (
              <div className="absolute -top-2 -right-2 px-2 py-0.5 rounded-full bg-gold text-bg-deep text-xs font-bold shadow-lg">
                {publicVote[i]}%
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
