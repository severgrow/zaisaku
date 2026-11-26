import { buildDuelContext } from './context.js';
import { definition } from './definitions.js';
import { appraise } from './valuation.js';
import type { DuelState, MatchResult, PlayerId, ScoreLine } from './types.js';

export const playerWorth = (state: DuelState, id: PlayerId): ScoreLine => {
  const ctx = buildDuelContext(state, id, true);
  const inventoryValue = state.players[id].inventory.reduce(
    (sum, item) => sum + appraise(definition(item.definitionId), item, ctx).liquidation,
    0,
  );
  const cash = state.players[id].cash;
  const netWorth = cash + inventoryValue;
  return {
    player: id,
    name: state.players[id].name,
    starting: state.rules.startingCash,
    cash,
    inventoryValue,
    contractRewards: state.players[id].contractRewards,
    netWorth,
    profit: netWorth - state.rules.startingCash,
  };
};

export const scoreMatch = (state: DuelState): MatchResult => {
  const a = playerWorth(state, 'p0');
  const b = playerWorth(state, 'p1');
  const winner = a.netWorth === b.netWorth ? 'draw' : a.netWorth > b.netWorth ? 'p0' : 'p1';
  return { scores: [a, b], winner, decisions: state.rounds };
};
