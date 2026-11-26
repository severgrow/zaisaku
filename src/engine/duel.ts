import { snapBid } from './bids.js';
import { buildDuelContext } from './context.js';
import { refreshContract, contractAchievable, makeContract, PLAYER_TEMPLATES, templateById } from './contracts.js';
import { DEFINITIONS, definition } from './definitions.js';
import { inspectRevealCount, nextRevealKeys, receiverKnowledge, applyRoundEnd } from './effects.js';
import { scheduleMatchEvents } from './events.js';
import { instantiate } from './instances.js';
import { mulberry32, shuffle } from './prng.js';
import { resolveRules } from './rules.js';
import { scoreMatch } from './scoring.js';
import { appraise } from './valuation.js';
import { PLAYERS, fail, ok } from './types.js';
import type { ActionLogEntry, DuelAction, DuelState, ItemDefinition, Offered, PlayerId, Result, Rules } from './types.js';

const FEATURED = [
  'tomorrow-receiver',
  'amber-hourglass',
  'moon-clock',
  'null-magnet',
  'silent-telephone',
  'red-box',
  'memory-lens',
  'twin-left',
  'twin-right',
  'orchid-vessel',
  'dream-receiver',
  'counterfeit-seal',
] as const;

export interface CreateDuelOptions {
  rules?: Partial<Rules>;
  names?: readonly [string, string];
  simulated?: readonly [boolean, boolean];
}

const clone = <T>(value: T): T => structuredClone(value);

export const createDuel = (seed: number, options: CreateDuelOptions = {}): DuelState => {
  const rules = resolveRules(options.rules);
  const rng = mulberry32(seed >>> 0);
  const featured = new Set<string>(FEATURED);
  const ordered = [
    ...shuffle(DEFINITIONS.filter((def) => featured.has(def.id)), rng),
    ...shuffle(DEFINITIONS.filter((def) => !featured.has(def.id)), rng),
  ];
  const count = rules.rounds * rules.objectsPerRound;
  const chosen = ordered.slice(0, count);
  let n = 1;
  const queue = chosen.map((def) => {
    const item = instantiate(def, rng, `d${seed}-${n}`, null, 0);
    n += 1;
    return { ...item, status: 'offered' as const, location: 'duel' as const, provenance: ['duel catalogue'] };
  });
  const events = scheduleMatchEvents(rng, rules.rounds);
  const defs: ItemDefinition[] = queue.map((item) => definition(item.definitionId));
  const upside = events.some((event) => event.demandBps >= 13_000 || event.supplyBps < 10_000);
  let viable = shuffle([...PLAYER_TEMPLATES], rng).filter((template) =>
    contractAchievable(template.id, defs, { rounds: rules.rounds, upside, rules }),
  );
  if (!viable.length) viable = [templateById('hold-anything')];
  const first = viable[0]!;
  const second = viable[1] ?? first;
  const names = options.names ?? ['You', 'Clerk Vesper'];
  const simulated = options.simulated ?? [false, true];
  const deal = queue.splice(0, rules.objectsPerRound);
  const offered: Offered[] = deal.map((item) => ({ item, arrivedRound: 1, revealed: { p0: [], p1: [] } }));
  const base = {
    rulesVersion: rules.version,
    rules,
    seed: seed >>> 0,
    rngState: rng.state(),
    round: 1,
    phase: 'decide' as const,
    offered,
    queue,
    events,
    decisions: { p0: null, p1: null },
    expired: { p0: false, p1: false },
    log: [],
    rounds: [],
    result: null,
    actionLog: [] as ActionLogEntry[],
  };
  const players = {
    p0: blankPlayer('p0', names[0], simulated[0], rules.startingCash, makeContract(first, 'c-p0', 'match', 1)),
    p1: blankPlayer('p1', names[1], simulated[1], rules.startingCash, makeContract(second, 'c-p1', 'match', 1)),
  };
  const state: DuelState = { ...base, players };
  for (const id of PLAYERS) state.players[id].knowledge = receiverKnowledge(state.players[id].inventory, state.events, 1);
  return state;
};

const blankPlayer = (
  id: PlayerId,
  name: string,
  simulated: boolean,
  cash: number,
  contract: DuelState['players']['p0']['contract'],
): DuelState['players']['p0'] => ({
  id,
  name,
  simulated,
  cash,
  inventory: [],
  known: {},
  contract,
  contractRewards: 0,
  sales: [],
  warnings: [],
  knowledge: null,
  actions: [],
});

export const validateAction = (state: DuelState, player: PlayerId, action: DuelAction): string | null => {
  if (state.phase !== 'decide') return 'The round is closed.';
  if (state.decisions[player]) return 'You have already locked a decision.';
  if (action.type === 'pass') return null;
  if (action.type === 'bid') {
    if (!state.offered.some((offer) => offer.item.id === action.instanceId)) return 'That object is not on the table.';
    if (!Number.isInteger(action.amount)) return 'A bid must be a whole number of Zai.';
    if (action.amount < state.rules.minBid) return `The minimum bid is ${state.rules.minBid}.`;
    if ((action.amount - state.rules.minBid) % state.rules.bidIncrement !== 0) {
      return `Bids move in steps of ${state.rules.bidIncrement}.`;
    }
    if (action.amount > state.players[player].cash) return 'You cannot bid more than you hold.';
    return null;
  }
  if (action.type === 'sell') {
    const item = state.players[player].inventory.find((owned) => owned.id === action.instanceId);
    if (!item) return 'You do not own that object.';
    if (!definition(item.definitionId).tradeable) return 'That object cannot be sold.';
    return null;
  }
  const item =
    state.offered.find((offer) => offer.item.id === action.instanceId)?.item ??
    state.players[player].inventory.find((owned) => owned.id === action.instanceId);
  if (!item) return 'That object is not here.';
  const already = state.players[player].known[item.id] ?? [];
  if (nextRevealKeys(item.definitionId, already, 1).length === 0) return 'There is nothing left to learn about that object.';
  return null;
};

const lock = (state: DuelState, player: PlayerId, action: DuelAction, expired: boolean): DuelState => {
  const next = clone(state);
  next.decisions[player] = action;
  next.expired[player] = expired;
  next.actionLog.push({ player, action, expired });
  return next.decisions.p0 && next.decisions.p1 ? resolve(next) : next;
};

export const submit = (state: DuelState, player: PlayerId, action: DuelAction): Result<DuelState> => {
  const reason = validateAction(state, player, action);
  if (reason) return fail(reason);
  return ok(lock(state, player, action, false));
};

export const expire = (state: DuelState, player: PlayerId): Result<DuelState> => {
  if (state.phase !== 'decide') return fail('The round is closed.');
  if (state.decisions[player]) return ok(state);
  return ok(lock(state, player, { type: 'pass' }, true));
};

export const replayDuel = (seed: number, log: readonly ActionLogEntry[], options: CreateDuelOptions = {}): DuelState => {
  let state = createDuel(seed, options);
  for (const entry of log) {
    if (state.phase !== 'decide') break;
    const res = entry.expired ? expire(state, entry.player) : submit(state, entry.player, entry.action);
    if (!res.ok) throw new Error(res.reason);
    state = res.value;
  }
  return state;
};

const resolve = (state: DuelState): DuelState => {
  const draft = clone(state);
  const notes: string[] = [];
  const preCash: Record<PlayerId, number> = { p0: draft.players.p0.cash, p1: draft.players.p1.cash };
  const actions = {} as Record<PlayerId, DuelAction>;
  for (const id of PLAYERS) {
    const proposed = draft.decisions[id] ?? { type: 'pass' as const };
    actions[id] = validateAction({ ...draft, decisions: { p0: null, p1: null }, phase: 'decide' }, id, proposed)
      ? { type: 'pass' }
      : proposed;
  }

  for (const id of PLAYERS) {
    const name = draft.players[id].name;
    const action = actions[id];
    if (draft.expired[id] && action.type === 'pass') notes.push(`${name} let the clock run out.`);
    else if (action.type === 'pass') notes.push(`${name} passed.`);
    if (action.type !== 'inspect') continue;
    const player = draft.players[id];
    const offer = draft.offered.find((row) => row.item.id === action.instanceId);
    const owned = player.inventory.find((item) => item.id === action.instanceId);
    const item = offer?.item ?? owned;
    if (!item) continue;
    const already = player.known[item.id] ?? [];
    const keys = nextRevealKeys(item.definitionId, already, inspectRevealCount(player.inventory));
    const known = [...already, ...keys];
    player.known = { ...player.known, [item.id]: known };
    if (offer) offer.revealed[id] = known;
    if (owned) owned.revealedProps = known;
    notes.push(`${name} inspected ${definition(item.definitionId).name}.`);
  }

  for (const id of PLAYERS) {
    const action = actions[id];
    if (action.type !== 'sell') continue;
    const player = draft.players[id];
    const index = player.inventory.findIndex((item) => item.id === action.instanceId);
    if (index < 0) continue;
    const item = player.inventory[index]!;
    const quote = appraise(definition(item.definitionId), item, buildDuelContext(draft, id, true));
    player.inventory.splice(index, 1);
    player.cash += quote.liquidation;
    player.sales.push({
      instanceId: item.id,
      definitionId: item.definitionId,
      category: definition(item.definitionId).category,
      price: quote.liquidation,
      acquisitionPrice: item.acquisitionPrice,
      round: draft.round,
    });
    notes.push(`${player.name} sold ${definition(item.definitionId).name} to the house for ${quote.liquidation}.`);
  }

  const groups = new Map<string, { player: PlayerId; amount: number }[]>();
  for (const id of PLAYERS) {
    const action = actions[id];
    if (action.type !== 'bid') continue;
    const list = groups.get(action.instanceId) ?? [];
    list.push({ player: id, amount: action.amount });
    groups.set(action.instanceId, list);
  }
  const kept: Offered[] = [];
  for (const offer of draft.offered) {
    const bids = groups.get(offer.item.id) ?? [];
    const objectName = definition(offer.item.definitionId).name;
    if (!bids.length) {
      kept.push(offer);
      continue;
    }
    const top = Math.max(...bids.map((bid) => bid.amount));
    const leaders = bids.filter((bid) => bid.amount === top);
    if (leaders.length !== 1) {
      notes.push(`Equal bids of ${top} on ${objectName}. It stays unsold.`);
      kept.push(offer);
      continue;
    }
    const winner = leaders[0]!;
    if (winner.amount > preCash[winner.player] || winner.amount > draft.players[winner.player].cash) {
      notes.push(`${draft.players[winner.player].name}'s bid on ${objectName} could not be paid.`);
      kept.push(offer);
      continue;
    }
    const buyer = draft.players[winner.player];
    buyer.cash -= winner.amount;
    const known = [...(offer.revealed[winner.player] ?? buyer.known[offer.item.id] ?? [])];
    const item = {
      ...offer.item,
      ownerId: winner.player,
      status: 'held' as const,
      location: 'duel' as const,
      acquisitionPrice: winner.amount,
      acquiredAt: draft.round,
      revealedProps: known,
      provenance: [...offer.item.provenance, `won in round ${draft.round}`],
    };
    buyer.known = { ...buyer.known, [item.id]: known };
    buyer.inventory = [...buyer.inventory, item];
    notes.push(`${buyer.name} bought ${objectName} for ${winner.amount}.`);
  }
  draft.offered = kept;

  const effectRng = mulberry32(draft.rngState);
  for (const id of PLAYERS) {
    const ended = applyRoundEnd(draft.players[id], effectRng);
    draft.players[id] = ended.player;
    notes.push(...ended.notes);
  }
  draft.rngState = effectRng.state();

  for (const id of PLAYERS) {
    const player = draft.players[id];
    const refreshed = refreshContract(player.contract, {
      held: player.inventory,
      sales: player.sales,
      known: player.known,
      round: draft.round,
      damagedBelow: draft.rules.damagedBelow,
    });
    if (refreshed.justCompleted) {
      player.cash += player.contract.reward;
      player.contractRewards += player.contract.reward;
      player.contract = { ...refreshed.contract, rewardPaid: true };
      notes.push(`${player.name} completed “${player.contract.title}” and received ${player.contract.reward}.`);
    } else {
      player.contract = refreshed.contract;
    }
    player.actions = [...player.actions, actions[id]];
  }

  draft.rounds.push({ round: draft.round, notes, actions });
  draft.log.push(...notes);
  draft.decisions = { p0: null, p1: null };
  draft.expired = { p0: false, p1: false };

  if (draft.round >= draft.rules.rounds) {
    draft.phase = 'complete';
    draft.result = scoreMatch(draft);
    return draft;
  }

  draft.offered = draft.offered.filter((offer) => draft.round - offer.arrivedRound + 1 < draft.rules.lingerRounds);
  draft.round += 1;
  const dealt = draft.queue.splice(0, draft.rules.objectsPerRound);
  for (const item of dealt) draft.offered.push({ item, arrivedRound: draft.round, revealed: { p0: [], p1: [] } });
  for (const id of PLAYERS) {
    draft.players[id].knowledge = receiverKnowledge(draft.players[id].inventory, draft.events, draft.round);
  }
  return draft;
};

export const legalBid = (cash: number, rules: Rules): number => snapBid(Math.max(rules.minBid, cash), rules.minBid, rules.bidIncrement);
