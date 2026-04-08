import { NextRequest } from "next/server";
import { apiHandler, ApiError } from "@/lib/api/response";
import { CreateLobbyInput } from "@/lib/api/validation";
import { requireCurrentUser } from "@/lib/auth/session";
import { reserveUniqueLobbyCode } from "@/lib/games/shared/code";
import { createLobby } from "@/lib/db/queries";
import { initLobbyState } from "@/lib/redis/lobby-state";
import type { LobbyState } from "@/lib/games/shared/types";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  return apiHandler(async () => {
    const user = await requireCurrentUser();
    const body = CreateLobbyInput.parse(await req.json());
    const max =
      body.gameType === "battleship"
        ? 2
        : Math.max(2, Math.min(8, body.maxPlayers ?? 6));
    if (body.gameType === "battleship" && body.maxPlayers && body.maxPlayers !== 2) {
      throw new ApiError(400, "battleship_max_players_must_be_2");
    }
    const code = await reserveUniqueLobbyCode();
    const lobby = await createLobby({
      code,
      gameType: body.gameType,
      hostUserId: user.id,
      maxPlayers: max,
    });
    const state: LobbyState = {
      v: 0,
      code,
      gameType: body.gameType,
      status: "waiting",
      hostUserId: user.id,
      maxPlayers: max,
      createdAt: Date.now(),
      players: [
        {
          userId: user.id,
          pseudo: user.pseudo,
          slot: 0,
          isReady: false,
          avatarSeed: user.avatarSeed,
        },
      ],
    };
    await initLobbyState(state);
    return { code, lobby };
  });
}
