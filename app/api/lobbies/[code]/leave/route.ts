import { apiHandler, ApiError } from "@/lib/api/response";
import { requireCurrentUser } from "@/lib/auth/session";
import { applyLobbyMutation } from "@/lib/redis/lobby-state";
import { leaveLobby, getLobbyByCode, setLobbyStatus } from "@/lib/db/queries";
import { forfeitMillionairePlayer } from "@/lib/games/millionaire/engine";
import { forfeitBattleship } from "@/lib/games/battleship/engine";

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
    await leaveLobby(lobby.id, user.id);

    // (B12 fix) When a player leaves a running game, we need to handle the
    // forfeit rather than just removing them silently.
    if (lobby.status === "playing") {
      if (lobby.gameType === "battleship") {
        await forfeitBattleship(upper, user.id);
      } else {
        await forfeitMillionairePlayer(upper, user.id);
      }
      return { ok: true };
    }

    // Waiting state: standard leave behaviour
    let cancelled = false;
    await applyLobbyMutation(upper, (state) => {
      state.players = state.players.filter((p) => p.userId !== user.id);
      if (state.players.length === 0) {
        state.status = "abandoned";
        cancelled = true;
      } else if (state.hostUserId === user.id) {
        state.hostUserId = state.players[0]!.userId;
      }
      return state;
    });
    if (cancelled) {
      await setLobbyStatus(lobby.id, "abandoned");
    }
    return { ok: true };
  });
}
