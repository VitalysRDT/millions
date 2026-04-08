import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { log } from "@/lib/utils/log";
import { UnauthorizedError } from "@/lib/auth/session";

export function ok<T>(data: T, init?: ResponseInit): NextResponse {
  return NextResponse.json(data, init);
}

export function fail(status: number, error: string): NextResponse {
  return NextResponse.json({ error }, { status });
}

export async function apiHandler<T>(fn: () => Promise<T>): Promise<NextResponse> {
  try {
    const result = await fn();
    if (result instanceof NextResponse) return result;
    return ok(result);
  } catch (e) {
    if (e instanceof UnauthorizedError) return fail(401, "unauthorized");
    if (e instanceof ZodError) {
      return fail(400, "invalid_input: " + JSON.stringify(e.issues));
    }
    if (e instanceof ApiError) return fail(e.status, e.message);
    log.error("api_error", { error: String(e) });
    return fail(500, "internal_error");
  }
}

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}
