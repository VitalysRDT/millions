import { redis } from "@/lib/redis/client";
import { k } from "@/lib/redis/keys";
import { applyLobbyMutation, getLobbyState } from "@/lib/redis/lobby-state";
import {
  createBattleshipGame,
  finishBattleshipGame,
  getLobbyByCode,
  pickRandomQuestions,
  saveBattleshipGrid,
  setLobbyStatus,
} from "@/lib/db/queries";
import { shuffleIndices } from "@/lib/games/shared/shuffle";
import {
  patternForDifficulty,
  QUESTION_TIMER_MS,
  REVEAL_TIMER_MS,
  SHOT_REVEAL_MS,
  type Rotation,
  type ShotPattern,
} from "./constants";
import {
  validateFleetPlacement,
  type PlacedShip,
} from "./placement-validator";
import {
  applyShots,
  expandPattern,
  shipsRemainingCount,
  sunkSizes,
  validateShotCells,
  type InternalShipState,
} from "./shot-resolver";
import type {
  BattleshipQuestionPublic,
  BattleshipSection,
  LobbyState,
} from "@/lib/games/shared/types";

const SHIPS_KEY = (gameId: string, userId: string) => `bs:${gameId}:ships:${userId}`;

async function loadShips(gameId: string, userId: string): Promise<InternalShipState[] | null> {
  const r = redis();
  const raw = await r.get<InternalShipState[]>(SHIPS_KEY(gameId, userId));
  return raw ?? null;
}

async function saveShips(gameId: string, userId: string, ships: InternalShipState[]) {
  const r = redis();
  await r.set(SHIPS_KEY(gameId, userId), ships, { ex: 3600 });
}

export async function startBattleshipGame(code: string): Promise<LobbyState> {
  const lobby = await getLobbyByCode(code);
  if (!lobby) throw new Error("lobby_not_found");

  const game = await createBattleshipGame(lobby.id);

  return applyLobbyMutation(code, async (state) => {
    if (state.players.length !== 2) throw new Error("need_exactly_2");
    state.status = "playing";
    state.startedAt = Date.now();
    const section: BattleshipSection = {
      gameId: game.id,
      phase: "placement",
      turnNumber: 0,
      currentTurnUserId: null,
      placedReady: { [state.players[0]!.userId]: false, [state.players[1]!.userId]: false },
      questionPhase: "idle",
      shipsStatus: {},
      publicGrids: {
        [state.players[0]!.userId]: [],
        [state.players[1]!.userId]: [],
      },
    };
    state.battleship = section;
    await setLobbyStatus(lobby.id, "playing");
    return state;
  });
}

export async function placeFleet(opts: {
  code: string;
  userId: string;
  ships: PlacedShip[];
}): Promise<LobbyState> {
  validateFleetPlacement(opts.ships);
  const internal: InternalShipState[] = opts.ships.map((s) => ({
    size: s.size,
    cells: s.cells,
    hits: [],
  }));
  // Peek to validate phase + membership before any writes
  const peek = await getLobbyState(opts.code);
  if (!peek) throw new Error("lobby_not_found");
  const m = peek.battleship;
  if (!m) throw new Error("no_game");
  // (B10 fix) Must be a lobby member
  if (!peek.players.find((p) => p.userId === opts.userId))
    throw new Error("not_in_lobby");
  // (B9 fix) Must be in placement phase
  if (m.phase !== "placement") throw new Error("not_in_placement");

  // Save to redis (private) + DB
  await saveShips(m.gameId, opts.userId, internal);
  await saveBattleshipGrid({ gameId: m.gameId, userId: opts.userId, ships: internal });

  return applyLobbyMutation(opts.code, (state) => {
    const bs = state.battleship!;
    if (bs.phase !== "placement") return state;
    bs.placedReady[opts.userId] = true;
    bs.shipsStatus[opts.userId] = { remaining: 5, sunk: [] };
    if (Object.values(bs.placedReady).every(Boolean)) {
      bs.phase = "battle";
      const ids = state.players.map((p) => p.userId);
      bs.currentTurnUserId = ids[Math.floor(Math.random() * ids.length)] ?? null;
      bs.turnNumber = 1;
    }
    return state;
  });
}

export async function requestBattleshipQuestion(opts: {
  code: string;
  userId: string;
  difficulty: number;
}): Promise<{ question: BattleshipQuestionPublic; deadlineAt: number; reward: ShotPattern }> {
  const peek = await applyLobbyMutation(opts.code, (state) => state);
  const bs = peek.battleship;
  if (!bs) throw new Error("no_game");
  if (bs.phase !== "battle") throw new Error("not_in_battle");
  if (bs.currentTurnUserId !== opts.userId) throw new Error("not_your_turn");
  if (bs.questionPhase !== "idle") throw new Error("question_already_active");

  const arr = await pickRandomQuestions(opts.difficulty, 1);
  const q = arr[0];
  if (!q) throw new Error("no_question_available");

  const order = shuffleIndices(4);
  const all = [q.correct, q.incorrect1, q.incorrect2, q.incorrect3];
  const shuffled = order.map((i) => all[i]!) as [string, string, string, string];
  const correctIdx = order.indexOf(0);
  const reward = patternForDifficulty(opts.difficulty);

  const r = redis();
  await r.set(k.gameBattleshipCorrect(bs.gameId, bs.turnNumber), correctIdx, { ex: 3600 });

  const deadlineAt = Date.now() + QUESTION_TIMER_MS;

  await applyLobbyMutation(opts.code, (state) => {
    const m = state.battleship!;
    m.questionPhase = "answering";
    m.questionDifficulty = opts.difficulty;
    m.deadlineAt = deadlineAt;
    m.currentQuestion = {
      id: q.id,
      text: q.text,
      answers: shuffled,
      category: q.category,
      difficulty: q.difficulty,
      patternReward: reward,
    };
    m.answeredCorrectly = undefined;
    return state;
  });

  return {
    question: {
      id: q.id,
      text: q.text,
      answers: shuffled,
      category: q.category,
      difficulty: q.difficulty,
      patternReward: reward,
    },
    deadlineAt,
    reward,
  };
}

export async function answerBattleshipQuestion(opts: {
  code: string;
  userId: string;
  chosenIndex: number;
}): Promise<{ correct: boolean; canShoot: boolean }> {
  const peek = await applyLobbyMutation(opts.code, (state) => state);
  const bs = peek.battleship;
  if (!bs) throw new Error("no_game");
  if (bs.questionPhase !== "answering") throw new Error("not_answering");
  if (bs.currentTurnUserId !== opts.userId) throw new Error("not_your_turn");
  if (bs.deadlineAt && Date.now() > bs.deadlineAt + 500)
    throw new Error("deadline_passed");

  const r = redis();
  const correctRaw = await r.get<string | number>(k.gameBattleshipCorrect(bs.gameId, bs.turnNumber));
  const correctIndex = Number(correctRaw);
  const correct = correctIndex === opts.chosenIndex;

  await applyLobbyMutation(opts.code, (state) => {
    const m = state.battleship!;
    m.answeredCorrectly = correct;
    m.revealedCorrectIndex = correctIndex;
    m.revealedChosenIndex = opts.chosenIndex;
    if (correct) {
      // Move to "shooting" phase — no deadline, the player takes as much time
      // as they want to pick a target cell. Turn stays with this user until
      // they fire (or leave).
      m.questionPhase = "shooting";
      m.deadlineAt = undefined;
    } else {
      // Wrong answer: reveal the correct one for REVEAL_TIMER_MS, then the tick
      // passes the turn to the opponent.
      m.questionPhase = "revealing";
      m.deadlineAt = Date.now() + REVEAL_TIMER_MS;
    }
    return state;
  });

  return { correct, canShoot: correct };
}

/**
 * Fire a shot. (B4 fix) The client now sends only an ORIGIN cell, and the
 * server expands it into the actual cells based on the reward pattern. This
 * prevents a malicious client from firing arbitrary cells.
 */
export async function fireShot(opts: {
  code: string;
  userId: string;
  origin: [number, number];
  rotation?: Rotation;
}): Promise<{
  results: { x: number; y: number; result: "miss" | "hit" | "sunk"; shipSize?: number }[];
  gameOver: boolean;
}> {
  const peek = await getLobbyState(opts.code);
  if (!peek) throw new Error("lobby_not_found");
  const bs = peek.battleship;
  if (!bs) throw new Error("no_game");
  if (bs.phase !== "battle") throw new Error("not_in_battle");
  if (bs.currentTurnUserId !== opts.userId) throw new Error("not_your_turn");
  if (bs.questionPhase !== "shooting") throw new Error("not_in_shooting_phase");
  if (!bs.currentQuestion) throw new Error("no_question");
  const reward = bs.currentQuestion.patternReward;

  // Server-side expansion — client cannot cheat by crafting arbitrary cells.
  // Rotation is the only freedom the client gets, and only for non-symmetric
  // patterns (line2/line3/tShape). For symmetric patterns it's a no-op.
  const rotation: Rotation = opts.rotation ?? 0;
  const cells = expandPattern(opts.origin, reward, rotation);
  validateShotCells(cells, reward);

  const opponent = peek.players.find((p) => p.userId !== opts.userId);
  if (!opponent) throw new Error("no_opponent");
  const enemyShips = await loadShips(bs.gameId, opponent.userId);
  if (!enemyShips) throw new Error("opponent_grid_missing");

  const { results, allSunk } = applyShots(enemyShips, cells);
  await saveShips(bs.gameId, opponent.userId, enemyShips);

  let gameOver = false;
  await applyLobbyMutation(opts.code, (state) => {
    const m = state.battleship!;
    // Update opponent's public grid (visible to attacker)
    const grid = m.publicGrids[opponent.userId] ?? [];
    for (const r of results) {
      grid.push({ x: r.x, y: r.y, result: r.result, shipSize: r.shipSize });
    }
    m.publicGrids[opponent.userId] = grid;
    m.shipsStatus[opponent.userId] = {
      remaining: shipsRemainingCount(enemyShips),
      sunk: sunkSizes(enemyShips),
    };
    m.lastShot = {
      shooterUserId: opts.userId,
      cells: results,
      sunk: results.some((r) => r.result === "sunk"),
      gameOver: allSunk,
    };
    if (allSunk) {
      m.phase = "finished";
      m.winnerUserId = opts.userId;
      gameOver = true;
      state.status = "finished";
      state.endedAt = Date.now();
    } else {
      // Stay on the shooter's turn for SHOT_REVEAL_MS so they can see the
      // impact, then tickBattleship passes the turn to the opponent.
      m.questionPhase = "shot_resolved";
      m.deadlineAt = Date.now() + SHOT_REVEAL_MS;
      m.answeredCorrectly = undefined;
      m.revealedCorrectIndex = undefined;
      m.revealedChosenIndex = undefined;
      // Keep m.currentQuestion & questionDifficulty around so the UI can
      // show what was fired; cleared on phase exit by tickBattleship.
    }
    return state;
  });

  if (gameOver) {
    const lobby = await getLobbyByCode(opts.code);
    if (lobby) {
      await finishBattleshipGame({
        gameId: bs.gameId,
        lobbyId: lobby.id,
        winnerUserId: opts.userId,
        loserUserId: opponent.userId,
        turns: bs.turnNumber,
      });
      await setLobbyStatus(lobby.id, "finished");
    }
  }

  return { results, gameOver };
}

/** Lazy tick: advance question phases when their deadlines expire. */
export async function tickBattleship(code: string): Promise<void> {
  // We need access to the per-turn correct answer to transition
  // answering → revealing on timeout. Read it before the mutation.
  let pendingCorrectIndex: number | null = null;
  const pre = await getLobbyState(code);
  const preBs = pre?.battleship;
  if (
    preBs &&
    preBs.phase === "battle" &&
    preBs.questionPhase === "answering" &&
    preBs.deadlineAt &&
    Date.now() > preBs.deadlineAt
  ) {
    try {
      const raw = await redis().get<string | number>(
        k.gameBattleshipCorrect(preBs.gameId, preBs.turnNumber),
      );
      pendingCorrectIndex = Number(raw);
    } catch {
      pendingCorrectIndex = null;
    }
  }

  await applyLobbyMutation(code, (state) => {
    const bs = state.battleship;
    if (!bs) return state;
    if (bs.phase !== "battle") return state;
    const now = Date.now();

    if (bs.questionPhase === "answering" && bs.deadlineAt && now > bs.deadlineAt) {
      // Timeout without an answer: show the correct answer for REVEAL_TIMER_MS
      // then pass the turn.
      bs.questionPhase = "revealing";
      bs.answeredCorrectly = false;
      bs.revealedCorrectIndex =
        pendingCorrectIndex !== null && Number.isInteger(pendingCorrectIndex)
          ? pendingCorrectIndex
          : undefined;
      bs.revealedChosenIndex = undefined;
      bs.deadlineAt = now + REVEAL_TIMER_MS;
      return state;
    }

    if (bs.questionPhase === "revealing" && bs.deadlineAt && now > bs.deadlineAt) {
      // End of reveal: turn passes to opponent.
      const other = state.players.find((p) => p.userId !== bs.currentTurnUserId);
      bs.questionPhase = "idle";
      bs.currentQuestion = undefined;
      bs.deadlineAt = undefined;
      bs.questionDifficulty = undefined;
      bs.answeredCorrectly = undefined;
      bs.revealedCorrectIndex = undefined;
      bs.revealedChosenIndex = undefined;
      bs.currentTurnUserId = other?.userId ?? null;
      bs.turnNumber++;
      return state;
    }

    if (bs.questionPhase === "shot_resolved" && bs.deadlineAt && now > bs.deadlineAt) {
      // Shot result has been shown long enough; pass the turn now.
      const other = state.players.find((p) => p.userId !== bs.currentTurnUserId);
      bs.questionPhase = "idle";
      bs.currentQuestion = undefined;
      bs.deadlineAt = undefined;
      bs.questionDifficulty = undefined;
      bs.answeredCorrectly = undefined;
      bs.revealedCorrectIndex = undefined;
      bs.revealedChosenIndex = undefined;
      bs.currentTurnUserId = other?.userId ?? null;
      bs.turnNumber++;
      return state;
    }

    // "shooting" phase has no deadline — the player takes as long as needed.

    return state;
  });
}

// re-export PlacedShip for routes
export type { PlacedShip };
export { expandPattern };

/**
 * (B12 support) When a player leaves a running battleship game, the other
 * player wins by forfeit. Finalises the DB game row and lobby status.
 */
export async function forfeitBattleship(
  code: string,
  leavingUserId: string,
): Promise<void> {
  let opponentUserId: string | null = null;
  let gameId: string | null = null;
  let turnCount = 0;

  await applyLobbyMutation(code, (state) => {
    const bs = state.battleship;
    if (!bs) return state;
    if (state.status !== "playing") return state;
    const opponent = state.players.find((p) => p.userId !== leavingUserId);
    if (!opponent) return state;
    opponentUserId = opponent.userId;
    gameId = bs.gameId;
    turnCount = bs.turnNumber;
    bs.phase = "finished";
    bs.winnerUserId = opponent.userId;
    bs.currentTurnUserId = null;
    bs.questionPhase = "idle";
    bs.currentQuestion = undefined;
    bs.deadlineAt = undefined;
    state.status = "finished";
    state.endedAt = Date.now();
    return state;
  });

  if (opponentUserId && gameId) {
    const lobby = await getLobbyByCode(code);
    if (lobby) {
      await finishBattleshipGame({
        gameId,
        lobbyId: lobby.id,
        winnerUserId: opponentUserId,
        loserUserId: leavingUserId,
        turns: turnCount,
      });
      await setLobbyStatus(lobby.id, "finished");
    }
  }
}

/** Exposed for the /my-ships endpoint (B5). */
export async function getPlayerShips(
  gameId: string,
  userId: string,
): Promise<InternalShipState[] | null> {
  return loadShips(gameId, userId);
}
