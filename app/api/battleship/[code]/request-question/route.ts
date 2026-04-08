import { NextRequest } from "next/server";
import { apiHandler, ApiError } from "@/lib/api/response";
import { RequestQuestionInput } from "@/lib/api/validation";
import { requireCurrentUser } from "@/lib/auth/session";
import { requestBattleshipQuestion } from "@/lib/games/battleship/engine";

export const runtime = "nodejs";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  return apiHandler(async () => {
    const user = await requireCurrentUser();
    const { code } = await params;
    const body = RequestQuestionInput.parse(await req.json());
    try {
      const out = await requestBattleshipQuestion({
        code: code.toUpperCase(),
        userId: user.id,
        difficulty: body.difficulty,
      });
      return out;
    } catch (e) {
      throw new ApiError(409, e instanceof Error ? e.message : "request_error");
    }
  });
}
