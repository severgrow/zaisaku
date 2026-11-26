import { TILE } from './tiles.js';
import type { Facing } from './types.js';

/** A cell a later navigator can path around. Current movement reads the same cells from the solid map. */

export interface Cell {
  tx: number;
  ty: number;
}

export type FixtureRole = 'furniture' | 'street' | 'terminal' | 'threshold' | 'auction' | 'ground';

export interface Fixture {
  id: string;
  file: string;
  tx: number;
  ty: number;
  w: number;
  h: number;
  footprint: readonly Cell[];
  approach: Cell | null;
  occludes?: boolean;
  light?: { x: number; y: number; radius: number };
  role: FixtureRole;
}

export interface Entrance {
  facing: Facing;
  doorTx: number;
  doorTy: number;
  frontTx: number;
  frontTy: number;
}

const cell = (tx: number, ty: number): Cell => ({ tx, ty });

const STEP: Record<Facing, Cell> = {
  n: { tx: 0, ty: -1 },
  e: { tx: 1, ty: 0 },
  s: { tx: 0, ty: 1 },
  w: { tx: -1, ty: 0 },
};

const piece = (
  id: string,
  file: string,
  tx: number,
  ty: number,
  approach: Cell | null,
  role: FixtureRole,
  finish: Partial<Pick<Fixture, 'w' | 'h' | 'footprint' | 'occludes' | 'light'>> = {},
): Fixture => ({
  id, file, tx, ty, approach, role,
  w: 32,
  h: 32,
  footprint: [cell(tx, ty)],
  ...finish,
});

/**
 * The step beyond an entrance, and only when that step is already the resonance path.
 * The approach follows the entrance orientation and remains walkable.
 */
export const thresholdFor = (tiles: readonly (readonly number[])[], entrance: Entrance): Fixture | null => {
  const step = STEP[entrance.facing];
  const tx = entrance.frontTx + step.tx;
  const ty = entrance.frontTy + step.ty;
  if (tiles[ty]?.[tx] !== TILE.path) return null;
  return {
    id: `threshold-${entrance.facing}`,
    file: `threshold-${entrance.facing}`,
    tx,
    ty,
    w: 32,
    h: 32,
    footprint: [],
    approach: null,
    role: 'threshold',
  };
};

export const districtFixtures = (
  tiles: readonly (readonly number[])[],
  entrances: { exchange: Entrance; research: Entrance; duel: Entrance; auction: Entrance; home: Entrance },
): Fixture[] => {
  const south = (tx: number, ty: number): Cell => cell(tx, ty + 1);
  const fixtures: Fixture[] = [
    // Exchange deliveries, set at one end of the frontage with the scale beside the parcels.
    piece('exchange-crate-large', 'crate-large', 3, 7, south(3, 7), 'street'),
    piece('exchange-parcel', 'wrapped-parcel', 4, 7, south(4, 7), 'street', { w: 22, h: 22 }),
    piece('exchange-scale', 'scale', 5, 7, south(5, 7), 'street', { w: 25, h: 25 }),
    piece('ivo-counter', 'exchange-counter', 9.5, 7, south(9, 7), 'street', { w: 60, h: 30, footprint: [cell(9, 7), cell(10, 7)] }),
    piece('stall', 'market-stall', 13, 13, south(13, 13), 'street', { footprint: [], w: 48, h: 43 }),
    piece('stall-crate', 'crate-small', 12, 13, cell(12, 14), 'street', { w: 22, h: 22 }),
    // The research service counter and sample rack share a single work area.
    piece('research-counter', 'work-bench', 22, 7, south(22, 7), 'street', { w: 38, h: 38 }),
    piece('research-rack', 'research-rack', 21, 7, south(21, 7), 'street', { w: 25, h: 25 }),
    piece('research-paper-rack', 'paper-rack', 23, 7, south(23, 7), 'street', { w: 23, h: 23 }),
    piece('auction-stand', 'auction-stand', 22, 13, cell(22, 14), 'auction'),
    piece('duel-terminal', 'duel-door-terminal', entrances.duel.doorTx, entrances.duel.doorTy,
      cell(entrances.duel.frontTx, entrances.duel.frontTy), 'terminal', { footprint: [] }),
    // Small gathering places at the edge of the crossing. Their trunks and seats use explicit footprints.
    piece('notice-board', 'notice-board', 12, 10, south(12, 10), 'street', { w: 44, h: 44, occludes: true }),
    piece('plaza-bench', 'plaza-bench', 20.5, 11, south(20, 11), 'street', { w: 58, h: 29, footprint: [cell(20, 11), cell(21, 11)] }),
    piece('plaza-tree', 'disc-tree', 21, 10, cell(21, 9), 'street', { w: 63, h: 72, occludes: true }),
    piece('median-tree', 'disc-tree', 16, 4, cell(16, 3), 'street', { w: 69, h: 79, occludes: true }),
    piece('median-bench', 'plaza-bench', 16, 6, cell(16, 7), 'street', { w: 55, h: 28 }),
    piece('median-native-planter', 'veinflora-planter', 14, 5, cell(14, 6), 'street', { w: 31, h: 28 }),
    piece('west-tree', 'disc-tree', 4, 18, cell(4, 17), 'street', { w: 56, h: 64, occludes: true }),
    piece('east-tree', 'disc-tree', 27, 18, cell(27, 17), 'street', { w: 49, h: 56, occludes: true }),
    piece('west-planter', 'veinflora-planter', 10, 11, south(10, 11), 'street', { w: 42, h: 38 }),
    piece('east-planter', 'veinflora-planter', 22, 10, south(22, 10), 'street', { w: 36, h: 33 }),
    piece('plaza-lantern', 'lantern-plant', 18, 14, cell(18, 15), 'street', { w: 24, h: 48, light: { x: -3, y: -19, radius: 24 } }),
    piece('south-lantern', 'lantern-plant', 19, 17, cell(19, 16), 'street', { w: 22, h: 44, light: { x: -3, y: -17, radius: 23 } }),
    piece('plaza-inlay', 'resonance-mark', 16, 12, null, 'ground', { footprint: [], w: 66, h: 59 }),
    piece('plaza-instrument', 'sera-instrument', 16, 12, south(16, 12), 'street', { w: 49, h: 49, light: { x: 0, y: -15, radius: 31 } }),
  ];
  for (const entrance of [entrances.exchange, entrances.research, entrances.duel, entrances.auction, entrances.home]) {
    const laid = thresholdFor(tiles, entrance);
    if (laid) fixtures.push(laid);
  }
  return fixtures;
};

/** The alcove shares the rest actor's cell. The terminal and bench use their existing actor collision. */
export const residenceFixtures = (): Fixture[] => [
  piece('bed', 'sleeping-alcove', 2, 2, cell(2, 3), 'furniture', { w: 61, h: 52, occludes: true }),
  piece('bedside-cabinet', 'bedside-cabinet', 4, 2, cell(4, 3), 'furniture'),
  piece('chair', 'chair', 5, 3, cell(6, 3), 'furniture', { w: 28, h: 28 }),
  piece('low-table', 'low-table', 4, 4, cell(4, 5), 'furniture', { w: 38, h: 38 }),
  piece('terminal', 'domestic-terminal', 3, 6, cell(3, 7), 'furniture', { w: 54, h: 43, footprint: [], occludes: true }),
  piece('bench', 'work-bench', 11, 6, cell(11, 7), 'furniture', { w: 42, h: 42, footprint: [] }),
  piece('paper-rack', 'paper-rack', 12, 6, cell(12, 7), 'furniture', { w: 28, h: 28 }),
  piece('standing-lamp', 'standing-lamp', 6, 2, cell(6, 3), 'furniture', { light: { x: 0, y: -20, radius: 46 } }),
  piece('sleep-wall-lamp', 'wall-lamp', 3, 1, null, 'furniture', { footprint: [], w: 20, h: 24, light: { x: -2, y: -12, radius: 37 } }),
  piece('display-wall-lamp', 'wall-lamp', 10, 1, null, 'furniture', { footprint: [], w: 20, h: 24, light: { x: -2, y: -12, radius: 40 } }),
];

export const blockFixtures = (solid: boolean[][], fixtures: readonly Fixture[]): void => {
  for (const fixture of fixtures) {
    for (const foot of fixture.footprint) {
      const row = solid[foot.ty];
      if (row && foot.tx >= 0 && foot.tx < row.length) row[foot.tx] = true;
    }
  }
};
