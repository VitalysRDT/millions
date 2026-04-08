"use client";

import { useRef } from "react";
import { nanoid } from "nanoid";

/** Generates a fresh idempotency key per "round" via reset(). */
export function useIdemKey() {
  const ref = useRef<string>(nanoid());
  const reset = () => {
    ref.current = nanoid();
  };
  return { key: ref.current, reset, get: () => ref.current };
}
