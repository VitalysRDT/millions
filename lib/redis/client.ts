import IORedis, { type Redis as IORedisType } from "ioredis";
import { env } from "@/lib/env";

let cachedRaw: IORedisType | null = null;
const globalForRedis = globalThis as unknown as { __ioredisClient?: IORedisType };

function getRaw(): IORedisType {
  if (cachedRaw) return cachedRaw;
  if (globalForRedis.__ioredisClient) {
    cachedRaw = globalForRedis.__ioredisClient;
    return cachedRaw;
  }
  const client = new IORedis(env().REDIS_URL, {
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
    lazyConnect: false,
  });
  client.on("error", (err) => {
    console.warn("[redis] error:", err.message);
  });
  cachedRaw = client;
  if (process.env.NODE_ENV !== "production") globalForRedis.__ioredisClient = client;
  return cachedRaw;
}

/**
 * Shim API-compatible @upstash/redis (subset utilise par ce repo).
 * Backend ioredis self-hosted.
 */
class RedisShim {
  async get<T = unknown>(key: string): Promise<T | null> {
    const v = await getRaw().get(key);
    if (v === null) return null;
    try {
      return JSON.parse(v) as T;
    } catch {
      return v as unknown as T;
    }
  }
  async set(
    key: string,
    value: unknown,
    opts?: { ex?: number; px?: number; nx?: boolean },
  ): Promise<"OK" | null> {
    const payload = typeof value === "string" ? value : JSON.stringify(value);
    const io = getRaw();
    if (opts?.nx && opts?.ex !== undefined) {
      return io.set(key, payload, "EX", opts.ex, "NX") as Promise<"OK" | null>;
    }
    if (opts?.nx && opts?.px !== undefined) {
      return io.set(key, payload, "PX", opts.px, "NX") as Promise<"OK" | null>;
    }
    if (opts?.nx) {
      return io.set(key, payload, "NX") as Promise<"OK" | null>;
    }
    if (opts?.ex !== undefined) {
      return io.set(key, payload, "EX", opts.ex);
    }
    if (opts?.px !== undefined) {
      return io.set(key, payload, "PX", opts.px);
    }
    return io.set(key, payload);
  }
  async del(...keys: string[]): Promise<number> {
    if (!keys.length) return 0;
    return getRaw().del(...keys);
  }
  async incr(key: string): Promise<number> {
    return getRaw().incr(key);
  }
  async expire(key: string, seconds: number): Promise<number> {
    return getRaw().expire(key, seconds);
  }
  async exists(...keys: string[]): Promise<number> {
    if (!keys.length) return 0;
    return getRaw().exists(...keys);
  }
}

let cachedShim: RedisShim | undefined;

export function redis(): RedisShim {
  if (cachedShim) return cachedShim;
  cachedShim = new RedisShim();
  return cachedShim;
}
