import type { DuelState, MatchResult, Profile } from '../../src/engine/types.js';
import type { Settings } from '../../src/persist/save.js';

export type Route = 'home' | 'duel' | 'market' | 'auction' | 'vault' | 'contracts' | 'results' | 'settings';

export const ROUTES: readonly Route[] = ['home', 'duel', 'market', 'auction', 'vault', 'contracts', 'results', 'settings'];

export interface Session {
  profile: Profile;
  duel: DuelState | null;
  settings: Settings;
  lastResult: MatchResult | null;
  route: Route;
  notice: string | null;
  selected: string | null;
  bid: number;
  sort: 'value' | 'name' | 'category' | 'acquired';
  clockMs: number;
}

export const routeOf = (hash: string): Route => {
  const name = hash.replace(/^#\/?/, '') || 'home';
  return ROUTES.includes(name as Route) ? (name as Route) : 'home';
};
