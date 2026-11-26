import { describe, expect, it } from 'vitest';
import { AGGRESSIVE, BALANCED, chooseAction } from '../src/bots/heuristic.js';
import { createDuel, validateAction } from '../src/engine/duel.js';
import { viewFor } from '../src/engine/view.js';
import { playMatch } from '../src/sim/match.js';
import { PLAYERS } from '../src/engine/types.js';

describe('bot', () => {
  it('only offers actions the rules accept, and never reads the opponent contract', () => {
    for (let seed = 1; seed <= 12; seed += 1) {
      const state = createDuel(seed);
      for (const id of PLAYERS) {
        const view = viewFor(state, id);
        const other = id === 'p0' ? state.players.p1 : state.players.p0;
        expect(JSON.stringify(view)).not.toContain(other.contract.description);
        const action = chooseAction(view, id === 'p0' ? BALANCED : AGGRESSIVE);
        expect(validateAction(state, id, action)).toBeNull();
      }
    }
  });
});

describe('bot simulations', () => {
  it('finishes matches without negative money, frozen tables or runaway scores', () => {
    let bids = 0;
    const wins = { p0: 0, p1: 0, draw: 0 };
    for (let seed = 1; seed <= 16; seed += 1) {
      const match = playMatch(seed, seed % 2 === 0 ? BALANCED : AGGRESSIVE, BALANCED);
      expect(match.phase).toBe('complete');
      expect(match.result).toBeTruthy();
      for (const id of PLAYERS) {
        expect(match.players[id].cash).toBeGreaterThanOrEqual(0);
        expect(match.result!.scores[id === 'p0' ? 0 : 1].netWorth).toBeLessThan(match.rules.startingCash * 5);
        const ids = match.players[id].inventory.map((item) => item.id);
        expect(new Set(ids).size).toBe(ids.length);
        bids += match.players[id].actions.filter((action) => action.type === 'bid').length;
      }
      const owned = new Set<string>();
      for (const id of PLAYERS) {
        for (const item of match.players[id].inventory) {
          expect(owned.has(item.id)).toBe(false);
          owned.add(item.id);
        }
      }
      wins[match.result!.winner] += 1;
    }
    expect(bids).toBeGreaterThan(8);
    expect(wins.p0 + wins.p1 + wins.draw).toBe(16);
  });
});
