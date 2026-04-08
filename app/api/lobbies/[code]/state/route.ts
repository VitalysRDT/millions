import { NextRequest } from "next/server";
import { apiHandler, ApiError } from "@/lib/api/response";
import { requireCurrentUser } from "@/lib/auth/session";
import { getLobbyStateAndVersion, heartbeat } from "@/lib/redis/lobby-state";

export const runtime = "nodejs";

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

    // heartbeat (do not await failure)
    heartbeat(upper, user.id).catch(() => undefined);

    const ifVersion = req.headers.get("x-if-version");
    if (ifVersion && Number(ifVersion) === version) {
      return new Response(null, { status: 304 });
    }
    return { state, version };
  });
}
