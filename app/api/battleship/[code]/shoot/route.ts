import { NextRequest } from "next/server";
import { apiHandler, ApiError } from "@/lib/api/response";
import { ShootInput } from "@/lib/api/validation";
import { requireCurrentUser } from "@/lib/auth/session";
import { fireShot } from "@/lib/games/battleship/engine";
import { claimIdempotency } from "@/lib/redis/idem";
import { k } from "@/lib/redis/keys";

export const runtime = "nodejs";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  return apiHandler(async () => {
    const user = await requireCurrentUser();
    const { code } = await params;
    const body = ShootInput.parse(await req.json());
    const idem = k.lobbyIdem(code.toUpperCase(), `bs-shoot:${user.id}:${body.clientIdemKey}`);
    const claimed = await claimIdempotency(idem);
    if (!claimed) return { results: [], gameOver: false, deduped: true };
    try {
      const out = await fireShot({
        code: code.toUpperCase(),
        userId: user.id,
        origin: [body.origin[0], body.origin[1]],
      });
      return out;
    } catch (e) {
      throw new ApiError(409, e instanceof Error ? e.message : "shoot_error");
    }
  });
}
