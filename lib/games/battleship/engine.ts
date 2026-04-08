import { redis } from "@/lib/redis/client";
import { k } from "@/lib/redis/keys";
import { applyLobbyMutation } from "@/lib/redis/lobby-state";
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
  patternCellCount,
  QUESTION_TIMER_MS,
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
  // Save to redis (private)
  const peek = await applyLobbyMutation(opts.code, (state) => state);
  const m = peek.battleship;
  if (!m) throw new Error("no_game");
  await saveShips(m.gameId, opts.userId, internal);
  // Persist to DB for audit/recovery
  await saveBattleshipGrid({ gameId: m.gameId, userId: opts.userId, ships: internal });

  return applyLobbyMutation(opts.code, (state) => {
    const bs = state.battleship!;
    bs.placedReady[opts.userId] = true;
    bs.shipsStatus[opts.userId] = { remaining: 5, sunk: [] };
    if (Object.values(bs.placedReady).every(Boolean)) {
      bs.phase = "battle";
      // Random first turn
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
  const correct = Number(correctRaw) === opts.chosenIndex;

  await applyLobbyMutation(opts.code, (state) => {
    const m = state.battleship!;
    m.answeredCorrectly = correct;
    if (!correct) {
      // Pass turn to opponent
      m.questionPhase = "idle";
      m.currentQuestion = undefined;
      m.questionDifficulty = undefined;
      m.deadlineAt = undefined;
      const other = state.players.find((p) => p.userId !== opts.userId);
      m.currentTurnUserId = other?.userId ?? null;
      m.turnNumber++;
    }
    return state;
  });

  return { correct, canShoot: correct };
}

export async function fireShot(opts: {
  code: string;
  userId: string;
  cells: [number, number][];
}): Promise<{
  results: { x: number; y: number; result: "miss" | "hit" | "sunk"; shipSize?: number }[];
  gameOver: boolean;
}> {
  const peek = await applyLobbyMutation(opts.code, (state) => state);
  const bs = peek.battleship;
  if (!bs) throw new Error("no_game");
  if (bs.phase !== "battle") throw new Error("not_in_battle");
  if (bs.currentTurnUserId !== opts.userId) throw new Error("not_your_turn");
  if (!bs.answeredCorrectly) throw new Error("answer_required");
  if (!bs.currentQuestion) throw new Error("no_question");
  const reward = bs.currentQuestion.patternReward;

  validateShotCells(opts.cells, reward);
  const allowed = patternCellCount(reward);
  if (opts.cells.length > allowed) throw new Error("too_many_cells");

  const opponent = peek.players.find((p) => p.userId !== opts.userId);
  if (!opponent) throw new Error("no_opponent");
  const enemyShips = await loadShips(bs.gameId, opponent.userId);
  if (!enemyShips) throw new Error("opponent_grid_missing");

  // Single-cell uses raw cells. Pattern-based: caller may pass single origin
  // and we expand server-side, OR caller passes already-expanded cells.
  // We accept "expanded by client" as long as we re-validate count + bounds.
  const { results, allSunk } = applyShots(enemyShips, opts.cells);
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
      // Turn passes to opponent
      m.questionPhase = "idle";
      m.currentQuestion = undefined;
      m.questionDifficulty = undefined;
      m.deadlineAt = undefined;
      m.answeredCorrectly = undefined;
      m.currentTurnUserId = opponent.userId;
      m.turnNumber++;
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

/** Lazy tick: expire question if deadline passed and pass turn. */
export async function tickBattleship(code: string): Promise<void> {
  await applyLobbyMutation(code, (state) => {
    const bs = state.battleship;
    if (!bs) return state;
    if (bs.phase !== "battle") return state;
    if (bs.questionPhase === "answering" && bs.deadlineAt && Date.now() > bs.deadlineAt) {
      // Forfeit turn
      const other = state.players.find((p) => p.userId !== bs.currentTurnUserId);
      bs.questionPhase = "idle";
      bs.currentQuestion = undefined;
      bs.deadlineAt = undefined;
      bs.questionDifficulty = undefined;
      bs.answeredCorrectly = false;
      bs.currentTurnUserId = other?.userId ?? null;
      bs.turnNumber++;
    }
    return state;
  });
}

// re-export PlacedShip for routes
export type { PlacedShip };
export { expandPattern };
