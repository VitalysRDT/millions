"use client";

import { useEffect, useState } from "react";

/** Returns seconds remaining until the deadline (server-authoritative). */
export function useCountdown(deadlineAt: number | undefined): number {
  const [remaining, setRemaining] = useState<number>(() =>
    deadlineAt ? Math.max(0, Math.ceil((deadlineAt - Date.now()) / 1000)) : 0,
  );
  useEffect(() => {
    if (!deadlineAt) return;
    const tick = () => {
      const left = Math.max(0, Math.ceil((deadlineAt - Date.now()) / 1000));
      setRemaining(left);
    };
    tick();
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [deadlineAt]);
  return remaining;
}
