import { apiHandler, ok } from "@/lib/api/response";
import { clearCookieHeader } from "@/lib/auth/cookie";

export const runtime = "nodejs";

export async function POST() {
  return apiHandler(async () => {
    const res = ok({ ok: true });
    res.headers.set("Set-Cookie", clearCookieHeader());
    return res;
  });
}
