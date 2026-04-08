import { apiHandler, ApiError } from "@/lib/api/response";
import { requireCurrentUser } from "@/lib/auth/session";
import { applyLobbyMutation } from "@/lib/redis/lobby-state";
import { leaveLobby, getLobbyByCode, setLobbyStatus } from "@/lib/db/queries";

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
    let cancelled = false;
    await applyLobbyMutation(upper, (state) => {
      state.players = state.players.filter((p) => p.userId !== user.id);
      if (state.players.length === 0) {
        state.status = "abandoned";
        cancelled = true;
      } else if (state.hostUserId === user.id) {
        // promote next slot as host
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
