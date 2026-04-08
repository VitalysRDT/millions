import { apiHandler, ApiError } from "@/lib/api/response";
import { requireCurrentUser } from "@/lib/auth/session";
import { applyLobbyMutation } from "@/lib/redis/lobby-state";
import { joinLobby, getLobbyByCode } from "@/lib/db/queries";

export const runtime = "nodejs";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  return apiHandler(async () => {
    const user = await requireCurrentUser();
    const { code } = await params;
    const upper = code.toUpperCase();
    const lobby = await getLobbyByCode(upper);
    if (!lobby) throw new ApiError(404, "lobby_not_found");
    if (lobby.status !== "waiting") throw new ApiError(409, "lobby_not_waiting");
    await joinLobby(lobby.id, user.id);
    const next = await applyLobbyMutation(upper, (state) => {
      if (state.players.find((p) => p.userId === user.id)) return state;
      if (state.players.length >= state.maxPlayers) {
        throw new ApiError(409, "lobby_full");
      }
      const taken = new Set(state.players.map((p) => p.slot));
      let slot = 0;
      while (taken.has(slot)) slot++;
      state.players.push({
        userId: user.id,
        pseudo: user.pseudo,
        slot,
        isReady: false,
        avatarSeed: user.avatarSeed,
      });
      return state;
    });
    return { lobby: next };
  });
}
