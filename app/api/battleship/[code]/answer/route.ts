import { NextRequest } from "next/server";
import { apiHandler, ApiError } from "@/lib/api/response";
import { BattleshipAnswerInput } from "@/lib/api/validation";
import { requireCurrentUser } from "@/lib/auth/session";
import { answerBattleshipQuestion } from "@/lib/games/battleship/engine";
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
    const body = BattleshipAnswerInput.parse(await req.json());
    const idem = k.lobbyIdem(code.toUpperCase(), `bs-ans:${user.id}:${body.clientIdemKey}`);
    const claimed = await claimIdempotency(idem);
    if (!claimed) return { correct: false, canShoot: false, deduped: true };
    try {
      const out = await answerBattleshipQuestion({
        code: code.toUpperCase(),
        userId: user.id,
        chosenIndex: body.chosenIndex,
      });
      return out;
    } catch (e) {
      throw new ApiError(409, e instanceof Error ? e.message : "answer_error");
    }
  });
}
