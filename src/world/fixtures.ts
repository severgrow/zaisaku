import { TILE } from './tiles.js';
import type { Facing } from './types.js';

/** A cell a later navigator can path around. Current movement reads the same cells from the solid map. */

export interface Cell {
  tx: number;
  ty: number;
}

export type FixtureRole = 'furniture' | 'street' | 'terminal' | 'foreground' | 'threshold' | 'auction';

export interface Fixture {
  id: string;
  file: string;
  tx: number;
  ty: number;
  w: number;
  h: number;
  footprint: readonly Cell[];
  approach: Cell | null;
  foreground: boolean;
  cover: readonly Cell[];
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
  approach: Cell,
  role: FixtureRole,
): Fixture => ({
  id,
  file,
  tx,
  ty,
  w: 32,
  h: 32,
  footprint: [cell(tx, ty)],
  approach,
  foreground: false,
  cover: [],
  role,
});

const overhang = (id: string, file: string, tx: number, ty: number, cover: readonly Cell[]): Fixture => ({
  id,
  file,
  tx,
  ty,
  w: 96,
  h: 32,
  footprint: [],
  approach: null,
  foreground: true,
  cover,
  role: 'foreground',
});

/**
 * The step beyond an entrance, and only when that step is already the resonance path.
 * East and west doors on District 01 do not meet the path, so those variants stay unused.
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
    foreground: false,
    cover: [],
    role: 'threshold',
  };
};

export const districtFixtures = (
  tiles: readonly (readonly number[])[],
  entrances: { exchange: Entrance; research: Entrance; duel: Entrance; auction: Entrance; home: Entrance },
): Fixture[] => {
  const south = (tx: number, ty: number): Cell => cell(tx, ty + 1);
  const fixtures: Fixture[] = [
    piece('exchange-crate-large', 'crate-large', 4, 7, south(4, 7), 'street'),
    piece('exchange-crate-small', 'crate-small', 3, 7, south(3, 7), 'street'),
    piece('exchange-parcel', 'wrapped-parcel', 5, 7, south(5, 7), 'street'),
    piece('exchange-scale', 'scale', 10, 7, south(10, 7), 'street'),
    piece('ivo-counter', 'customer-counter', 9, 7, south(9, 7), 'street'),
    piece('stall-crate', 'crate-small', 12, 13, cell(12, 14), 'street'),
    piece('research-rack', 'research-rack', 21, 7, south(21, 7), 'street'),
    piece('research-flask', 'research-flask', 22, 7, south(22, 7), 'street'),
    piece('research-jar', 'research-jar', 23, 7, south(23, 7), 'street'),
    piece('research-tray', 'research-tray', 24, 7, south(24, 7), 'street'),
    piece('research-vial', 'research-vial', 28, 7, south(28, 7), 'street'),
    piece('research-crystal', 'research-crystal-flask', 29, 7, south(29, 7), 'street'),
    piece('auction-stand', 'auction-stand', 22, 13, cell(22, 14), 'auction'),
    {
      id: 'duel-terminal',
      file: 'duel-door-terminal',
      tx: entrances.duel.doorTx,
      ty: entrances.duel.doorTy,
      w: 32,
      h: 32,
      footprint: [],
      approach: cell(entrances.duel.frontTx, entrances.duel.frontTy),
      foreground: false,
      cover: [],
      role: 'terminal',
    },
    overhang('duel-eave', 'roof-eave', 4, 15, [cell(3, 15), cell(4, 15), cell(5, 15)]),
    overhang('tree-canopy-west', 'tree-canopy', 4, 17, [cell(3, 17), cell(4, 17), cell(5, 17)]),
    overhang('tree-canopy-east', 'tree-canopy', 27, 17, [cell(26, 17), cell(27, 17), cell(28, 17)]),
  ];
  for (const entrance of [entrances.exchange, entrances.research, entrances.duel, entrances.auction, entrances.home]) {
    const laid = thresholdFor(tiles, entrance);
    if (laid) fixtures.push(laid);
  }
  return fixtures;
};

/** Chair, table, pallet and lamp. The pallet shares its cell with the existing rest actor. */
export const residenceFixtures = (): Fixture[] => [
  piece('pallet', 'sleeping-pallet', 2, 2, cell(2, 3), 'furniture'),
  piece('chair', 'chair', 4, 2, cell(4, 3), 'furniture'),
  piece('low-table', 'low-table', 3, 4, cell(3, 5), 'furniture'),
  piece('standing-lamp', 'standing-lamp', 8, 1, cell(8, 2), 'furniture'),
];

export const blockFixtures = (solid: boolean[][], fixtures: readonly Fixture[]): void => {
  for (const fixture of fixtures) {
    for (const foot of fixture.footprint) {
      const row = solid[foot.ty];
      if (row && foot.tx >= 0 && foot.tx < row.length) row[foot.tx] = true;
    }
  }
};
