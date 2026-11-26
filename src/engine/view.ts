import { buildDuelContext } from './context.js';
import { evaluateContract } from './contracts.js';
import { definition } from './definitions.js';
import { hiddenKeys } from './effects.js';
import { activeMatchEvents, rumoursFor } from './events.js';
import { playerWorth } from './scoring.js';
import { stateBool, stateNum } from './money.js';
import { appraise, conditionWord } from './valuation.js';
import type { DuelState, PlayerId, PlayerView, PublicItem, ValueContext } from './types.js';

const other = (id: PlayerId): PlayerId => (id === 'p0' ? 'p1' : 'p0');

const present = (
  item: DuelState['offered'][number]['item'],
  knownKeys: readonly string[],
  ctx: ValueContext,
  lingeringRounds: number | null,
  acquisition: number | null,
): PublicItem => {
  const def = definition(item.definitionId);
  const known = new Set(knownKeys);
  const narrowed = known.has('condition-exact') || known.has('authenticity');
  const quote = appraise(def, item, { ...ctx, narrowed });
  const revealed = def.inspectionProps
    .filter((prop) => !prop.hidden || known.has(prop.key))
    .map((prop) => ({
      key: prop.key,
      label: prop.label,
      value: prop.key === 'authenticity' ? item.authenticity : prop.key === 'condition-exact' ? String(item.condition) : prop.value,
    }));
  return {
    instanceId: item.id,
    definitionId: def.id,
    name: def.name,
    description: def.description,
    category: def.category,
    manufacturer: def.manufacturer,
    era: def.era,
    rarity: def.rarity,
    collection: def.collection,
    tags: def.tags,
    artworkRef: def.artworkRef,
    conditionWord: conditionWord(item.condition),
    conditionExact: known.has('condition-exact') ? item.condition : null,
    authenticity: known.has('authenticity') ? item.authenticity : null,
    quote,
    hiddenRemaining: hiddenKeys(def.id).filter((key) => !known.has(key)).length,
    revealed,
    acquisitionPrice: acquisition,
    warning: stateBool(item.effectState, 'warning'),
    roundsHeld: stateNum(item.effectState, 'roundsHeld'),
    tradeable: def.tradeable,
    lingeringRounds,
  };
};

/** What one player is allowed to see. Opponent contracts, papers and future events stay out. */
export const viewFor = (state: DuelState, you: PlayerId): PlayerView => {
  const them = other(you);
  const mine = state.players[you];
  const opp = state.players[them];
  const mineCtx = buildDuelContext(state, you, false);
  const oppCtx = buildDuelContext(state, them, false);
  const tableCtx = buildDuelContext(state, null, false);
  const evaluated = evaluateContract(mine.contract.templateId, {
    held: mine.inventory,
    sales: mine.sales,
    known: mine.known,
    round: state.round,
    damagedBelow: state.rules.damagedBelow,
  });
  const worth = playerWorth(state, you);
  return {
    you,
    seed: state.seed,
    round: state.round,
    maxRounds: state.rules.rounds,
    phase: state.phase,
    minBid: state.rules.minBid,
    increment: state.rules.bidIncrement,
    cash: mine.cash,
    opponentCash: opp.cash,
    youName: mine.name,
    opponentName: opp.name,
    opponentSimulated: opp.simulated,
    youLocked: state.decisions[you] !== null,
    opponentLocked: state.decisions[them] !== null,
    offers: state.offered.map((offer) =>
      present(offer.item, mine.known[offer.item.id] ?? offer.revealed[you], tableCtx, state.round - offer.arrivedRound + 1, null),
    ),
    inventory: mine.inventory.map((item) => present(item, mine.known[item.id] ?? [], mineCtx, null, item.acquisitionPrice)),
    opponentInventory: opp.inventory.map((item) => present(item, mine.known[item.id] ?? [], oppCtx, null, null)),
    contract: {
      id: mine.contract.templateId,
      title: mine.contract.title,
      description: mine.contract.description,
      progress: mine.contract.status === 'active' ? evaluated.progress : mine.contract.progress,
      target: mine.contract.target,
      reward: mine.contract.reward,
      status: mine.contract.status,
    },
    warnings: mine.warnings,
    knowledge: mine.knowledge ? { name: mine.knowledge.name, summary: mine.knowledge.summary } : null,
    activeEvents: activeMatchEvents(state.events, state.round).map((event) => ({ name: event.name, summary: event.summary })),
    rumours: rumoursFor(state.events, state.round),
    recentOpponentActions: opp.actions.slice(-4).map((action) => action.type),
    log: state.log.slice(-16),
    worth: { cash: worth.cash, inventoryValue: worth.inventoryValue, netWorth: worth.netWorth },
    result: state.result,
  };
};

/** The table, with no private contracts and no private papers. */
export const publicSnapshot = (state: DuelState) => ({
  round: state.round,
  phase: state.phase,
  cash: { p0: state.players.p0.cash, p1: state.players.p1.cash },
  offers: state.offered.map((offer) => offer.item.definitionId),
  events: activeMatchEvents(state.events, state.round).map((event) => event.name),
  rumours: rumoursFor(state.events, state.round),
});
