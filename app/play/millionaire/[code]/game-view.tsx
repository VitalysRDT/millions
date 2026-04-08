"use client";

import { useEffect, useRef, useState } from "react";
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

  // Reset local state on round change
  useEffect(() => {
    if (lastRoundRef.current !== m.round) {
      lastRoundRef.current = m.round;
      idemRef.current = nanoid();
      setPendingChoice(null);
      setSubmitting(false);
    }
  }, [m.round]);

  // Periodic tick to ensure deadlines advance even if no one acts
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
    <div className="min-h-[calc(100vh-4rem)] px-6 py-8">
      <RevealOverlay state={state} myUserId={myUserId} />

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-[1fr_240px] gap-8">
        {/* MAIN */}
        <div className="flex flex-col items-center gap-8">
          <div className="flex items-center gap-8">
            {!isRevealing && <TimerRing deadlineAt={m.deadlineAt} />}
          </div>

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

          {me?.alive && !isRevealing && (
            <JokersBar
              remaining={me.jokersRemaining}
              onUse={useJoker}
              disabled={pendingChoice !== null}
            />
          )}

          <PlayerStrip state={state} myUserId={myUserId} />

          {!me?.alive && (
            <p className="text-center text-danger/80 text-sm italic">
              Tu es éliminé. Tu peux observer la suite.
            </p>
          )}
        </div>

        {/* SIDEBAR ladder */}
        <div className="lg:sticky lg:top-20 self-start">
          <PrizeLadder currentTier={me?.currentTier ?? 0} />
        </div>
      </div>
    </div>
  );
}
