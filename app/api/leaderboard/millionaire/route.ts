import { apiHandler } from "@/lib/api/response";
import { topMillionaireLeaderboard } from "@/lib/db/queries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  return apiHandler(async () => {
    const url = new URL(request.url);
    const limit = Math.min(100, Math.max(1, Number(url.searchParams.get("limit") ?? "50")));
    const entries = await topMillionaireLeaderboard(limit);
    return { entries };
  });
}
