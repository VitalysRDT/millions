import { cookies } from "next/headers";
import { getCookieName, verifySessionToken } from "./cookie";
import { getUserById } from "@/lib/db/queries";

export async function getCurrentUserId(): Promise<string | null> {
  const store = await cookies();
  const token = store.get(getCookieName())?.value;
  const verified = verifySessionToken(token);
  return verified?.userId ?? null;
}

export async function requireCurrentUser() {
  const id = await getCurrentUserId();
  if (!id) throw new UnauthorizedError();
  const user = await getUserById(id);
  if (!user) throw new UnauthorizedError();
  return user;
}

export class UnauthorizedError extends Error {
  status = 401;
  constructor() {
    super("unauthorized");
  }
}
