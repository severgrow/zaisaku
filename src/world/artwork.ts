import { DEFINITIONS } from '../engine/definitions.js';

/** One identity per object. Pixel keys stay unique so a later PNG can replace a shared temporary plate. */

export interface ArtworkLink {
  definitionId: string;
  svgRef: string;
  pixelKey: string;
  status: 'temporary' | 'approved';
}

export const ARTWORK: readonly ArtworkLink[] = DEFINITIONS.map((def) => ({
  definitionId: def.id,
  svgRef: def.artworkRef,
  pixelKey: `item-${def.id}`,
  status: 'temporary' as const,
}));
