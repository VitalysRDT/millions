import { NextRequest } from "next/server";
import { apiHandler, ApiError } from "@/lib/api/response";
import { requireCurrentUser } from "@/lib/auth/session";
import { getLobbyStateAndVersion, heartbeat } from "@/lib/redis/lobby-state";
import type { LobbyState } from "@/lib/games/shared/types";

export const runtime = "nodejs";

/**
 * (B6 fix) Redact other players' joker results before sending state to the
 * requesting user. Without this, a player could read another player's
 * fiftyHidden / publicVote / phoneFriend / overrideQuestion and derive the
 * correct answer.
 */
function redactForUser(state: LobbyState, currentUserId: string): LobbyState {
  if (!state.millionaire) return state;
  // Deep clone only the part we need to mutate
  const cloned: LobbyState = {
    ...state,
    millionaire: {
      ...state.millionaire,
      playerStates: state.millionaire.playerStates.map((p) => {
        if (p.userId === currentUserId) return p;
        // Strip sensitive joker outputs for other players
        const copy = { ...p };
        delete copy.fiftyHidden;
        delete copy.publicVote;
        delete copy.phoneFriend;
        delete copy.overrideQuestion;
        return copy;
      }),
    },
  };
  return cloned;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  return apiHandler(async () => {
    const user = await requireCurrentUser();
    const { code } = await params;
    const upper = code.toUpperCase();
    const { state, version } = await getLobbyStateAndVersion(upper);
    if (!state) throw new ApiError(404, "lobby_not_found");

    heartbeat(upper, user.id).catch(() => undefined);

    const ifVersion = req.headers.get("x-if-version");
    if (ifVersion && Number(ifVersion) === version) {
      return new Response(null, { status: 304 });
    }

    return { state: redactForUser(state, user.id), version };
  });
}
