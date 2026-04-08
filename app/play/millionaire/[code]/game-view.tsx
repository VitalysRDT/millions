"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import type { LobbyState } from "@/lib/games/shared/types";
import { TimerRing } from "@/components/millionaire/timer-ring";
import { QuestionCard } from "@/components/millionaire/question-card";
import { JokersBar } from "@/components/millionaire/jokers-bar";
import { PrizeLadder } from "@/components/millionaire/prize-ladder";
import { PlayerStrip } from "@/components/millionaire/player-strip";
import { RevealOverlay } from "@/components/millionaire/reveal-overlay";
import { postJson } from "@/lib/utils/fetcher";
import { nanoid } from "nanoid";
import type { Joker } from "@/lib/games/millionaire/constants";

export function GameView({
  state,
  myUserId,
}: {
  state: LobbyState;
  myUserId: string;
}) {
  const m = state.millionaire!;
  const me = m.playerStates.find((p) => p.userId === myUserId);
  const [pendingChoice, setPendingChoice] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [ladderOpen, setLadderOpen] = useState(false);
  const idemRef = useRef<string>(nanoid());
  const lastRoundRef = useRef<number>(m.round);

  useEffect(() => {
    if (lastRoundRef.current !== m.round) {
      lastRoundRef.current = m.round;
      idemRef.current = nanoid();
      setPendingChoice(null);
      setSubmitting(false);
    }
  }, [m.round]);

  useEffect(() => {
    const id = setInterval(() => {
      postJson(`/api/millionaire/${state.code}/tick`, {}).catch(() => undefined);
    }, 2000);
    return () => clearInterval(id);
  }, [state.code]);

  const select = async (i: 0 | 1 | 2 | 3) => {
    if (submitting || pendingChoice !== null || !me?.alive) return;
    setPendingChoice(i);
    setSubmitting(true);
    try {
      await postJson(`/api/millionaire/${state.code}/answer`, {
        round: m.round,
        chosenIndex: i,
        clientIdemKey: idemRef.current,
      });
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  const useJoker = async (j: Joker) => {
    try {
      await postJson(`/api/millionaire/${state.code}/joker`, { joker: j });
    } catch (e) {
      console.error(e);
    }
  };

  const myReveal = m.lastReveal?.perPlayer.find((p) => p.userId === myUserId);
  const isRevealing = m.roundState === "revealing";
  const question = me?.overrideQuestion ?? m.question;

  return (
    <div className="stage-bg min-h-[calc(100vh-4rem)]">
      <RevealOverlay state={state} myUserId={myUserId} />

      {/* MOBILE: floating ladder toggle (top-right) */}
      <button
        onClick={() => setLadderOpen(!ladderOpen)}
        className="xl:hidden fixed top-20 right-3 z-30 px-3 py-1.5 rounded-full bg-gold/15 border border-gold/40 text-gold text-xs font-bold uppercase tracking-wider backdrop-blur-md"
      >
        {ladderOpen ? "Fermer" : "Gains"}
      </button>

      {/* MOBILE: ladder slide-over */}
      {ladderOpen && (
        <div
          onClick={() => setLadderOpen(false)}
          className="xl:hidden fixed inset-0 z-20 bg-bg-deep/70 backdrop-blur-sm flex items-start justify-end p-4 pt-16"
        >
          <div onClick={(e) => e.stopPropagation()} className="w-72 max-w-full">
            <PrizeLadder currentTier={me?.currentTier ?? 0} />
          </div>
        </div>
      )}

      <div className="max-w-[1500px] mx-auto px-3 sm:px-5 md:px-8 py-4 sm:py-6 md:py-10 grid grid-cols-1 xl:grid-cols-[1fr_300px] gap-6 sm:gap-8 xl:gap-10">
        {/* MAIN COLUMN */}
        <div className="flex flex-col gap-5 sm:gap-7 md:gap-10 items-center min-w-0">
          {/* HEADER ZONE */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full flex flex-row items-center justify-between sm:justify-center gap-3 sm:gap-8 md:gap-12"
          >
            <div className="text-left sm:text-right flex-shrink-0">
              <p className="text-[9px] sm:text-[10px] uppercase tracking-[0.25em] sm:tracking-[0.3em] text-white/40 mb-0.5 sm:mb-1">
                Round
              </p>
              <p className="text-display text-2xl sm:text-4xl md:text-5xl font-bold text-gold-gradient leading-none">
                {m.round.toString().padStart(2, "0")}
                <span className="text-white/30 text-sm sm:text-xl md:text-2xl ml-1">/15</span>
              </p>
            </div>

            {!isRevealing ? (
              <TimerRing deadlineAt={m.deadlineAt} />
            ) : (
              <div className="w-24 h-24 sm:w-32 sm:h-32 md:w-36 md:h-36 flex-shrink-0" />
            )}

            <div className="text-right sm:text-left flex-shrink min-w-0">
              <p className="text-[9px] sm:text-[10px] uppercase tracking-[0.25em] sm:tracking-[0.3em] text-white/40 mb-0.5 sm:mb-1">
                Catégorie
              </p>
              <p className="text-display text-base sm:text-2xl md:text-3xl font-semibold text-white capitalize truncate max-w-[120px] sm:max-w-none">
                {question.category.replace(/_/g, " ")}
              </p>
            </div>
          </motion.div>

          {/* QUESTION + ANSWERS */}
          <QuestionCard
            question={question}
            round={m.round}
            totalRounds={15}
            selectedIdx={isRevealing ? (myReveal?.chosenIndex ?? null) : pendingChoice}
            hiddenIndexes={me?.fiftyHidden}
            revealedCorrectIdx={isRevealing ? m.lastReveal?.correctIndex : undefined}
            myChoiceWasCorrect={myReveal?.correct}
            onSelect={select}
            publicVote={me?.publicVote}
            phoneFriendGuess={me?.phoneFriend?.guess}
          />

          {/* JOKERS */}
          {me?.alive && !isRevealing && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="w-full flex justify-center"
            >
              <JokersBar
                remaining={me.jokersRemaining}
                onUse={useJoker}
                disabled={pendingChoice !== null}
              />
            </motion.div>
          )}

          {!me?.alive && (
            <p className="text-center text-danger/80 text-sm italic px-4">
              Tu es éliminé. Tu peux observer la suite.
            </p>
          )}

          {/* PLAYER STRIP */}
          <PlayerStrip state={state} myUserId={myUserId} />
        </div>

        {/* PRIZE LADDER SIDEBAR (desktop only) */}
        <div className="hidden xl:block xl:sticky xl:top-24 self-start">
          <PrizeLadder currentTier={me?.currentTier ?? 0} />
        </div>
      </div>
    </div>
  );
}
