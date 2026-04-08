import { redis } from "./client";

export async function withLock<T>(
  key: string,
  fn: () => Promise<T>,
  ttlSeconds = 5,
  maxRetries = 5,
): Promise<T> {
  const r = redis();
  for (let i = 0; i < maxRetries; i++) {
    const ok = await r.set(key, "1", { nx: true, ex: ttlSeconds });
    if (ok) {
      try {
        return await fn();
      } finally {
        await r.del(key);
      }
    }
    await new Promise((res) => setTimeout(res, 80 + i * 60));
  }
  throw new Error(`could_not_acquire_lock:${key}`);
}
