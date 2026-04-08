import { NextRequest } from "next/server";
import { apiHandler, ApiError } from "@/lib/api/response";
import { PlaceShipsInput } from "@/lib/api/validation";
import { requireCurrentUser } from "@/lib/auth/session";
import { placeFleet } from "@/lib/games/battleship/engine";

export const runtime = "nodejs";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  return apiHandler(async () => {
    const user = await requireCurrentUser();
    const { code } = await params;
    const body = PlaceShipsInput.parse(await req.json());
    try {
      const lobby = await placeFleet({
        code: code.toUpperCase(),
        userId: user.id,
        ships: body.ships.map((s) => ({
          size: s.size,
          cells: s.cells.map(([x, y]) => [x, y] as [number, number]),
        })),
      });
      const bothReady = Object.values(lobby.battleship?.placedReady ?? {}).every(Boolean);
      return { placed: true, bothReady, lobby };
    } catch (e) {
      throw new ApiError(400, e instanceof Error ? e.message : "place_error");
    }
  });
}
