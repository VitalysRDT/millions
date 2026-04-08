export const k = {
  lobby: (code: string) => `lobby:${code}`,
  lobbyVersion: (code: string) => `lobby:${code}:version`,
  lobbyLock: (code: string) => `lobby:${code}:lock`,
  lobbyHeartbeat: (code: string, userId: string) => `lobby:${code}:heartbeat:${userId}`,
  lobbyIdem: (code: string, key: string) => `lobby:${code}:idem:${key}`,
  userCurrentLobby: (userId: string) => `user:${userId}:current_lobby`,
  userRecentQ: (userId: string) => `user:${userId}:recent_q`,
  codeReserved: (code: string) => `code:${code}`,
  gameCorrect: (gameId: string, round: number) => `game:${gameId}:q:${round}:correct`,
  gameCorrectPerUser: (gameId: string, round: number, userId: string) =>
    `game:${gameId}:q:${round}:correct:${userId}`,
  gameOrder: (gameId: string, round: number) => `game:${gameId}:q:${round}:order`,
  gamePlayerAnswer: (gameId: string, round: number, userId: string) =>
    `game:${gameId}:q:${round}:ans:${userId}`,
  gameBattleshipAnswer: (gameId: string, turn: number, userId: string) =>
    `game:${gameId}:bs:${turn}:ans:${userId}`,
  gameBattleshipCorrect: (gameId: string, turn: number) =>
    `game:${gameId}:bs:${turn}:correct`,
  lbMillionaireTop: () => `lb:millionaire:top`,
};
