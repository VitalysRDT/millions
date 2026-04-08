import { NextRequest } from "next/server";
import { apiHandler, ApiError } from "@/lib/api/response";
import { JokerInput } from "@/lib/api/validation";
import { requireCurrentUser } from "@/lib/auth/session";
import { applyJoker } from "@/lib/games/millionaire/jokers";

export const runtime = "nodejs";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  return apiHandler(async () => {
    const user = await requireCurrentUser();
    const { code } = await params;
    const upper = code.toUpperCase();
    const body = JokerInput.parse(await req.json());
    try {
      const lobby = await applyJoker(upper, user.id, body.joker);
      return { lobby };
    } catch (e) {
      throw new ApiError(409, e instanceof Error ? e.message : "joker_error");
    }
  });
}
