-- ====== ENUMS ======
DO $$ BEGIN
  CREATE TYPE "game_type" AS ENUM ('millionaire', 'battleship');
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  CREATE TYPE "lobby_status" AS ENUM ('waiting','starting','playing','finished','abandoned');
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  CREATE TYPE "battleship_phase" AS ENUM ('placement','battle','finished');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ====== USERS ======
CREATE TABLE IF NOT EXISTS "users" (
  "id"            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "pseudo"        varchar(24) NOT NULL,
  "pseudo_lower"  varchar(24) NOT NULL UNIQUE,
  "avatar_seed"   varchar(32) NOT NULL,
  "created_at"    timestamptz NOT NULL DEFAULT now(),
  "last_seen_at"  timestamptz NOT NULL DEFAULT now(),
  "total_games"   integer NOT NULL DEFAULT 0,
  "total_wins"    integer NOT NULL DEFAULT 0,
  "best_score"    integer NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS "idx_users_last_seen" ON "users" ("last_seen_at");

-- ====== SESSIONS ======
CREATE TABLE IF NOT EXISTS "sessions" (
  "id"          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id"     uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "issued_at"   timestamptz NOT NULL DEFAULT now(),
  "expires_at"  timestamptz NOT NULL,
  "user_agent"  text
);
CREATE INDEX IF NOT EXISTS "idx_sessions_user" ON "sessions" ("user_id");
CREATE INDEX IF NOT EXISTS "idx_sessions_expires" ON "sessions" ("expires_at");

-- ====== QUESTIONS ======
CREATE TABLE IF NOT EXISTS "questions" (
  "id"           integer PRIMARY KEY,
  "text"         text NOT NULL,
  "correct"      text NOT NULL,
  "incorrect_1"  text NOT NULL,
  "incorrect_2"  text NOT NULL,
  "incorrect_3"  text NOT NULL,
  "category"     varchar(64) NOT NULL,
  "difficulty"   smallint NOT NULL CHECK (difficulty BETWEEN 1 AND 6),
  "language"     varchar(4) NOT NULL DEFAULT 'fr'
);
CREATE INDEX IF NOT EXISTS "idx_questions_diff" ON "questions" ("difficulty");
CREATE INDEX IF NOT EXISTS "idx_questions_cat_diff" ON "questions" ("category","difficulty");

-- ====== LOBBIES ======
CREATE TABLE IF NOT EXISTS "lobbies" (
  "id"            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "code"          varchar(6) NOT NULL UNIQUE,
  "game_type"     "game_type" NOT NULL,
  "status"        "lobby_status" NOT NULL DEFAULT 'waiting',
  "host_user_id"  uuid NOT NULL REFERENCES "users"("id"),
  "max_players"   smallint NOT NULL,
  "created_at"    timestamptz NOT NULL DEFAULT now(),
  "started_at"    timestamptz,
  "ended_at"      timestamptz
);
CREATE INDEX IF NOT EXISTS "idx_lobbies_status" ON "lobbies" ("status");
CREATE INDEX IF NOT EXISTS "idx_lobbies_code"   ON "lobbies" ("code");

CREATE TABLE IF NOT EXISTS "lobby_players" (
  "lobby_id"   uuid NOT NULL REFERENCES "lobbies"("id") ON DELETE CASCADE,
  "user_id"    uuid NOT NULL REFERENCES "users"("id")  ON DELETE CASCADE,
  "joined_at"  timestamptz NOT NULL DEFAULT now(),
  "slot_index" smallint NOT NULL,
  "is_ready"   boolean NOT NULL DEFAULT false,
  "left_at"    timestamptz,
  PRIMARY KEY ("lobby_id","user_id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "idx_lobby_slot" ON "lobby_players" ("lobby_id","slot_index");
CREATE INDEX IF NOT EXISTS "idx_lp_user" ON "lobby_players" ("user_id");

-- ====== MILLIONAIRE ======
CREATE TABLE IF NOT EXISTS "millionaire_games" (
  "id"             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "lobby_id"       uuid NOT NULL UNIQUE REFERENCES "lobbies"("id") ON DELETE CASCADE,
  "question_ids"   integer[] NOT NULL,
  "answer_orders"  jsonb NOT NULL,
  "started_at"     timestamptz,
  "ended_at"       timestamptz,
  "winner_user_id" uuid REFERENCES "users"("id")
);
CREATE INDEX IF NOT EXISTS "idx_mg_lobby" ON "millionaire_games" ("lobby_id");

CREATE TABLE IF NOT EXISTS "millionaire_player_state" (
  "game_id"             uuid NOT NULL REFERENCES "millionaire_games"("id") ON DELETE CASCADE,
  "user_id"             uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "current_tier"        smallint NOT NULL DEFAULT 0,
  "final_tier"          smallint,
  "final_prize_eur"     integer,
  "eliminated_at_round" smallint,
  "jokers_used"         jsonb NOT NULL DEFAULT '[]'::jsonb,
  "answers"             jsonb NOT NULL DEFAULT '[]'::jsonb,
  PRIMARY KEY ("game_id","user_id")
);
CREATE INDEX IF NOT EXISTS "idx_mps_game" ON "millionaire_player_state" ("game_id");

-- ====== BATTLESHIP ======
CREATE TABLE IF NOT EXISTS "battleship_games" (
  "id"                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "lobby_id"              uuid NOT NULL UNIQUE REFERENCES "lobbies"("id") ON DELETE CASCADE,
  "phase"                 "battleship_phase" NOT NULL DEFAULT 'placement',
  "current_turn_user_id"  uuid REFERENCES "users"("id"),
  "turn_number"           integer NOT NULL DEFAULT 0,
  "started_at"            timestamptz,
  "ended_at"              timestamptz,
  "winner_user_id"        uuid REFERENCES "users"("id")
);

CREATE TABLE IF NOT EXISTS "battleship_grids" (
  "game_id"   uuid NOT NULL REFERENCES "battleship_games"("id") ON DELETE CASCADE,
  "user_id"   uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "ships"     jsonb NOT NULL,
  "placed_at" timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY ("game_id","user_id")
);

CREATE TABLE IF NOT EXISTS "battleship_shots" (
  "id"                  bigserial PRIMARY KEY,
  "game_id"             uuid NOT NULL REFERENCES "battleship_games"("id") ON DELETE CASCADE,
  "shooter_user_id"     uuid NOT NULL REFERENCES "users"("id"),
  "turn_number"         integer NOT NULL,
  "question_id"         integer NOT NULL REFERENCES "questions"("id"),
  "question_difficulty" smallint NOT NULL,
  "answered_correctly"  boolean NOT NULL,
  "shot_pattern"        varchar(8) NOT NULL,
  "cells"               jsonb NOT NULL,
  "hits"                jsonb NOT NULL,
  "created_at"          timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "idx_bs_game_turn" ON "battleship_shots" ("game_id","turn_number");

-- ====== HISTORY ======
CREATE TABLE IF NOT EXISTS "game_history" (
  "id"        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "game_type" "game_type" NOT NULL,
  "lobby_id"  uuid REFERENCES "lobbies"("id") ON DELETE SET NULL,
  "user_id"   uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "is_winner" boolean NOT NULL,
  "score"     integer NOT NULL,
  "metadata"  jsonb,
  "ended_at"  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "idx_gh_user" ON "game_history" ("user_id","ended_at");
CREATE INDEX IF NOT EXISTS "idx_gh_ended" ON "game_history" ("ended_at");
CREATE INDEX IF NOT EXISTS "idx_gh_lb_millionaire" ON "game_history" ("score" DESC) WHERE game_type = 'millionaire';
