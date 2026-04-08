import { apiHandler, ApiError } from "@/lib/api/response";
import { requireCurrentUser } from "@/lib/auth/session";
import { getLobbyState } from "@/lib/redis/lobby-state";
import { getPlayerShips } from "@/lib/games/battleship/engine";

export const runtime = "nodejs";

/**
 * (B5 fix) Returns the authenticated player's OWN ship cells so the client
 * can render them on "my grid" during the battle phase. The opponent's
 * ships are never exposed — this endpoint only reads
 * `bs:{gameId}:ships:{userId}` for the requesting user.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  return apiHandler(async () => {
    const user = await requireCurrentUser();
    const { code } = await params;
    const upper = code.toUpperCase();
    const state = await getLobbyState(upper);
    if (!state) throw new ApiError(404, "lobby_not_found");
    if (!state.players.find((p) => p.userId === user.id))
      throw new ApiError(403, "not_in_lobby");
    const bs = state.battleship;
    if (!bs) throw new ApiError(404, "no_battleship_game");
    const ships = await getPlayerShips(bs.gameId, user.id);
    if (!ships) return { ships: [] };
    // Strip hits — client only needs cells for rendering
    return {
      ships: ships.map((s) => ({ size: s.size, cells: s.cells })),
    };
  });
}
