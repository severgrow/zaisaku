import { nullMagnetBps, twinsBonusBps } from './effects.js';
import { activeMatchEvents } from './events.js';
import { contextFromEvents } from './valuation.js';
import { PLAYERS } from './types.js';
import type { DuelState, PlayerId, ValueContext } from './types.js';

export const buildDuelContext = (state: DuelState, holder: PlayerId | null, narrowed: boolean): ValueContext => {
  const active = activeMatchEvents(state.events, state.round);
  const magnet = nullMagnetBps(PLAYERS.map((id) => state.players[id].inventory));
  const twins = holder ? twinsBonusBps(state.players[holder].inventory) : null;
  return contextFromEvents(state.rules, active, { nullMagnetBps: magnet, twinsBonusBps: twins, narrowed });
};
