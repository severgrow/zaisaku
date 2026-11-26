// Seeded PRNG. Adapted from the SeverGrow engine's mulberry32 and unbiased integers.
// This is the only source of randomness in the Zaisaku rules.

export type Rng = {
  /** Float in [0, 1). */
  next: () => number;
  /** Uniform integer in [0, n). */
  int: (n: number) => number;
  /** Internal mulberry32 state, so a match can be resumed without replaying draws. */
  state: () => number;
};

const TWO32 = 4294967296;

/** Canonical mulberry32. Seeds are taken modulo 2^32. */
export const mulberry32 = (seed: number): Rng => {
  let a = seed >>> 0;
  const next = (): number => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / TWO32;
  };
  return {
    next,
    int: (n: number) => randomInt(next, n),
    state: () => a,
  };
};

/**
 * An exactly uniform integer in [0, n) (Lemire's multiply-and-reject).
 * `range` is 2^32 for the engine; tests may pass a smaller range.
 */
export const boundedInt = (next: () => number, n: number, range = TWO32): number => {
  if (!Number.isInteger(n) || n < 1 || n > 2 ** 21) throw new RangeError(`randomInt: invalid n ${n}`);
  const threshold = (range - n) % n;
  for (;;) {
    const x = next();
    if (x < 0) return -1;
    const m = x * n;
    if (m % range >= threshold) return Math.floor(m / range);
  }
};

export const randomInt = (rng: () => number, n: number): number => boundedInt(() => rng() * TWO32, n);

/** Fisher-Yates shuffle. Returns a new array. */
export const shuffle = <T>(items: readonly T[], rng: Rng): T[] => {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = rng.int(i + 1);
    const tmp = out[i]!;
    out[i] = out[j]!;
    out[j] = tmp;
  }
  return out;
};

/** Independent stream seed (murmur3 fmix32 finaliser). */
export const deriveSeed = (seed: number, stream: number): number => {
  let h = ((seed >>> 0) ^ Math.imul(stream >>> 0, 0x9e3779b9)) >>> 0;
  h = Math.imul(h ^ (h >>> 16), 0x85ebca6b);
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35);
  return (h ^ (h >>> 16)) >>> 0;
};

export const hashString = (s: string): number => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
};
