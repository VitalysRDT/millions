import { redis } from "@/lib/redis/client";
import { k } from "@/lib/redis/keys";
import {
  applyLobbyMutation,
  getLobbyState,
} from "@/lib/redis/lobby-state";
import {
  difficultyForRound,
  QUESTION_TIMER_MS,
  REVEAL_DURATION_MS,
  TIERS_EUR,
  safetyPrizeForTier,
  ALL_JOKERS,
} from "./constants";
import type {
  LobbyState,
  MillionaireQuestionPublic,
  MillionaireSection,
} from "@/lib/games/shared/types";
import { shuffleIndices } from "@/lib/games/shared/shuffle";
import {
  createMillionaireGame,
  finishMillionaireGame,
  pickQuestionsByDifficulties,
  setLobbyStatus,
  getLobbyByCode,
} from "@/lib/db/queries";

interface RawQ {
  id: number;
  text: string;
  correct: string;
  incorrect1: string;
  incorrect2: string;
  incorrect3: string;
  category: string;
  difficulty: number;
}

function buildPublicQuestion(q: RawQ, order: number[]): {
  pub: MillionaireQuestionPublic;
  correctIdx: number;
} {
  const all = [q.correct, q.incorrect1, q.incorrect2, q.incorrect3];
  const shuffled = order.map((i) => all[i]!) as [string, string, string, string];
  const correctIdx = order.indexOf(0);
  return {
    pub: {
      id: q.id,
      text: q.text,
      answers: shuffled,
      category: q.category,
      difficulty: q.difficulty,
    },
    correctIdx,
  };
}

async function persistRoundQuestion(
  gameId: string,
  round: number,
  picked: RawQ,
): Promise<{ pub: MillionaireQuestionPublic; correctIdx: number }> {
  const order = shuffleIndices(4);
  const { pub, correctIdx } = buildPublicQuestion(picked, order);
  const r = redis();
  await Promise.all([
    r.set(k.gameCorrect(gameId, round), correctIdx, { ex: 3600 }),
    r.set(k.gameOrder(gameId, round), JSON.stringify(order), { ex: 3600 }),
  ]);
  return { pub, correctIdx };
}

/** Bootstrap the millionaire game (DB + Redis state for round 1). */
export async function startMillionaireGame(code: string): Promise<LobbyState> {
  const lobbyRow = await getLobbyByCode(code);
  if (!lobbyRow) throw new Error("lobby_not_found");

  const difficulties = Array.from({ length: 15 }, (_, i) => difficultyForRound(i + 1));
  const picked = await pickQuestionsByDifficulties(difficulties);
  if (picked.length !== 15) throw new Error("not_enough_questions");

  const orders: number[][] = picked.map(() => shuffleIndices(4));

  return applyLobbyMutation(code, async (state) => {
    if (state.status !== "waiting") throw new Error("not_in_waiting");
    if (state.players.length < 2) throw new Error("need_at_least_2");

    const game = await createMillionaireGame({
      lobbyId: lobbyRow.id,
      questionIds: picked.map((q) => q.id),
      answerOrders: orders,
      playerIds: state.players.map((p) => p.userId),
    });

    const { pub, correctIdx } = buildPublicQuestion(picked[0]!, orders[0]!);
    const r = redis();
    await Promise.all([
      r.set(k.gameCorrect(game.id, 1), correctIdx, { ex: 3600 }),
      r.set(k.gameOrder(game.id, 1), JSON.stringify(orders[0]), { ex: 3600 }),
    ]);

    const millionaire: MillionaireSection = {
      gameId: game.id,
      round: 1,
      question: pub,
      deadlineAt: Date.now() + QUESTION_TIMER_MS,
      roundState: "answering",
      playerStates: state.players.map((p) => ({
        userId: p.userId,
        currentTier: 0,
        alive: true,
        hasAnswered: false,
        jokersRemaining: [...ALL_JOKERS],
      })),
    };

    state.status = "playing";
    state.startedAt = Date.now();
    state.millionaire = millionaire;

    await setLobbyStatus(lobbyRow.id, "playing");
    return state;
  });
}

interface AnswerOptions {
  code: string;
  userId: string;
  round: number;
  chosenIndex: number;
}

/**
 * Records a player answer.
 *
 * IMPORTANT (B3 fix): the chosen index is written to Redis INSIDE the lock,
 * BEFORE flipping hasAnswered=true. This guarantees that any subsequent
 * resolver call will find the answer in Redis.
 */
export async function recordAnswer(opts: AnswerOptions): Promise<{ accepted: boolean }> {
  await applyLobbyMutation(opts.code, async (state) => {
    const m = state.millionaire;
    if (!m) throw new Error("no_game");
    if (m.round !== opts.round) throw new Error("stale_round");
    if (m.roundState !== "answering") throw new Error("not_answering");
    if (Date.now() > m.deadlineAt + 500) throw new Error("deadline_passed");
    const ps = m.playerStates.find((p) => p.userId === opts.userId);
    if (!ps) throw new Error("not_in_game");
    if (!ps.alive) throw new Error("eliminated");
    if (ps.hasAnswered) return state;

    // Write the chosen index to Redis BEFORE flipping hasAnswered.
    await redis().set(
      k.gamePlayerAnswer(m.gameId, opts.round, opts.userId),
      String(opts.chosenIndex),
      { ex: 3600 },
    );
    ps.hasAnswered = true;
    return state;
  });

  await maybeResolveRound(opts.code).catch(() => undefined);
  return { accepted: true };
}

/**
 * If all alive players answered OR deadline passed, transition to revealing.
 *
 * (B1 fix) Per-player correct index: players who used the switch joker have
 * their own correct answer in a per-user Redis key. We fetch the right key
 * for each player before comparing.
 *
 * (B17 fix) hasAnswered is NOT reset here — it stays true through the reveal
 * and is only reset when advancing to the next round.
 */
export async function maybeResolveRound(code: string): Promise<{ advanced: boolean }> {
  let advanced = false;
  await applyLobbyMutation(code, async (state) => {
    const m = state.millionaire;
    if (!m) return state;
    if (m.roundState !== "answering") return state;

    const alive = m.playerStates.filter((p) => p.alive);
    const allAnswered = alive.every((p) => p.hasAnswered);
    if (!allAnswered && Date.now() < m.deadlineAt) return state;

    const r = redis();
    const sharedCorrect = Number(
      await r.get<string | number>(k.gameCorrect(m.gameId, m.round)),
    );

    // Fetch every player's chosen index AND their per-player correct.
    const chosenByUser = new Map<string, number | null>();
    const correctByUser = new Map<string, number>();
    await Promise.all(
      m.playerStates.map(async (p) => {
        // Chosen
        if (!p.alive) {
          chosenByUser.set(p.userId, null);
        } else {
          const v = await r.get<string | number>(
            k.gamePlayerAnswer(m.gameId, m.round, p.userId),
          );
          chosenByUser.set(p.userId, v == null ? null : Number(v));
        }
        // Correct index — per-user if player used switch, else shared
        if (p.overrideQuestion) {
          const pv = await r.get<string | number>(
            k.gameCorrectPerUser(m.gameId, m.round, p.userId),
          );
          correctByUser.set(
            p.userId,
            pv == null ? sharedCorrect : Number(pv),
          );
        } else {
          correctByUser.set(p.userId, sharedCorrect);
        }
      }),
    );

    const perPlayer = m.playerStates.map((p) => {
      const chosen = chosenByUser.get(p.userId) ?? null;
      const playerCorrect = correctByUser.get(p.userId) ?? sharedCorrect;
      const correct = chosen !== null && chosen === playerCorrect;
      return {
        userId: p.userId,
        chosenIndex: chosen,
        correct,
        correctIndex: playerCorrect,
      };
    });

    m.playerStates.forEach((p) => {
      if (!p.alive) return;
      const chosen = chosenByUser.get(p.userId);
      const playerCorrect = correctByUser.get(p.userId) ?? sharedCorrect;
      const correct =
        chosen !== null && chosen !== undefined && chosen === playerCorrect;
      if (correct) {
        p.currentTier = m.round;
      } else {
        p.alive = false;
        p.finalPrizeEur = safetyPrizeForTier(p.currentTier);
        p.eliminatedAtRound = m.round;
      }
      // NOTE: hasAnswered stays true during reveal (fixes B17).
      // It gets reset only when advancing to the next round.
    });

    m.lastReveal = {
      round: m.round,
      correctIndex: sharedCorrect,
      perPlayer,
    };
    m.roundState = "revealing";
    m.revealReleaseAt = Date.now() + REVEAL_DURATION_MS;
    advanced = true;
    return state;
  });
  return { advanced };
}

/**
 * When the reveal duration is over, advance to next round (or finish).
 *
 * (B14 fix) Use getLobbyState for the peek — no need for a second lock.
 * (B15 fix) Clean up per-user correct keys when moving to the next round.
 */
export async function maybeAdvanceAfterReveal(code: string): Promise<{ advanced: boolean }> {
  let advanced = false;
  let pickedNext: RawQ | null = null;

  const peek = await getLobbyState(code);
  if (!peek) return { advanced: false };
  const peekM = peek.millionaire;
  if (
    peekM &&
    peekM.roundState === "revealing" &&
    peekM.revealReleaseAt &&
    Date.now() >= peekM.revealReleaseAt
  ) {
    const aliveCount = peekM.playerStates.filter((p) => p.alive).length;
    if (aliveCount > 0 && peekM.round < 15) {
      const nextRound = peekM.round + 1;
      const difficulty = difficultyForRound(nextRound);
      const arr = await pickQuestionsByDifficulties([difficulty]);
      pickedNext = arr[0] ?? null;
    }
  }

  await applyLobbyMutation(code, async (state) => {
    const m = state.millionaire;
    if (!m) return state;
    if (m.roundState !== "revealing") return state;
    if (m.revealReleaseAt && Date.now() < m.revealReleaseAt) return state;

    const aliveCount = m.playerStates.filter((p) => p.alive).length;
    if (aliveCount === 0 || m.round >= 15) {
      // Finalise game
      m.finishedAt = Date.now();
      let winner: string | null = null;
      let bestTier = -1;
      for (const p of m.playerStates) {
        if (p.alive && p.currentTier > bestTier) {
          bestTier = p.currentTier;
          winner = p.userId;
        }
      }
      if (!winner) {
        let maxT = -1;
        for (const p of m.playerStates) {
          if (p.currentTier > maxT) {
            maxT = p.currentTier;
            winner = p.userId;
          }
        }
      }
      m.winnerUserId = winner;
      state.status = "finished";
      state.endedAt = Date.now();

      const lobby = await getLobbyByCode(code);
      if (lobby) {
        // (B8 fix) Use per-player eliminatedAtRound instead of m.round
        const finals = m.playerStates.map((p) => ({
          userId: p.userId,
          tier: p.currentTier,
          prize: p.alive
            ? TIERS_EUR[p.currentTier - 1] ?? 0
            : p.finalPrizeEur ?? 0,
          eliminatedAtRound: p.alive
            ? null
            : p.eliminatedAtRound ?? m.round,
        }));
        await finishMillionaireGame({
          gameId: m.gameId,
          lobbyId: lobby.id,
          winnerUserId: winner,
          finalsByUser: finals,
        });
        await setLobbyStatus(lobby.id, "finished");
      }
      advanced = true;
      return state;
    }

    if (!pickedNext) return state;

    // (B15 fix) Clean up per-user override correct keys from the round we're leaving
    const r = redis();
    const toDel: string[] = [];
    m.playerStates.forEach((p) => {
      if (p.overrideQuestion) {
        toDel.push(k.gameCorrectPerUser(m.gameId, m.round, p.userId));
      }
    });
    if (toDel.length > 0) {
      await r.del(...toDel);
    }

    const nextRound = m.round + 1;
    const { pub, correctIdx } = await persistRoundQuestion(m.gameId, nextRound, pickedNext);
    void correctIdx;
    m.round = nextRound;
    m.question = pub;
    m.deadlineAt = Date.now() + QUESTION_TIMER_MS;
    m.roundState = "answering";
    m.revealReleaseAt = undefined;
    m.playerStates.forEach((p) => {
      // Reset per-round state for all players (including hasAnswered for B17)
      p.hasAnswered = false;
      delete p.overrideQuestion;
      delete p.fiftyHidden;
      delete p.publicVote;
      delete p.phoneFriend;
    });
    advanced = true;
    return state;
  });
  return { advanced };
}

/** Catch-all tick. */
export async function tickMillionaire(code: string): Promise<void> {
  const r1 = await maybeResolveRound(code).catch(() => ({ advanced: false }));
  if (r1.advanced) return;
  await maybeAdvanceAfterReveal(code).catch(() => undefined);
}

/**
 * (B12 support) Mark a player as having forfeited mid-game.
 * Called from the leave route when a player leaves a running millionaire game.
 */
export async function forfeitMillionairePlayer(
  code: string,
  userId: string,
): Promise<void> {
  let shouldFinalize = false;
  await applyLobbyMutation(code, (state) => {
    const m = state.millionaire;
    if (!m) return state;
    if (state.status !== "playing") return state;
    const ps = m.playerStates.find((p) => p.userId === userId);
    if (!ps || !ps.alive) return state;
    ps.alive = false;
    ps.finalPrizeEur = safetyPrizeForTier(ps.currentTier);
    ps.eliminatedAtRound = m.round;
    // If no one is alive anymore, push reveal release to now so the next
    // tick finalizes the game.
    const aliveCount = m.playerStates.filter((p) => p.alive).length;
    if (aliveCount === 0) {
      m.roundState = "revealing";
      m.revealReleaseAt = Date.now();
      shouldFinalize = true;
    }
    return state;
  });
  if (shouldFinalize) {
    await maybeAdvanceAfterReveal(code).catch(() => undefined);
  }
}
