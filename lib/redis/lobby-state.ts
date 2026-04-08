import { redis } from "./client";
import { k } from "./keys";
import { withLock } from "./locks";
import type { LobbyState } from "@/lib/games/shared/types";

const LOBBY_TTL_SECONDS = 60 * 60; // 1 hour

export async function getLobbyState(code: string): Promise<LobbyState | null> {
  const r = redis();
  const raw = await r.get<LobbyState>(k.lobby(code));
  return raw ?? null;
}

export async function getLobbyStateAndVersion(
  code: string,
): Promise<{ state: LobbyState | null; version: number }> {
  const r = redis();
  // Two parallel reads (Upstash REST handles them concurrently).
  const [state, version] = await Promise.all([
    r.get<LobbyState>(k.lobby(code)),
    r.get<string>(k.lobbyVersion(code)),
  ]);
  return { state: state ?? null, version: version ? Number(version) : 0 };
}

export async function setLobbyState(
  code: string,
  state: LobbyState,
): Promise<number> {
  const r = redis();
  // Increment version FIRST to learn the new value, then write the state with that version embedded.
  const newVersion = await r.incr(k.lobbyVersion(code));
  state.v = newVersion;
  await Promise.all([
    r.set(k.lobby(code), state, { ex: LOBBY_TTL_SECONDS }),
    r.expire(k.lobbyVersion(code), LOBBY_TTL_SECONDS),
  ]);
  return newVersion;
}

export async function applyLobbyMutation(
  code: string,
  mutator: (state: LobbyState) => LobbyState | Promise<LobbyState>,
): Promise<LobbyState> {
  return withLock(k.lobbyLock(code), async () => {
    const current = await getLobbyState(code);
    if (!current) throw new Error("lobby_not_found");
    const next = await mutator(current);
    await setLobbyState(code, next);
    return next;
  });
}

export async function initLobbyState(state: LobbyState): Promise<void> {
  await setLobbyState(state.code, state);
}

export async function deleteLobbyState(code: string): Promise<void> {
  const r = redis();
  await r.del(k.lobby(code), k.lobbyVersion(code), k.lobbyLock(code));
}

export async function heartbeat(code: string, userId: string): Promise<void> {
  const r = redis();
  await r.set(k.lobbyHeartbeat(code, userId), Date.now(), { ex: 15 });
}
