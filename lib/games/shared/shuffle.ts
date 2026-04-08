/** Cryptographic Fisher-Yates shuffle (returns a NEW array). Uses Web Crypto, works in Node + browser. */
export function shuffle<T>(arr: readonly T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = secureRandomInt(i + 1);
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
}

export function shuffleIndices(n: number): number[] {
  return shuffle(Array.from({ length: n }, (_, i) => i));
}

function secureRandomInt(max: number): number {
  // Returns int in [0, max).
  const buf = new Uint32Array(1);
  globalThis.crypto.getRandomValues(buf);
  return buf[0]! % max;
}
