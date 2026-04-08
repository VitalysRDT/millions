import { sql } from "drizzle-orm";
import {
  pgTable,
  uuid,
  varchar,
  integer,
  smallint,
  timestamp,
  text,
  jsonb,
  boolean,
  pgEnum,
  bigserial,
  primaryKey,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";

// ====== ENUMS ======
export const gameTypeEnum = pgEnum("game_type", ["millionaire", "battleship"]);
export const lobbyStatusEnum = pgEnum("lobby_status", [
  "waiting",
  "starting",
  "playing",
  "finished",
  "abandoned",
]);
export const battleshipPhaseEnum = pgEnum("battleship_phase", [
  "placement",
  "battle",
  "finished",
]);

// ====== USERS ======
export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    pseudo: varchar("pseudo", { length: 24 }).notNull(),
    pseudoLower: varchar("pseudo_lower", { length: 24 }).notNull().unique(),
    avatarSeed: varchar("avatar_seed", { length: 32 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true }).notNull().defaultNow(),
    totalGames: integer("total_games").notNull().default(0),
    totalWins: integer("total_wins").notNull().default(0),
    bestScore: integer("best_score").notNull().default(0),
  },
  (t) => ({
    lastSeenIdx: index("idx_users_last_seen").on(t.lastSeenAt),
  }),
);

// ====== SESSIONS ======
export const sessions = pgTable(
  "sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    issuedAt: timestamp("issued_at", { withTimezone: true }).notNull().defaultNow(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    userAgent: text("user_agent"),
  },
  (t) => ({
    userIdx: index("idx_sessions_user").on(t.userId),
    expIdx: index("idx_sessions_expires").on(t.expiresAt),
  }),
);

// ====== QUESTIONS ======
export const questions = pgTable(
  "questions",
  {
    id: integer("id").primaryKey(),
    text: text("text").notNull(),
    correct: text("correct").notNull(),
    incorrect1: text("incorrect_1").notNull(),
    incorrect2: text("incorrect_2").notNull(),
    incorrect3: text("incorrect_3").notNull(),
    category: varchar("category", { length: 64 }).notNull(),
    difficulty: smallint("difficulty").notNull(),
    language: varchar("language", { length: 4 }).notNull().default("fr"),
  },
  (t) => ({
    diffIdx: index("idx_questions_diff").on(t.difficulty),
    catDiffIdx: index("idx_questions_cat_diff").on(t.category, t.difficulty),
  }),
);

// ====== LOBBIES ======
export const lobbies = pgTable(
  "lobbies",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    code: varchar("code", { length: 6 }).notNull().unique(),
    gameType: gameTypeEnum("game_type").notNull(),
    status: lobbyStatusEnum("status").notNull().default("waiting"),
    hostUserId: uuid("host_user_id")
      .notNull()
      .references(() => users.id),
    maxPlayers: smallint("max_players").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    startedAt: timestamp("started_at", { withTimezone: true }),
    endedAt: timestamp("ended_at", { withTimezone: true }),
  },
  (t) => ({
    statusIdx: index("idx_lobbies_status").on(t.status),
    codeIdx: index("idx_lobbies_code").on(t.code),
  }),
);

export const lobbyPlayers = pgTable(
  "lobby_players",
  {
    lobbyId: uuid("lobby_id")
      .notNull()
      .references(() => lobbies.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    joinedAt: timestamp("joined_at", { withTimezone: true }).notNull().defaultNow(),
    slotIndex: smallint("slot_index").notNull(),
    isReady: boolean("is_ready").notNull().default(false),
    leftAt: timestamp("left_at", { withTimezone: true }),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.lobbyId, t.userId] }),
    slotUq: uniqueIndex("idx_lobby_slot").on(t.lobbyId, t.slotIndex),
    userIdx: index("idx_lp_user").on(t.userId),
  }),
);

// ====== MILLIONAIRE ======
export const millionaireGames = pgTable(
  "millionaire_games",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    lobbyId: uuid("lobby_id")
      .notNull()
      .unique()
      .references(() => lobbies.id, { onDelete: "cascade" }),
    questionIds: integer("question_ids").array().notNull(),
    answerOrders: jsonb("answer_orders").notNull(),
    startedAt: timestamp("started_at", { withTimezone: true }),
    endedAt: timestamp("ended_at", { withTimezone: true }),
    winnerUserId: uuid("winner_user_id").references(() => users.id),
  },
  (t) => ({
    lobbyIdx: index("idx_mg_lobby").on(t.lobbyId),
  }),
);

export const millionairePlayerState = pgTable(
  "millionaire_player_state",
  {
    gameId: uuid("game_id")
      .notNull()
      .references(() => millionaireGames.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    currentTier: smallint("current_tier").notNull().default(0),
    finalTier: smallint("final_tier"),
    finalPrizeEur: integer("final_prize_eur"),
    eliminatedAtRound: smallint("eliminated_at_round"),
    jokersUsed: jsonb("jokers_used").notNull().default(sql`'[]'::jsonb`),
    answers: jsonb("answers").notNull().default(sql`'[]'::jsonb`),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.gameId, t.userId] }),
    gameIdx: index("idx_mps_game").on(t.gameId),
  }),
);

// ====== BATTLESHIP ======
export const battleshipGames = pgTable("battleship_games", {
  id: uuid("id").primaryKey().defaultRandom(),
  lobbyId: uuid("lobby_id")
    .notNull()
    .unique()
    .references(() => lobbies.id, { onDelete: "cascade" }),
  phase: battleshipPhaseEnum("phase").notNull().default("placement"),
  currentTurnUserId: uuid("current_turn_user_id").references(() => users.id),
  turnNumber: integer("turn_number").notNull().default(0),
  startedAt: timestamp("started_at", { withTimezone: true }),
  endedAt: timestamp("ended_at", { withTimezone: true }),
  winnerUserId: uuid("winner_user_id").references(() => users.id),
});

export const battleshipGrids = pgTable(
  "battleship_grids",
  {
    gameId: uuid("game_id")
      .notNull()
      .references(() => battleshipGames.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    ships: jsonb("ships").notNull(),
    placedAt: timestamp("placed_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.gameId, t.userId] }),
  }),
);

export const battleshipShots = pgTable(
  "battleship_shots",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    gameId: uuid("game_id")
      .notNull()
      .references(() => battleshipGames.id, { onDelete: "cascade" }),
    shooterUserId: uuid("shooter_user_id")
      .notNull()
      .references(() => users.id),
    turnNumber: integer("turn_number").notNull(),
    questionId: integer("question_id")
      .notNull()
      .references(() => questions.id),
    questionDifficulty: smallint("question_difficulty").notNull(),
    answeredCorrectly: boolean("answered_correctly").notNull(),
    shotPattern: varchar("shot_pattern", { length: 8 }).notNull(),
    cells: jsonb("cells").notNull(),
    hits: jsonb("hits").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    gameTurnIdx: index("idx_bs_game_turn").on(t.gameId, t.turnNumber),
  }),
);

// ====== HISTORY ======
export const gameHistory = pgTable(
  "game_history",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    gameType: gameTypeEnum("game_type").notNull(),
    lobbyId: uuid("lobby_id").references(() => lobbies.id, {
      onDelete: "set null",
    }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    isWinner: boolean("is_winner").notNull(),
    score: integer("score").notNull(),
    metadata: jsonb("metadata"),
    endedAt: timestamp("ended_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    userIdx: index("idx_gh_user").on(t.userId, t.endedAt),
    endedIdx: index("idx_gh_ended").on(t.endedAt),
  }),
);

export type User = typeof users.$inferSelect;
export type Question = typeof questions.$inferSelect;
export type Lobby = typeof lobbies.$inferSelect;
