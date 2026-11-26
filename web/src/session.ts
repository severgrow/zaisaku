import type { DuelState, MatchResult, Profile } from '../../src/engine/types.js';
import type { Settings } from '../../src/persist/save.js';
import type { WorldState } from '../../src/world/types.js';

export type Route = 'home' | 'duel' | 'market' | 'auction' | 'vault' | 'contracts' | 'results' | 'settings' | 'world' | 'workshop';

export type Panel = 'merchant' | 'auction' | 'research' | 'contract' | 'storage' | 'display' | 'talk' | 'duel';

<<<<<<< HEAD
export interface TalkFocus {
  id: string;
  name: string;
  line: string;
=======
export interface TalkAction {
  label: string;
  opens: string | null;
}

/** A short card over the world. Closing it does not move the player. */
export interface TalkCard {
  title: string;
  line: string;
  actorId: string;
  actions: TalkAction[];
>>>>>>> 4573b6953b957eecd99aba8461d38108e64e39c4
}

export const ROUTES: readonly Route[] = ['home', 'duel', 'market', 'auction', 'vault', 'contracts', 'results', 'settings', 'world', 'workshop'];

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
  world: WorldState;
  revision: number;
  panel: Panel | null;
  displaySlot: string | null;
<<<<<<< HEAD
  focus: TalkFocus | null;
=======
  talk: TalkCard | null;
>>>>>>> 4573b6953b957eecd99aba8461d38108e64e39c4
}

export const routeOf = (hash: string): Route => {
  const name = hash.replace(/^#\/?/, '') || 'home';
  return ROUTES.includes(name as Route) ? (name as Route) : 'home';
};
