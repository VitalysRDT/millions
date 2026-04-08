type Level = "debug" | "info" | "warn" | "error";

function fmt(level: Level, msg: string, data?: Record<string, unknown>): void {
  const ts = new Date().toISOString();
  const line = `[${ts}] ${level.toUpperCase()} ${msg}`;
  if (level === "error") console.error(line, data ?? "");
  else if (level === "warn") console.warn(line, data ?? "");
  else console.log(line, data ?? "");
}

export const log = {
  debug: (m: string, d?: Record<string, unknown>) => fmt("debug", m, d),
  info: (m: string, d?: Record<string, unknown>) => fmt("info", m, d),
  warn: (m: string, d?: Record<string, unknown>) => fmt("warn", m, d),
  error: (m: string, d?: Record<string, unknown>) => fmt("error", m, d),
};
