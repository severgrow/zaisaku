import type { Facing, WorldState } from './types.js';
import { feetOf } from './movement.js';

/** District 01 gate. The map builder uses the same tile. */
export const GATE = { tx: 16, ty: 16, facing: 'n' as Facing };

export const defaultWorld = (): WorldState => {
  const feet = feetOf(GATE.tx, GATE.ty);
  return {
    locationId: 'district-01',
    x: feet.x,
    y: feet.y,
    facing: GATE.facing,
    displays: { 'shelf-a': null, 'shelf-b': null },
    discovered: ['district-01'],
    flags: {},
  };
};

export const reconcileDisplays = (displays: Readonly<Record<string, string | null>>, ownedIds: readonly string[]): Record<string, string | null> => {
  const owned = new Set(ownedIds);
  const next: Record<string, string | null> = {};
  for (const [slot, id] of Object.entries(displays)) next[slot] = id && owned.has(id) ? id : null;
  return next;
};

export const markFlag = (world: WorldState, flag: string): WorldState => ({
  ...world,
  flags: { ...world.flags, [flag]: true },
});
