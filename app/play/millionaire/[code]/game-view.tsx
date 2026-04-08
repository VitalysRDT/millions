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

      <div className="max-w-[1500px] mx-auto px-4 md:px-8 py-6 md:py-10 grid grid-cols-1 xl:grid-cols-[1fr_300px] gap-8 xl:gap-10">
        {/* MAIN COLUMN */}
        <div className="flex flex-col gap-8 md:gap-10 items-center">
          {/* HEADER ZONE */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full flex flex-col md:flex-row items-center justify-center gap-6 md:gap-12"
          >
            <div className="text-center md:text-right md:order-1 order-2">
              <p className="text-[10px] uppercase tracking-[0.3em] text-white/40 mb-1">
                Round
              </p>
              <p className="text-display text-4xl md:text-5xl font-bold text-gold-gradient leading-none">
                {m.round.toString().padStart(2, "0")}
                <span className="text-white/30 text-xl md:text-2xl ml-1">/15</span>
              </p>
            </div>

            {!isRevealing ? (
              <div className="md:order-2 order-1">
                <TimerRing deadlineAt={m.deadlineAt} />
              </div>
            ) : (
              <div className="md:order-2 order-1 w-36 h-36" />
            )}

            <div className="text-center md:text-left md:order-3 order-3">
              <p className="text-[10px] uppercase tracking-[0.3em] text-white/40 mb-1">
                Catégorie
              </p>
              <p className="text-display text-2xl md:text-3xl font-semibold text-white capitalize">
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
            >
              <JokersBar
                remaining={me.jokersRemaining}
                onUse={useJoker}
                disabled={pendingChoice !== null}
              />
            </motion.div>
          )}

          {!me?.alive && (
            <p className="text-center text-danger/80 text-sm italic">
              Tu es éliminé. Tu peux observer la suite.
            </p>
          )}

          {/* PLAYER STRIP */}
          <PlayerStrip state={state} myUserId={myUserId} />
        </div>

        {/* PRIZE LADDER SIDEBAR */}
        <div className="xl:sticky xl:top-24 self-start order-first xl:order-last w-full max-w-md mx-auto xl:max-w-none">
          <PrizeLadder currentTier={me?.currentTier ?? 0} />
        </div>
      </div>
    </div>
  );
}
