/** Pack 04 and Pack 07 connector names. Presentation only. File suffixes follow the manifests, including wn / swn / wne. */

import { TILE } from './tiles.js';

export type Dir = 'n' | 'e' | 's' | 'w';
export type Corner = 'ne' | 'es' | 'sw' | 'nw';
export type FloorMaterial = 'mineral-paving' | 'bone-ceramic' | 'resonance-path' | 'interior-floor' | 'industrial-metal' | 'soil';
export type PieceFamily = 'wall' | 'roof' | 'rail';

export const DIRS: readonly Dir[] = ['n', 'e', 's', 'w'];

const STEP: Record<Dir, { x: number; y: number }> = {
  n: { x: 0, y: -1 },
  e: { x: 1, y: 0 },
  s: { x: 0, y: 1 },
  w: { x: -1, y: 0 },
};

const CORNER_FILE: Record<string, string> = { ne: 'ne', es: 'es', sw: 'sw', nw: 'wn' };
const T_FILE: Record<string, string> = { nes: 'nes', esw: 'esw', nsw: 'swn', new: 'wne' };
const DIAGONAL: Record<string, { x: number; y: number }> = {
  ne: { x: 1, y: -1 },
  es: { x: 1, y: 1 },
  sw: { x: -1, y: 1 },
  nw: { x: -1, y: -1 },
};

export const DIAGONALS: readonly { corner: Corner; x: number; y: number }[] = [
  { corner: 'ne', x: 1, y: -1 },
  { corner: 'es', x: 1, y: 1 },
  { corner: 'sw', x: -1, y: 1 },
  { corner: 'nw', x: -1, y: -1 },
];

const PAIR_FILE: Record<string, string> = { ne: 'ne', es: 'es', sw: 'sw', nw: 'wn' };
const CERAMIC_TARGETS = ['mineral-paving', 'resonance-path'] as const;

export const joinDirs = (dirs: readonly Dir[]): string => DIRS.filter((dir) => dirs.includes(dir)).join('');

export const stepOf = (dir: Dir): { x: number; y: number } => STEP[dir];

/** The diagonal inside a two-direction corner. Null unless the mask is exactly a corner. */
export const cornerDiagonal = (dirs: readonly Dir[]): { x: number; y: number } | null => DIAGONAL[joinDirs(dirs)] ?? null;

export const pieceFile = (family: PieceFamily, dirs: readonly Dir[], corner: 'inner' | 'outer'): string | null => {
  const key = joinDirs(dirs);
  if (key === 'ew' || key === 'ns') return `${family}-straight-${key}.png`;
  if (key.length === 1) return `${family}-end-${key}.png`;
  const cornerFile = CORNER_FILE[key];
  if (cornerFile) {
    if (family === 'wall') return `wall-${corner}-${cornerFile}.png`;
    return `${family}-corner-${cornerFile}.png`;
  }
  const tee = T_FILE[key];
  if (tee) {
    if (family === 'roof') return dirs.includes('e') && dirs.includes('w') ? 'roof-straight-ew.png' : 'roof-straight-ns.png';
    return `${family}-t-${tee}.png`;
  }
  if (key === 'nesw') return family === 'roof' ? 'roof-straight-ew.png' : `${family}-cross.png`;
  return null;
};

/**
 * East-west runs keep the Pack 04 frames. North-south runs use the Pack 07 east or west opening.
 * Facing is the side that opens onto the street. There is no rotated south sprite for that run.
 */
export const openingFile = (kind: 'door' | 'window', dirs: readonly Dir[], facing?: 'e' | 'w'): string | null => {
  const key = joinDirs(dirs);
  if (key === 'ew') return kind === 'door' ? 'door-frame-open.png' : 'window-open.png';
  if (key === 'ns' && (facing === 'e' || facing === 'w')) {
    return kind === 'door' ? `door-frame-open-${facing}.png` : `window-frame-open-${facing}.png`;
  }
  return null;
};

/** The extended roof and its wall cap are one pair. Corners stay on the Pack 04 profiles. */
export const eaveFiles = (dirs: readonly Dir[], southIsRoof: boolean): { roof: string | null; bridge: boolean } => {
  const roof = pieceFile('roof', dirs, 'outer');
  if (roof === 'roof-straight-ew.png' && !southIsRoof) return { roof: 'roof-straight-ew-bottom.png', bridge: true };
  return { roof, bridge: false };
};

/** Glass case is 128px. The owned plate sits on the shelf line, under the front rails. */
export const GLASS_CASE_PX = 64;

export const glassItemOffset = (caseSize: number): { x: number; y: number; size: number } => {
  const scale = caseSize / 128;
  return { x: 0, y: (92 - 128) * scale, size: Math.max(1, Math.round(40 * scale)) };
};

export const floorMaterial = (locationId: string, tile: number | null): FloorMaterial | null => {
  if (tile === null) return null;
  if (locationId === 'residence') return 'bone-ceramic';
  if (tile === TILE.path) return 'resonance-path';
  if (tile === TILE.roof || tile === TILE.interior || tile === TILE.door || tile === TILE.window || tile === TILE.pipe || tile === TILE.vent) {
    return 'bone-ceramic';
  }
  return 'mineral-paving';
};

const cornerFile = (sides: readonly Dir[]): string | null => {
  if (sides.length !== 2) return null;
  const key = DIRS.filter((dir) => sides.includes(dir)).join('');
  return PAIR_FILE[key] ?? null;
};

/** Straights, outer corners, and inner notches. A mixed or three-side cell keeps the plain floor. */
export const ceramicTransition = (
  neighbors: Partial<Record<Dir, FloorMaterial | null>>,
  diagonals: Partial<Record<Corner, FloorMaterial | null>> = {},
): string | null => {
  for (const target of CERAMIC_TARGETS) {
    const other = DIRS.some((dir) => {
      const material = neighbors[dir];
      return material != null && material !== 'bone-ceramic' && material !== target;
    });
    if (other) continue;
    const sides = DIRS.filter((dir) => neighbors[dir] === target);
    const side = sides[0];
    if (sides.length === 1 && side) return `bone-ceramic-to-${target}-${side}`;
    if (sides.length === 2) {
      const name = cornerFile(sides);
      return name ? `bone-ceramic-to-${target}-outer-${name}` : null;
    }
    if (sides.length > 2) return null;
  }
  const foreign = DIRS.some((dir) => {
    const material = neighbors[dir];
    return material != null && material !== 'bone-ceramic';
  });
  if (foreign) return null;
  const notches: string[] = [];
  for (const target of CERAMIC_TARGETS) {
    for (const { corner } of DIAGONALS) {
      if (diagonals[corner] !== target) continue;
      notches.push(`bone-ceramic-to-${target}-inner-${PAIR_FILE[corner]}`);
    }
  }
  return notches.length === 1 ? notches[0]! : null;
};

export const ceramicTransitionKeys = (): string[] => {
  const keys: string[] = [];
  for (const target of CERAMIC_TARGETS) {
    for (const side of DIRS) keys.push(`bone-ceramic-to-${target}-${side}`);
    for (const form of ['outer', 'inner'] as const) {
      for (const pair of ['ne', 'es', 'sw', 'wn']) keys.push(`bone-ceramic-to-${target}-${form}-${pair}`);
    }
  }
  return keys;
};

export const floorKey = (
  here: FloorMaterial,
  neighbors: Partial<Record<Dir, FloorMaterial | null>>,
  diagonals: Partial<Record<Corner, FloorMaterial | null>> = {},
): string => {
  if (here === 'bone-ceramic') return ceramicTransition(neighbors, diagonals) ?? `floor-${here}`;
  if (here === 'mineral-paving') {
    const sides = DIRS.filter((dir) => neighbors[dir] === 'soil');
    if (sides.length === 1) return `mineral-paving-to-soil-${sides[0]}`;
  }
  return `floor-${here}`;
};
