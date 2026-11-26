import { DEFINITIONS } from '../engine/definitions.js';

/** One identity per object. Pixel keys stay unique so a later PNG can replace a shared temporary plate. */

export interface ArtworkLink {
  definitionId: string;
  svgRef: string;
  pixelKey: string;
  /** Runtime plate, or null when the SVG plate is still the picture. */
  plateFile: string | null;
  status: 'temporary' | 'approved';
}

/** Pack 04's sixteen plates plus Pack 07's twenty. Filenames are the existing definition ids. */
const PLATES = new Set([
  'bone-dice',
  'spare-key',
  'late-bell',
  'second-mouth',
  'station-pendulum',
  'green-filter',
  'eclipse-monocle',
  'prism-ticket',
  'paper-charm',
  'counterfeit-seal',
  'travellers-weight',
  'cracked-saucer',
  'blue-fault',
  'closed-city',
  'twin-left',
  'twin-right',
  'tomorrow-receiver',
  'dream-receiver',
  'null-magnet',
  'silent-telephone',
  'wire-hymnal',
  'pocket-static',
  'red-coil',
  'moon-clock',
  'amber-hourglass',
  'saltwater-watch',
  'memory-lens',
  'dust-telescope',
  'catalogue-eye',
  'orchid-vessel',
  'kiln-ghost',
  'tea-for-nobody',
  'white-jar',
  'red-box',
  'glass-saint',
  'mute-candle',
]);

export const ARTWORK: readonly ArtworkLink[] = DEFINITIONS.map((def) => ({
  definitionId: def.id,
  svgRef: def.artworkRef,
  pixelKey: `item-${def.id}`,
  plateFile: PLATES.has(def.id) ? `catalogue/item-${def.id}.png` : null,
  status: 'temporary' as const,
}));
