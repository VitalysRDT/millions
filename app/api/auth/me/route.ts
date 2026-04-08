import { apiHandler } from "@/lib/api/response";
import { requireCurrentUser } from "@/lib/auth/session";

export const runtime = "nodejs";

export async function GET() {
  return apiHandler(async () => {
    const u = await requireCurrentUser();
    return {
      userId: u.id,
      pseudo: u.pseudo,
      avatarSeed: u.avatarSeed,
      stats: {
        totalGames: u.totalGames,
        totalWins: u.totalWins,
        bestScore: u.bestScore,
      },
    };
  });
}
