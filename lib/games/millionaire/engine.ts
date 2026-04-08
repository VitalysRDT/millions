import { redis } from "@/lib/redis/client";
import { k } from "@/lib/redis/keys";
import { applyLobbyMutation } from "@/lib/redis/lobby-state";
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
 * The chosen index is stored in a PRIVATE per-player Redis key — never in the public lobby JSON.
 */
export async function recordAnswer(opts: AnswerOptions): Promise<{ accepted: boolean }> {
  let gameId: string | null = null;
  await applyLobbyMutation(opts.code, (state) => {
    const m = state.millionaire;
    if (!m) throw new Error("no_game");
    if (m.round !== opts.round) throw new Error("stale_round");
    if (m.roundState !== "answering") throw new Error("not_answering");
    if (Date.now() > m.deadlineAt + 500) throw new Error("deadline_passed");
    const ps = m.playerStates.find((p) => p.userId === opts.userId);
    if (!ps) throw new Error("not_in_game");
    if (!ps.alive) throw new Error("eliminated");
    if (ps.hasAnswered) return state;
    ps.hasAnswered = true;
    gameId = m.gameId;
    return state;
  });

  if (gameId) {
    await redis().set(
      k.gamePlayerAnswer(gameId, opts.round, opts.userId),
      String(opts.chosenIndex),
      { ex: 3600 },
    );
  }
  await maybeResolveRound(opts.code).catch(() => undefined);
  return { accepted: true };
}

/**
 * If all alive players answered OR deadline passed, transition to revealing.
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
    const correctRaw = await r.get<string | number>(k.gameCorrect(m.gameId, m.round));
    const correctIdx = Number(correctRaw);

    // Fetch every alive player's stored answer
    const chosenByUser = new Map<string, number | null>();
    await Promise.all(
      m.playerStates.map(async (p) => {
        if (!p.alive) {
          chosenByUser.set(p.userId, null);
          return;
        }
        const v = await r.get<string | number>(
          k.gamePlayerAnswer(m.gameId, m.round, p.userId),
        );
        chosenByUser.set(p.userId, v == null ? null : Number(v));
      }),
    );

    const perPlayer = m.playerStates.map((p) => {
      const chosen = chosenByUser.get(p.userId) ?? null;
      const correct = chosen !== null && chosen === correctIdx;
      return { userId: p.userId, chosenIndex: chosen, correct };
    });

    m.playerStates.forEach((p) => {
      if (!p.alive) return;
      const chosen = chosenByUser.get(p.userId);
      const correct = chosen !== null && chosen !== undefined && chosen === correctIdx;
      if (correct) {
        p.currentTier = m.round;
      } else {
        p.alive = false;
        p.finalPrizeEur = safetyPrizeForTier(p.currentTier);
      }
      p.hasAnswered = false;
      delete p.fiftyHidden;
      delete p.publicVote;
      delete p.phoneFriend;
    });

    m.lastReveal = { round: m.round, correctIndex: correctIdx, perPlayer };
    m.roundState = "revealing";
    m.revealReleaseAt = Date.now() + REVEAL_DURATION_MS;
    advanced = true;
    return state;
  });
  return { advanced };
}

/** When the reveal duration is over, advance to next round (or finish). */
export async function maybeAdvanceAfterReveal(code: string): Promise<{ advanced: boolean }> {
  let advanced = false;
  let pickedNext: RawQ | null = null;
  // We need to pick a question outside the lock to keep critical section short.
  // First peek at state to know what we'll need.
  const peek = await applyLobbyMutation(code, (state) => state);
  const peekM = peek.millionaire;
  if (peekM && peekM.roundState === "revealing" && peekM.revealReleaseAt && Date.now() >= peekM.revealReleaseAt) {
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
        const finals = m.playerStates.map((p) => ({
          userId: p.userId,
          tier: p.currentTier,
          prize: p.alive
            ? TIERS_EUR[p.currentTier - 1] ?? 0
            : p.finalPrizeEur ?? 0,
          eliminatedAtRound: p.alive ? null : m.round,
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
    const nextRound = m.round + 1;
    const { pub, correctIdx } = await persistRoundQuestion(m.gameId, nextRound, pickedNext);
    void correctIdx;
    m.round = nextRound;
    m.question = pub;
    m.deadlineAt = Date.now() + QUESTION_TIMER_MS;
    m.roundState = "answering";
    m.revealReleaseAt = undefined;
    m.playerStates.forEach((p) => {
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
