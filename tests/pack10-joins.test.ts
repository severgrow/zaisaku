import { describe, expect, it } from 'vitest';
import { floorKey, floorMaterial, pavingToPath, pavingToPathKeys } from '../src/world/connectors.js';
import { TILE } from '../src/world/tiles.js';

describe('Pack 10 world joins', () => {
  it('selects all four approved single-sided transitions', () => {
    for (const direction of ['n', 'e', 's', 'w'] as const) {
      expect(pavingToPath({ [direction]: 'resonance-path' })).toBe(`paving-to-path-${direction}`);
    }
  });

  it('joins adjacent path sides but keeps unsupported opposite and three-way joins plain', () => {
    expect(pavingToPath({ n: 'resonance-path', e: 'resonance-path' })).toBe('paving-to-path-outer-ne');
    expect(pavingToPath({ e: 'resonance-path', s: 'resonance-path' })).toBe('paving-to-path-outer-es');
    expect(pavingToPath({ n: 'resonance-path', s: 'resonance-path' })).toBeNull();
    expect(pavingToPath({ n: 'resonance-path', e: 'resonance-path', w: 'resonance-path' })).toBeNull();
  });

  it('uses the same eight named keys as the runtime PNG registry', () => {
    expect(pavingToPathKeys()).toHaveLength(8);
    expect(new Set(pavingToPathKeys()).size).toBe(8);
    expect(floorKey('mineral-paving', { w: 'resonance-path' })).toBe('paving-to-path-w');
    expect(floorKey('mineral-paving', { n: 'mineral-paving' })).toBe('floor-mineral-paving');
  });

  it('keeps the residence on its own inlay without changing outside floor material', () => {
    expect(floorMaterial('residence', TILE.ground)).toBe('residence-inlay');
    expect(floorKey('residence-inlay', {})).toBe('floor-residence-inlay');
    expect(floorMaterial('district-01', TILE.ground)).toBe('mineral-paving');
  });
});
