import { NextRequest } from "next/server";
import { apiHandler, ApiError } from "@/lib/api/response";
import { requireCurrentUser } from "@/lib/auth/session";
import { ReadyInput } from "@/lib/api/validation";
import { applyLobbyMutation } from "@/lib/redis/lobby-state";
import { setPlayerReady, getLobbyByCode } from "@/lib/db/queries";

export const runtime = "nodejs";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  return apiHandler(async () => {
    const user = await requireCurrentUser();
    const { code } = await params;
    const upper = code.toUpperCase();
    const body = ReadyInput.parse(await req.json());
    const lobby = await getLobbyByCode(upper);
    if (!lobby) throw new ApiError(404, "lobby_not_found");
    if (lobby.status !== "waiting") throw new ApiError(409, "not_in_waiting");
    await setPlayerReady(lobby.id, user.id, body.ready);
    const next = await applyLobbyMutation(upper, (state) => {
      const p = state.players.find((x) => x.userId === user.id);
      if (p) p.isReady = body.ready;
      return state;
    });
    return { lobby: next };
  });
}
