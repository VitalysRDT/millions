import { db } from "./index";
import {
  users,
  lobbies,
  lobbyPlayers,
  millionaireGames,
  millionairePlayerState,
  battleshipGames,
  battleshipGrids,
  gameHistory,
  questions,
} from "./schema";
import { and, eq, sql, inArray, desc } from "drizzle-orm";

// USERS ----------------------------------------------------------
export async function findOrCreateUser(pseudo: string) {
  const lower = pseudo.toLowerCase();
  const existing = await db.select().from(users).where(eq(users.pseudoLower, lower)).limit(1);
  if (existing[0]) {
    await db
      .update(users)
      .set({ lastSeenAt: new Date() })
      .where(eq(users.id, existing[0].id));
    return existing[0];
  }
  const seed = randomSeed();
  const inserted = await db
    .insert(users)
    .values({
      pseudo,
      pseudoLower: lower,
      avatarSeed: seed,
    })
    .returning();
  return inserted[0]!;
}

export async function getUserById(id: string) {
  const r = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return r[0] ?? null;
}

function randomSeed() {
  return Math.random().toString(36).slice(2, 12);
}

// QUESTIONS ------------------------------------------------------
/**
 * Pick N random questions of a given difficulty, excluding ids.
 * Uses ORDER BY random() — fine for 12k rows.
 */
export async function pickRandomQuestions(
  difficulty: number,
  count: number,
  excludeIds: number[] = [],
) {
  const exclude = excludeIds.length ? excludeIds : [-1];
  const rows = await db
    .select()
    .from(questions)
    .where(
      and(
        eq(questions.difficulty, difficulty),
        sql`${questions.id} NOT IN ${exclude}`,
      ),
    )
    .orderBy(sql`random()`)
    .limit(count);
  return rows;
}

export async function pickQuestionsByDifficulties(
  difficulties: number[],
  excludeIds: number[] = [],
) {
  // For 15-question millionaire run, fetch one per difficulty
  const out = [] as Awaited<ReturnType<typeof pickRandomQuestions>>;
  const seen = new Set<number>(excludeIds);
  for (const d of difficulties) {
    const r = await pickRandomQuestions(d, 1, [...seen]);
    if (r[0]) {
      out.push(r[0]);
      seen.add(r[0].id);
    }
  }
  return out;
}

// LOBBIES --------------------------------------------------------
export async function createLobby(opts: {
  code: string;
  gameType: "millionaire" | "battleship";
  hostUserId: string;
  maxPlayers: number;
}) {
  const ins = await db
    .insert(lobbies)
    .values({
      code: opts.code,
      gameType: opts.gameType,
      hostUserId: opts.hostUserId,
      maxPlayers: opts.maxPlayers,
    })
    .returning();
  const lobby = ins[0]!;
  await db.insert(lobbyPlayers).values({
    lobbyId: lobby.id,
    userId: opts.hostUserId,
    slotIndex: 0,
  });
  return lobby;
}

export async function getLobbyByCode(code: string) {
  const r = await db.select().from(lobbies).where(eq(lobbies.code, code)).limit(1);
  return r[0] ?? null;
}

export async function getLobbyPlayers(lobbyId: string) {
  return db
    .select({
      userId: lobbyPlayers.userId,
      slotIndex: lobbyPlayers.slotIndex,
      isReady: lobbyPlayers.isReady,
      pseudo: users.pseudo,
      avatarSeed: users.avatarSeed,
    })
    .from(lobbyPlayers)
    .innerJoin(users, eq(users.id, lobbyPlayers.userId))
    .where(eq(lobbyPlayers.lobbyId, lobbyId));
}

export async function joinLobby(lobbyId: string, userId: string) {
  const players = await db
    .select()
    .from(lobbyPlayers)
    .where(eq(lobbyPlayers.lobbyId, lobbyId));
  if (players.find((p) => p.userId === userId)) return;
  const taken = new Set(players.map((p) => p.slotIndex));
  let slot = 0;
  while (taken.has(slot)) slot++;
  await db.insert(lobbyPlayers).values({
    lobbyId,
    userId,
    slotIndex: slot,
  });
}

export async function setPlayerReady(lobbyId: string, userId: string, ready: boolean) {
  await db
    .update(lobbyPlayers)
    .set({ isReady: ready })
    .where(and(eq(lobbyPlayers.lobbyId, lobbyId), eq(lobbyPlayers.userId, userId)));
}

export async function leaveLobby(lobbyId: string, userId: string) {
  await db
    .update(lobbyPlayers)
    .set({ leftAt: new Date() })
    .where(and(eq(lobbyPlayers.lobbyId, lobbyId), eq(lobbyPlayers.userId, userId)));
}

export async function setLobbyStatus(
  lobbyId: string,
  status: "waiting" | "starting" | "playing" | "finished" | "abandoned",
) {
  await db
    .update(lobbies)
    .set({
      status,
      ...(status === "playing" ? { startedAt: new Date() } : {}),
      ...(status === "finished" || status === "abandoned" ? { endedAt: new Date() } : {}),
    })
    .where(eq(lobbies.id, lobbyId));
}

// MILLIONAIRE ----------------------------------------------------
export async function createMillionaireGame(opts: {
  lobbyId: string;
  questionIds: number[];
  answerOrders: number[][];
  playerIds: string[];
}) {
  const ins = await db
    .insert(millionaireGames)
    .values({
      lobbyId: opts.lobbyId,
      questionIds: opts.questionIds,
      answerOrders: opts.answerOrders,
    })
    .returning();
  const game = ins[0]!;
  await db.insert(millionairePlayerState).values(
    opts.playerIds.map((u) => ({
      gameId: game.id,
      userId: u,
    })),
  );
  return game;
}

export async function getQuestionsByIds(ids: number[]) {
  if (!ids.length) return [];
  return db.select().from(questions).where(inArray(questions.id, ids));
}

export async function finishMillionaireGame(opts: {
  gameId: string;
  lobbyId: string;
  winnerUserId: string | null;
  finalsByUser: { userId: string; tier: number; prize: number; eliminatedAtRound: number | null }[];
}) {
  await db
    .update(millionaireGames)
    .set({ endedAt: new Date(), winnerUserId: opts.winnerUserId })
    .where(eq(millionaireGames.id, opts.gameId));
  for (const f of opts.finalsByUser) {
    await db
      .update(millionairePlayerState)
      .set({
        finalTier: f.tier,
        finalPrizeEur: f.prize,
        eliminatedAtRound: f.eliminatedAtRound,
      })
      .where(
        and(
          eq(millionairePlayerState.gameId, opts.gameId),
          eq(millionairePlayerState.userId, f.userId),
        ),
      );
    await db.insert(gameHistory).values({
      gameType: "millionaire",
      lobbyId: opts.lobbyId,
      userId: f.userId,
      isWinner: opts.winnerUserId === f.userId,
      score: f.prize,
    });
    await db
      .update(users)
      .set({
        totalGames: sql`${users.totalGames} + 1`,
        totalWins: sql`${users.totalWins} + ${opts.winnerUserId === f.userId ? 1 : 0}`,
        bestScore: sql`GREATEST(${users.bestScore}, ${f.prize})`,
      })
      .where(eq(users.id, f.userId));
  }
}

// BATTLESHIP -----------------------------------------------------
export async function createBattleshipGame(lobbyId: string) {
  const ins = await db
    .insert(battleshipGames)
    .values({ lobbyId })
    .returning();
  return ins[0]!;
}

export async function saveBattleshipGrid(opts: {
  gameId: string;
  userId: string;
  ships: unknown;
}) {
  await db
    .insert(battleshipGrids)
    .values({ gameId: opts.gameId, userId: opts.userId, ships: opts.ships })
    .onConflictDoUpdate({
      target: [battleshipGrids.gameId, battleshipGrids.userId],
      set: { ships: opts.ships, placedAt: new Date() },
    });
}

export async function finishBattleshipGame(opts: {
  gameId: string;
  lobbyId: string;
  winnerUserId: string;
  loserUserId: string;
  turns: number;
}) {
  await db
    .update(battleshipGames)
    .set({
      endedAt: new Date(),
      winnerUserId: opts.winnerUserId,
      phase: "finished",
    })
    .where(eq(battleshipGames.id, opts.gameId));
  for (const u of [opts.winnerUserId, opts.loserUserId]) {
    await db.insert(gameHistory).values({
      gameType: "battleship",
      lobbyId: opts.lobbyId,
      userId: u,
      isWinner: u === opts.winnerUserId,
      score: u === opts.winnerUserId ? Math.max(0, 200 - opts.turns) : 0,
    });
    await db
      .update(users)
      .set({
        totalGames: sql`${users.totalGames} + 1`,
        totalWins: sql`${users.totalWins} + ${u === opts.winnerUserId ? 1 : 0}`,
      })
      .where(eq(users.id, u));
  }
}

// LEADERBOARD & HISTORY ------------------------------------------
export async function topMillionaireLeaderboard(limit = 50) {
  const r = await db
    .select({
      userId: gameHistory.userId,
      pseudo: users.pseudo,
      avatarSeed: users.avatarSeed,
      score: gameHistory.score,
      endedAt: gameHistory.endedAt,
    })
    .from(gameHistory)
    .innerJoin(users, eq(users.id, gameHistory.userId))
    .where(eq(gameHistory.gameType, "millionaire"))
    .orderBy(desc(gameHistory.score), desc(gameHistory.endedAt))
    .limit(limit);
  return r;
}

export async function userHistory(userId: string, limit = 20) {
  return db
    .select()
    .from(gameHistory)
    .where(eq(gameHistory.userId, userId))
    .orderBy(desc(gameHistory.endedAt))
    .limit(limit);
}
