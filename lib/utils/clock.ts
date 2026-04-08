export const nowMs = (): number => Date.now();
export const deadlineFromNow = (ms: number): number => Date.now() + ms;
export const msUntil = (deadline: number): number => Math.max(0, deadline - Date.now());
export const isExpired = (deadline: number, toleranceMs = 0): boolean =>
  Date.now() > deadline + toleranceMs;
