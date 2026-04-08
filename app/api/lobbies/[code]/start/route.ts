import { apiHandler, ApiError } from "@/lib/api/response";
import { requireCurrentUser } from "@/lib/auth/session";
import { getLobbyByCode } from "@/lib/db/queries";
import { getLobbyState } from "@/lib/redis/lobby-state";
import { startMillionaireGame } from "@/lib/games/millionaire/engine";
import { startBattleshipGame } from "@/lib/games/battleship/engine";

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
    if (lobby.hostUserId !== user.id) throw new ApiError(403, "not_host");

    const state = await getLobbyState(upper);
    if (!state) throw new ApiError(404, "lobby_state_missing");
    if (state.status !== "waiting") throw new ApiError(409, "already_started");
    if (state.players.length < 2) throw new ApiError(409, "need_at_least_2");
    if (!state.players.every((p) => p.isReady)) throw new ApiError(409, "not_all_ready");

    if (lobby.gameType === "millionaire") {
      const next = await startMillionaireGame(upper);
      return { lobby: next };
    } else {
      const next = await startBattleshipGame(upper);
      return { lobby: next };
    }
  });
}
