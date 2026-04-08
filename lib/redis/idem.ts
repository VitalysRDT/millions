import { redis } from "./client";

/**
 * Returns true if this idempotency key was NOT seen before (so caller should proceed),
 * or false if it was already used (caller should treat as no-op).
 */
export async function claimIdempotency(
  key: string,
  ttlSeconds = 60,
): Promise<boolean> {
  const r = redis();
  const ok = await r.set(key, "1", { nx: true, ex: ttlSeconds });
  return ok === "OK";
}
