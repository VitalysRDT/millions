import { apiHandler } from "@/lib/api/response";
import { requireCurrentUser } from "@/lib/auth/session";
import { tickBattleship } from "@/lib/games/battleship/engine";

export const runtime = "nodejs";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  return apiHandler(async () => {
    await requireCurrentUser();
    const { code } = await params;
    await tickBattleship(code.toUpperCase());
    return { ok: true };
  });
}
