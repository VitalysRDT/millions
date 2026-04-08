"use client";

import { motion, AnimatePresence } from "framer-motion";
import type { MillionaireQuestionPublic } from "@/lib/games/shared/types";
import { AnswerButton, type AnswerState } from "./answer-button";
import { Phone } from "lucide-react";

export function QuestionCard({
  question,
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
    <div className="w-full max-w-5xl mx-auto">
      <AnimatePresence mode="wait">
        <motion.div
          key={question.id}
          initial={{ opacity: 0, y: 30, scale: 0.97, filter: "blur(8px)" }}
          animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
          exit={{ opacity: 0, y: -20, scale: 0.97, filter: "blur(8px)" }}
          transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
          className="relative mb-5 sm:mb-7 md:mb-10"
        >
          <div className="absolute -inset-1 rounded-[20px] sm:rounded-[28px] bg-gold-gradient opacity-20 blur-xl" />
          <div className="relative border-gold-gradient-thick rounded-[20px] sm:rounded-[28px] card-spot p-5 sm:p-8 md:p-12 lg:p-14 shadow-deep">
            <h2 className="text-display text-xl sm:text-3xl md:text-4xl lg:text-5xl font-semibold text-center leading-[1.15] text-white">
              {question.text}
            </h2>
            {phoneFriendGuess !== undefined && (
              <motion.p
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 sm:mt-6 text-center text-gold/85 text-sm sm:text-base italic flex items-center justify-center gap-2 px-2"
              >
                <Phone className="w-4 h-4 flex-shrink-0" />
                <span>« Je dirais la réponse {(["A", "B", "C", "D"] as const)[phoneFriendGuess]}. »</span>
              </motion.p>
            )}
          </div>
        </motion.div>
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 md:gap-5">
        {question.answers.map((a, i) => (
          <div key={i} className="relative">
            <AnswerButton
              index={i as 0 | 1 | 2 | 3}
              text={a}
              state={stateFor(i as 0 | 1 | 2 | 3)}
              onClick={() => onSelect(i as 0 | 1 | 2 | 3)}
            />
            {publicVote && (
              <div className="absolute -top-2 -right-2 sm:-top-3 sm:-right-3 px-2 py-0.5 sm:px-3 sm:py-1 rounded-full bg-gold-gradient text-bg-deep text-xs sm:text-sm font-bold shadow-gold z-10">
                {publicVote[i]}%
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
