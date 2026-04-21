"use client";

import { motion, AnimatePresence } from "framer-motion";
import type { MillionaireQuestionPublic } from "@/lib/games/shared/types";
import { AnswerButton, type AnswerState } from "./answer-button";

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
  const letters = ["A", "B", "C", "D"] as const;

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
    <div className="w-full">
      <AnimatePresence mode="wait">
        <motion.div
          key={question.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="surface relative overflow-hidden p-8 sm:p-12 text-center"
        >
          <div
            aria-hidden
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "radial-gradient(600px 200px at 50% -30px, var(--accent-soft), transparent 70%)",
            }}
          />
          <div
            className="display relative max-w-[760px] mx-auto"
            style={{
              fontSize: "clamp(22px, 3.4vw, 30px)",
              lineHeight: 1.3,
              textWrap: "pretty",
            }}
          >
            {question.text}
          </div>
          {phoneFriendGuess !== undefined && (
            <div className="chip accent rise mt-5 inline-flex">
              Ami : « Je dirais {letters[phoneFriendGuess]}. »
            </div>
          )}
          <div
            className="grid grid-cols-1 md:grid-cols-2 gap-3.5 mt-9 max-w-[720px] mx-auto relative"
          >
            {question.answers.map((a, i) => {
              const pct = publicVote?.[i];
              return (
                <div key={i} className="relative">
                  <AnswerButton
                    index={i as 0 | 1 | 2 | 3}
                    text={a}
                    state={stateFor(i as 0 | 1 | 2 | 3)}
                    onClick={() => onSelect(i as 0 | 1 | 2 | 3)}
                  />
                  {pct != null && (
                    <>
                      <span
                        className="mono absolute right-3 top-1/2 -translate-y-1/2 text-xs pointer-events-none"
                        style={{ color: "var(--fg-1)", opacity: 0.8 }}
                      >
                        {pct}%
                      </span>
                      <div
                        className="absolute left-0 bottom-0 h-[3px] pointer-events-none transition-[width] duration-700"
                        style={{
                          width: `${pct}%`,
                          background: "var(--accent)",
                          borderBottomLeftRadius: 12,
                        }}
                      />
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
