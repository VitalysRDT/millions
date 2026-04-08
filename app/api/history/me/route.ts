import { apiHandler } from "@/lib/api/response";
import { requireCurrentUser } from "@/lib/auth/session";
import { userHistory } from "@/lib/db/queries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  return apiHandler(async () => {
    const u = await requireCurrentUser();
    const url = new URL(request.url);
    const limit = Math.min(100, Math.max(1, Number(url.searchParams.get("limit") ?? "20")));
    const entries = await userHistory(u.id, limit);
    return { entries };
  });
}
