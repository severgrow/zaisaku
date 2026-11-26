import { maxAffordableBid, snapBid } from '../engine/bids.js';
import type { DuelAction, PlayerView, PublicItem } from '../engine/types.js';

export interface Personality {
  id: string;
  name: string;
  aggression: number;
  patience: number;
  contractWeight: number;
  risk: number;
}

export const BALANCED: Personality = {
  id: 'balanced',
  name: 'Clerk Vesper',
  aggression: 48,
  patience: 55,
  contractWeight: 90,
  risk: 35,
};

export const AGGRESSIVE: Personality = {
  id: 'aggressive',
  name: 'Red Bidder',
  aggression: 82,
  patience: 15,
  contractWeight: 50,
  risk: 78,
};

const sound = (item: PublicItem): boolean => item.conditionWord === 'sound' || item.conditionWord === 'fine';

const helps = (view: PlayerView, item: PublicItem): boolean => {
  const contract = view.contract;
  if (!contract || contract.status === 'complete') return false;
  const held = new Set(view.inventory.map((owned) => owned.category));
  switch (contract.id) {
    case 'two-timepieces':
      return item.category === 'timekeeping';
    case 'three-categories':
      return !held.has(item.category);
    case 'same-maker':
      return view.inventory.length === 0 || view.inventory.some((owned) => owned.manufacturer === item.manufacturer);
    case 'matching-pair':
      return item.definitionId === 'twin-left' || item.definitionId === 'twin-right';
    case 'authenticated-rare':
      return item.rarity === 'rare' || item.rarity === 'singular';
    case 'magical-and-ordinary':
      return !held.has('magical') ? item.category === 'magical' : item.category !== 'magical';
    case 'no-damage':
      return sound(item);
    case 'hold-three-rounds':
    case 'hold-anything':
      return view.inventory.length === 0;
    case 'profit-curiosity':
      return item.category === 'curiosities';
    case 'sell-two-profit':
      return item.quote.liquidation > view.minBid;
    default:
      return false;
  }
};

/** A personality reads only its own view and returns one action. Hidden opponent papers are not on that view. */
export const chooseAction = (view: PlayerView, personality: Personality): DuelAction => {
  if (view.phase !== 'decide' || view.youLocked) return { type: 'pass' };
  const roundsLeft = view.maxRounds - view.round + 1;
  const reserve = personality.patience >= 70 ? view.minBid : 0;
  const spendable = Math.max(0, view.cash - reserve);

  if (personality.aggression < 75 && view.round <= 2) {
    const curious = [...view.offers]
      .sort((a, b) => a.instanceId.localeCompare(b.instanceId))
      .find(
        (offer) =>
          offer.hiddenRemaining > 0 &&
          (offer.rarity === 'rare' || offer.rarity === 'singular' || view.contract?.id === 'authenticated-rare'),
      );
    if (curious) return { type: 'inspect', instanceId: curious.instanceId };
  }

  const warned = view.inventory.find((item) => item.warning);
  if (warned) return { type: 'sell', instanceId: warned.instanceId };

  if (view.cash < view.minBid && view.inventory[0]) {
    const useless = view.inventory.find((item) => !helps(view, item)) ?? view.inventory[0];
    return { type: 'sell', instanceId: useless.instanceId };
  }

  if (roundsLeft <= 2) {
    const ripe = view.inventory.find(
      (item) => !helps(view, item) && item.acquisitionPrice !== null && item.quote.liquidation > item.acquisitionPrice,
    );
    if (ripe) return { type: 'sell', instanceId: ripe.instanceId };
  }

  let best: { id: string; amount: number; score: number } | null = null;
  for (const offer of view.offers) {
    const score = offer.quote.liquidation + (helps(view, offer) ? personality.contractWeight : 0);
    const ratio = (60 + personality.aggression) / 100;
    let amount = snapBid(Math.floor(offer.quote.liquidation * ratio), view.minBid, view.increment);
    const cap = maxAffordableBid(spendable, view.minBid, view.increment);
    if (cap < view.minBid) continue;
    if (amount > cap) amount = cap;
    if (amount < view.minBid) continue;
    if (amount > offer.quote.liquidation && personality.risk < 50) continue;
    const contested =
      view.recentOpponentActions.filter((action) => action === 'bid').length >= 3 &&
      (offer.rarity === 'rare' || offer.rarity === 'singular');
    if (contested && personality.aggression < 70) continue;
    if (!best || score > best.score || (score === best.score && offer.instanceId < best.id)) {
      best = { id: offer.instanceId, amount, score };
    }
  }
  if (best) return { type: 'bid', instanceId: best.id, amount: best.amount };
  return { type: 'pass' };
};
