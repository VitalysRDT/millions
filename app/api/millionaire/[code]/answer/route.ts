import { NextRequest } from "next/server";
import { apiHandler, ApiError } from "@/lib/api/response";
import { AnswerInput } from "@/lib/api/validation";
import { requireCurrentUser } from "@/lib/auth/session";
import { recordAnswer } from "@/lib/games/millionaire/engine";
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
    const upper = code.toUpperCase();
    const body = AnswerInput.parse(await req.json());
    const idemKey = k.lobbyIdem(upper, `${user.id}:${body.round}:${body.clientIdemKey}`);
    const claimed = await claimIdempotency(idemKey);
    if (!claimed) return { accepted: true, deduped: true };
    try {
      const out = await recordAnswer({
        code: upper,
        userId: user.id,
        round: body.round,
        chosenIndex: body.chosenIndex,
      });
      return out;
    } catch (e) {
      throw new ApiError(409, e instanceof Error ? e.message : "answer_error");
    }
  });
}
