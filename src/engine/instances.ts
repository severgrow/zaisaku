import type { Rng } from './prng.js';
import type { ItemDefinition, ItemInstance } from './types.js';

export const instantiate = (def: ItemDefinition, rng: Rng, id: string, owner: string | null, at: number): ItemInstance => {
  const [lo, hi] = def.conditionRange;
  const span = hi - lo + 1;
  const condition = lo + (span <= 1 ? 0 : rng.int(span));
  const chance = def.tags.includes('often-counterfeit') ? 45 : 8;
  const authenticity = rng.int(100) < chance ? 'counterfeit' : 'genuine';
  return {
    id,
    definitionId: def.id,
    ownerId: owner,
    condition,
    authenticity,
    acquiredAt: at,
    acquisitionPrice: 0,
    status: owner ? 'held' : 'listed',
    revealedProps: [],
    serial: `Z-${def.id.slice(0, 4).toUpperCase()}-${id.slice(-4).toUpperCase()}`,
    provenance: ['catalogue'],
    effectState: {},
    location: owner ? 'vault' : 'market',
  };
};
