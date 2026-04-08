import crypto from "node:crypto";
import { env } from "@/lib/env";

const COOKIE_NAME = "millions_session";
const TTL_DAYS = 30;

export function getCookieName(): string {
  return COOKIE_NAME;
}

export function signSessionToken(userId: string): string {
  const expiresAt = Date.now() + TTL_DAYS * 24 * 3600 * 1000;
  const payload = `${userId}.${expiresAt}`;
  const sig = crypto
    .createHmac("sha256", env().SESSION_SECRET)
    .update(payload)
    .digest("base64url");
  return `${payload}.${sig}`;
}

export function verifySessionToken(
  token: string | undefined,
): { userId: string; expiresAt: number } | null {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [userId, expiresAtStr, sig] = parts;
  if (!userId || !expiresAtStr || !sig) return null;
  const expiresAt = Number(expiresAtStr);
  if (!Number.isFinite(expiresAt) || expiresAt < Date.now()) return null;
  const expected = crypto
    .createHmac("sha256", env().SESSION_SECRET)
    .update(`${userId}.${expiresAtStr}`)
    .digest("base64url");
  if (
    expected.length !== sig.length ||
    !crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(sig))
  ) {
    return null;
  }
  return { userId, expiresAt };
}

export function buildCookieHeader(token: string): string {
  const maxAge = TTL_DAYS * 24 * 3600;
  return `${COOKIE_NAME}=${token}; HttpOnly; Path=/; Max-Age=${maxAge}; SameSite=Lax; Secure`;
}

export function clearCookieHeader(): string {
  return `${COOKIE_NAME}=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax; Secure`;
}
