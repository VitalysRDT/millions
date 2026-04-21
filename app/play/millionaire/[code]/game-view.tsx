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
  const myRevealedCorrectIdx = isRevealing
    ? (myReveal?.correctIndex ?? m.lastReveal?.correctIndex)
    : undefined;

  return (
    <div className="min-h-[calc(100vh-60px)]">
      <RevealOverlay state={state} myUserId={myUserId} />

      {/* MOBILE: floating ladder toggle (top-right) */}
      <button
        onClick={() => setLadderOpen(!ladderOpen)}
        className="xl:hidden fixed top-16 right-3 z-30 chip accent"
      >
        {ladderOpen ? "Fermer" : "Gains"}
      </button>

      {/* MOBILE: ladder slide-over */}
      {ladderOpen && (
        <div
          onClick={() => setLadderOpen(false)}
          className="xl:hidden fixed inset-0 z-20 flex items-start justify-end p-4 pt-16"
          style={{
            background: "oklch(10% 0.02 280 / 0.7)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
          }}
        >
          <div onClick={(e) => e.stopPropagation()} className="w-72 max-w-full">
            <PrizeLadder currentTier={me?.currentTier ?? 0} />
          </div>
        </div>
      )}

      <div className="screen max-w-[1360px] mx-auto px-5 sm:px-7 py-7 pb-20">
        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_320px] gap-7">
          {/* MAIN COLUMN */}
          <div className="flex flex-col gap-7 min-w-0">
            {/* HEADER */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-between gap-4 sm:gap-8 py-2"
            >
              <div>
                <div className="eyebrow mb-1">Round</div>
                <div
                  className="display shine leading-none"
                  style={{ fontSize: "clamp(36px, 6vw, 56px)" }}
                >
                  {String(m.round).padStart(2, "0")}
                  <span
                    className="ml-1"
                    style={{ color: "var(--fg-3)", fontSize: "0.45em" }}
                  >
                    /15
                  </span>
                </div>
              </div>

              {!isRevealing ? (
                <TimerRing deadlineAt={m.deadlineAt} />
              ) : (
                <div style={{ width: 140, height: 140, flexShrink: 0 }} />
              )}

              <div className="text-right">
                <div className="eyebrow mb-1">Catégorie</div>
                <div
                  className="display capitalize"
                  style={{
                    fontSize: "clamp(20px, 3vw, 30px)",
                    lineHeight: 1,
                  }}
                >
                  {question.category.replace(/_/g, " ")}
                </div>
              </div>
            </motion.div>

            {/* QUESTION */}
            <QuestionCard
              question={question}
              round={m.round}
              totalRounds={15}
              selectedIdx={isRevealing ? (myReveal?.chosenIndex ?? null) : pendingChoice}
              hiddenIndexes={me?.fiftyHidden}
              revealedCorrectIdx={myRevealedCorrectIdx}
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
                transition={{ delay: 0.15 }}
                className="flex justify-center"
              >
                <JokersBar
                  remaining={me.jokersRemaining}
                  onUse={useJoker}
                  disabled={pendingChoice !== null}
                />
              </motion.div>
            )}

            {!me?.alive && (
              <p
                className="text-center italic px-4 text-sm"
                style={{ color: "var(--bad)" }}
              >
                Tu es éliminé. Tu peux observer la suite.
              </p>
            )}

            {/* PLAYER STRIP */}
            <PlayerStrip state={state} myUserId={myUserId} />
          </div>

          {/* PRIZE LADDER (desktop) */}
          <div className="hidden xl:block">
            <PrizeLadder currentTier={me?.currentTier ?? 0} />
          </div>
        </div>
      </div>
    </div>
  );
}

