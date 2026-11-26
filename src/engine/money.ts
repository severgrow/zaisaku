export const clamp = (n: number, lo: number, hi: number): number => Math.max(lo, Math.min(hi, n));

/** Floor of value × basis / 10_000. */
export const mulBps = (value: number, bps: number): number => Math.floor((value * bps) / 10_000);

/** Ceil of value × basis / 10_000. */
export const mulBpsCeil = (value: number, bps: number): number => Math.ceil((value * bps) / 10_000);

/** High supply lowers price. 10_000 is neutral. */
export const supplyToPriceBps = (supplyBps: number): number => clamp(20_000 - supplyBps, 5_000, 16_000);

export const isInt = (n: number): boolean => Number.isInteger(n);

export const stateNum = (state: Readonly<Record<string, number | string | boolean>>, key: string): number => {
  const v = state[key];
  return typeof v === 'number' && Number.isFinite(v) ? v : 0;
};

export const stateBool = (state: Readonly<Record<string, number | string | boolean>>, key: string): boolean =>
  state[key] === true;
