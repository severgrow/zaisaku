/** Pack 04 connector names. Presentation only. File suffixes follow manifest.json, including wn / swn / wne. */

export type Dir = 'n' | 'e' | 's' | 'w';
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

/** Door and window frames exist only for an east-west run. The pack has no north-south opening. */
export const openingFile = (kind: 'door' | 'window', dirs: readonly Dir[]): string | null => {
  if (joinDirs(dirs) !== 'ew') return null;
  return kind === 'door' ? 'door-frame-open.png' : 'window-open.png';
};

/** One straight transition when exactly one side meets the other material. Corners stay the plain floor. */
export const floorKey = (here: FloorMaterial, neighbors: Partial<Record<Dir, FloorMaterial | null>>): string => {
  if (here === 'bone-ceramic') {
    const sides = DIRS.filter((dir) => neighbors[dir] === 'mineral-paving');
    if (sides.length === 1) return `bone-ceramic-to-mineral-paving-${sides[0]}`;
  }
  if (here === 'mineral-paving') {
    const sides = DIRS.filter((dir) => neighbors[dir] === 'soil');
    if (sides.length === 1) return `mineral-paving-to-soil-${sides[0]}`;
  }
  return `floor-${here}`;
};
