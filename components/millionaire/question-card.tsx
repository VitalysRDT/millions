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
          className="relative mb-8 md:mb-10"
        >
          {/* Outer glow */}
          <div className="absolute -inset-1 rounded-[28px] bg-gold-gradient opacity-20 blur-xl" />
          {/* Card */}
          <div className="relative border-gold-gradient-thick rounded-[28px] card-spot p-10 md:p-14 shadow-deep">
            <h2 className="text-display text-3xl md:text-5xl font-semibold text-center leading-[1.15] text-white">
              {question.text}
            </h2>
            {phoneFriendGuess !== undefined && (
              <motion.p
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 text-center text-gold/85 text-base italic flex items-center justify-center gap-2"
              >
                <Phone className="w-4 h-4" />
                « Je dirais la réponse {(["A", "B", "C", "D"] as const)[phoneFriendGuess]}, sans hésiter. »
              </motion.p>
            )}
          </div>
        </motion.div>
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
        {question.answers.map((a, i) => {
          const shape: "left" | "right" = i % 2 === 0 ? "left" : "right";
          return (
            <div key={i} className="relative">
              <AnswerButton
                index={i as 0 | 1 | 2 | 3}
                text={a}
                state={stateFor(i as 0 | 1 | 2 | 3)}
                shape={shape}
                onClick={() => onSelect(i as 0 | 1 | 2 | 3)}
              />
              {publicVote && (
                <div className="absolute -top-3 -right-3 px-3 py-1 rounded-full bg-gold-gradient text-bg-deep text-sm font-bold shadow-gold z-10">
                  {publicVote[i]}%
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
