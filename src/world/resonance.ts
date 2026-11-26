/** Data for the procedural resonance renderer. No frames are stored. */

export interface ResonanceSpec {
  id: string;
  rings: number;
  periodMs: number;
  color: string;
  maxRadius: number;
  meaning: string;
}

export const DISTRICT_RESONANCE: ResonanceSpec = {
  id: 'district-01-plaza',
  rings: 3,
  periodMs: 4200,
  color: '#d29a3a',
  maxRadius: 18,
  meaning: 'An unexplained pulse in the square. It is not on any posted notice.',
};

export const ringRadius = (spec: ResonanceSpec, index: number, elapsedMs: number): number => {
  const shift = (elapsedMs % spec.periodMs) / spec.periodMs;
  const base = ((index + 1) / spec.rings) * spec.maxRadius;
  return base * (0.82 + 0.18 * shift);
};
