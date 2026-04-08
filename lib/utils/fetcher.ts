export async function fetcher<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const res = await fetch(input, {
    credentials: "same-origin",
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  if (res.status === 304) {
    // Not modified — caller should handle, but we throw a sentinel
    const err = new Error("not_modified") as Error & { status: number };
    (err as Error & { status: number }).status = 304;
    throw err;
  }
  if (!res.ok) {
    let message = `HTTP ${res.status}`;
    try {
      const body = (await res.json()) as { error?: string; message?: string };
      message = body.error ?? body.message ?? message;
    } catch {}
    const err = new Error(message) as Error & { status: number };
    err.status = res.status;
    throw err;
  }
  return (await res.json()) as T;
}

export async function postJson<T>(url: string, body: unknown): Promise<T> {
  return fetcher<T>(url, {
    method: "POST",
    body: JSON.stringify(body),
  });
}
