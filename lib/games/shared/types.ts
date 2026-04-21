// ====== Shared lobby state shape (lives in Redis JSON) ======

export type GameType = "millionaire" | "battleship";

export type LobbyStatus =
  | "waiting"
  | "starting"
  | "playing"
  | "finished"
  | "abandoned";

export interface PlayerSummary {
  userId: string;
  pseudo: string;
  slot: number;
  isReady: boolean;
  avatarSeed: string;
}

export type RoundState = "answering" | "revealing";

export interface MillionaireQuestionPublic {
  id: number;
  text: string;
  answers: [string, string, string, string];
  category: string;
  difficulty: number;
}

export interface MillionairePlayerStateLite {
  userId: string;
  currentTier: number;
  alive: boolean;
  hasAnswered: boolean;
  jokersRemaining: ("fifty" | "public" | "phone" | "switch")[];
  /** Only present on the player's own entry after server redaction. */
  fiftyHidden?: number[];
  publicVote?: number[];
  phoneFriend?: { confidence: number; guess: number; quote: string };
  /** Override question per-player when 'switch' joker used. Redacted for others. */
  overrideQuestion?: MillionaireQuestionPublic;
  finalPrizeEur?: number;
  /** Round at which this player was eliminated (1-based). */
  eliminatedAtRound?: number;
}

export interface LastReveal {
  round: number;
  correctIndex: number;
  perPlayer: {
    userId: string;
    chosenIndex: number | null;
    correct: boolean;
    /** Per-player correct index (may differ from top-level for switch joker users). */
    correctIndex?: number;
  }[];
}

export interface MillionaireSection {
  gameId: string;
  round: number; // 1..15
  question: MillionaireQuestionPublic;
  deadlineAt: number; // ms epoch
  roundState: RoundState;
  revealReleaseAt?: number;
  playerStates: MillionairePlayerStateLite[];
  lastReveal?: LastReveal;
  finishedAt?: number;
  winnerUserId?: string | null;
}

// ====== Battleship ======

export type BattleshipPhase = "placement" | "battle" | "finished";
export type ShotPattern =
  | "single"
  | "line2"
  | "line3"
  | "tShape"
  | "cross5"
  | "area9";
export type CellResult = "miss" | "hit" | "sunk";

export interface BattleshipQuestionPublic extends MillionaireQuestionPublic {
  patternReward: ShotPattern;
}

export interface BattleshipShipsStatus {
  remaining: number;
  sunk: number[];
}

export interface BattleshipPublicCell {
  x: number;
  y: number;
  result: CellResult;
  shipSize?: number;
}

export interface BattleshipSection {
  gameId: string;
  phase: BattleshipPhase;
  turnNumber: number;
  currentTurnUserId: string | null;
  placedReady: Record<string, boolean>; // userId -> bool
  /**
   * Question phase lifecycle:
   *   idle → answering → (correct) shooting → idle (next turn)
   *                    → (wrong)   revealing → idle (next turn)
   */
  questionPhase: "idle" | "answering" | "revealing" | "shooting";
  currentQuestion?: BattleshipQuestionPublic;
  questionDifficulty?: number;
  deadlineAt?: number;
  answeredCorrectly?: boolean;
  /** Set during revealing/shooting: correct answer index for public display. */
  revealedCorrectIndex?: number;
  /** Locked-in answer that triggered the reveal (for display). */
  revealedChosenIndex?: number;
  shipsStatus: Record<string, BattleshipShipsStatus>; // public count + sunk sizes
  publicGrids: Record<string, BattleshipPublicCell[]>; // shots fired ON this user
  lastShot?: {
    shooterUserId: string;
    cells: { x: number; y: number; result: CellResult; shipSize?: number }[];
    sunk: boolean;
    gameOver: boolean;
  };
  winnerUserId?: string | null;
}

// ====== Master lobby state ======

export interface LobbyState {
  v: number;
  code: string;
  gameType: GameType;
  status: LobbyStatus;
  hostUserId: string;
  maxPlayers: number;
  players: PlayerSummary[];
  createdAt: number;
  startedAt?: number;
  endedAt?: number;
  millionaire?: MillionaireSection;
  battleship?: BattleshipSection;
}
