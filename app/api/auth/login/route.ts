import { NextRequest } from "next/server";
import { apiHandler, ok } from "@/lib/api/response";
import { LoginInput } from "@/lib/api/validation";
import { findOrCreateUser } from "@/lib/db/queries";
import { buildCookieHeader, signSessionToken } from "@/lib/auth/cookie";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  return apiHandler(async () => {
    const body = LoginInput.parse(await req.json());
    const user = await findOrCreateUser(body.pseudo);
    const token = signSessionToken(user.id);
    const res = ok({
      userId: user.id,
      pseudo: user.pseudo,
      avatarSeed: user.avatarSeed,
    });
    res.headers.set("Set-Cookie", buildCookieHeader(token));
    return res;
  });
}
