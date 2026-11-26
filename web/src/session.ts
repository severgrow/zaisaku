import type { DuelAction, DuelState, MatchResult, Profile } from '../../src/engine/types.js';
import type { Settings } from '../../src/persist/save.js';
import type { WorldState } from '../../src/world/types.js';

export type Route = 'home' | 'duel' | 'market' | 'auction' | 'vault' | 'contracts' | 'results' | 'settings' | 'world' | 'workshop';

export type Panel = 'merchant' | 'auction' | 'research' | 'contract' | 'storage' | 'display' | 'talk' | 'duel';

export const ROUTES: readonly Route[] = ['home', 'duel', 'market', 'auction', 'vault', 'contracts', 'results', 'settings', 'world', 'workshop'];

/** A choice the player can still read before it is submitted. Not saved. */
export type ArmedAction = Exclude<DuelAction, { type: 'bid' }> | { type: 'bid'; instanceId: string };

export interface Session {
  profile: Profile;
  duel: DuelState | null;
  settings: Settings;
  lastResult: MatchResult | null;
  route: Route;
  notice: string | null;
  selected: string | null;
  /** Bid amount the player is looking at. The sealed amount is this value at confirm. */
  bid: number;
  armed: ArmedAction | null;
  /** Last object this player inspected, so the scan can show without a second engine event. */
  scan: { instanceId: string; round: number } | null;
  sort: 'value' | 'name' | 'category' | 'acquired';
  clockMs: number;
  world: WorldState;
  revision: number;
  panel: Panel | null;
  displaySlot: string | null;
}

export const routeOf = (hash: string): Route => {
  const name = hash.replace(/^#\/?/, '') || 'home';
  return ROUTES.includes(name as Route) ? (name as Route) : 'home';
};
