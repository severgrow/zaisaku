import type { SymbolId } from '../../../src/world/types.js';

/** Geometric marks. No Earth lettering. Pixel stamps in the world use the same shapes at tile scale. */

const PATHS: Record<SymbolId, string> = {
  exchange: 'M3 8h10M8 3v10',
  storage: 'M3 5h10v8H3zM3 8h10',
  research: 'M8 3v10M4 7h8',
  transit: 'M3 8h10M9 4l4 4-4 4',
  resonance: 'M8 8m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0M8 3v2M8 11v2M3 8h2M11 8h2',
  residence: 'M3 7l5-4 5 4v6H3z',
  auction: 'M4 12l4-8 4 8M6 10h4',
  manufacturing: 'M3 4h4v4H3zM9 8h4v4H9z',
  cultivation: 'M8 13V7M8 7c2-3 5-2 5 1M8 9c-3-1-4 2-2 3',
  contract: 'M4 3h6l3 3v7H4z',
};

export const symbol = (id: SymbolId): string =>
  `<svg class="mark" viewBox="0 0 16 16" aria-hidden="true"><path d="${PATHS[id]}" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>`;
