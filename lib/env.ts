import { z } from "zod";

const EnvSchema = z.object({
  DATABASE_URL: z.string().url(),
  UPSTASH_REDIS_REST_URL: z.string().url(),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(8),
  SESSION_SECRET: z.string().min(32, "SESSION_SECRET must be >= 32 chars"),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
});

export type Env = z.infer<typeof EnvSchema>;

let cached: Env | undefined;

export function env(): Env {
  if (cached) return cached;
  const parsed = EnvSchema.safeParse(process.env);
  if (!parsed.success) {
    console.error("[env] invalid environment", parsed.error.format());
    throw new Error("Invalid environment variables — check your .env");
  }
  cached = parsed.data;
  return cached;
}
