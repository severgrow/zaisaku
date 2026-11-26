import { fail, ok } from './types.js';
import type { Auction, AuctionBid, ItemInstance, Result } from './types.js';
import type { Rng } from './prng.js';

export interface AuctionRules {
  reserve: number;
  increment: number;
  ticks: number;
  antiSnipeWindow: number;
  antiSnipeAdd: number;
  maxExtensions: number;
}

export const createAuction = (id: string, item: ItemInstance, rules: AuctionRules): Auction => ({
  id,
  item: { ...item, status: 'escrow', location: 'auction', ownerId: null },
  reserve: rules.reserve,
  increment: rules.increment,
  remainingTicks: rules.ticks,
  antiSnipeWindow: rules.antiSnipeWindow,
  antiSnipeAdd: rules.antiSnipeAdd,
  extensions: 0,
  maxExtensions: rules.maxExtensions,
  bids: [],
  status: 'open',
  winnerId: null,
  tick: 0,
});

const standing = (auction: Auction): AuctionBid | null => {
  const live = auction.bids.filter((bid) => !bid.withdrawn);
  if (!live.length) return null;
  return live.reduce((best, bid) => (bid.amount > best.amount ? bid : best));
};

export const highBid = (auction: Auction): number => standing(auction)?.amount ?? 0;

export const placeAuctionBid = (
  auction: Auction,
  bid: { bidderId: string; label: string; amount: number; simulated: boolean; available: number },
): Result<Auction> => {
  if (auction.status !== 'open') return fail('This auction is closed.');
  if (!Number.isInteger(bid.amount)) return fail('A bid must be a whole number of Zai.');
  if (bid.amount > bid.available) return fail('That bid is more than the funds set aside.');
  const floor = highBid(auction) === 0 ? auction.increment : highBid(auction) + auction.increment;
  if (bid.amount < floor) return fail(`The next bid is ${floor}.`);
  if (bid.amount < auction.increment) return fail(`Bids start at ${auction.increment}.`);
  if (highBid(auction) > 0 && bid.amount < highBid(auction) + auction.increment) {
    return fail(`Raise by at least ${auction.increment}.`);
  }
  const next: Auction = {
    ...auction,
    bids: [
      ...auction.bids,
      {
        bidderId: bid.bidderId,
        label: bid.label,
        amount: bid.amount,
        tick: auction.tick,
        simulated: bid.simulated,
        withdrawn: false,
      },
    ],
  };
  if (next.remainingTicks <= next.antiSnipeWindow && next.extensions < next.maxExtensions) {
    next.remainingTicks += next.antiSnipeAdd;
    next.extensions += 1;
  }
  return ok(next);
};

export const withdrawPlayerBids = (auction: Auction, bidderId: string): Result<Auction> => {
  if (auction.status !== 'open') return fail('This auction is closed.');
  return ok({
    ...auction,
    bids: auction.bids.map((bid) => (bid.bidderId === bidderId && !bid.withdrawn ? { ...bid, withdrawn: true } : bid)),
  });
};

export const cancelAuction = (auction: Auction): Result<Auction> => {
  if (auction.status !== 'open') return fail('This auction is closed.');
  return ok({ ...auction, status: 'cancelled', winnerId: null, remainingTicks: 0 });
};

export const settleAuction = (auction: Auction): Auction => {
  if (auction.status !== 'open') return auction;
  const lead = standing(auction);
  if (lead && lead.amount >= auction.reserve) {
    return { ...auction, status: 'settled', winnerId: lead.bidderId, remainingTicks: 0 };
  }
  return { ...auction, status: 'refunded', winnerId: null, remainingTicks: 0 };
};

const SIMULATED = [
  { id: 'sim-moth', label: 'Moth · simulated' },
  { id: 'sim-hinge', label: 'Hinge · simulated' },
] as const;

/** House bidders are labelled and capped. They stop after three raises. */
export const simulatedStep = (auction: Auction, cap: number, rng: Rng): Auction => {
  if (auction.status !== 'open') return auction;
  const raised = auction.bids.filter((bid) => bid.simulated && !bid.withdrawn).length;
  if (raised >= 3) return auction;
  const opening = Math.max(auction.increment, Math.floor((auction.reserve * 70) / 100));
  const nextAmount = highBid(auction) === 0 ? Math.min(cap, opening) : highBid(auction) + auction.increment;
  if (nextAmount > cap) return auction;
  const who = SIMULATED[rng.int(SIMULATED.length)] ?? SIMULATED[raised % SIMULATED.length]!;
  const placed = placeAuctionBid(auction, {
    bidderId: who.id,
    label: who.label,
    amount: nextAmount,
    simulated: true,
    available: cap,
  });
  if (!placed.ok) return auction;
  return placed.value;
};

export const tickAuction = (auction: Auction, cap: number, rng: Rng, allowSimulated: boolean): Auction => {
  if (auction.status !== 'open') return auction;
  let next: Auction = { ...auction, tick: auction.tick + 1, remainingTicks: auction.remainingTicks - 1 };
  if (next.remainingTicks > 0 && allowSimulated && next.tick % 4 === 0) next = simulatedStep(next, cap, rng);
  if (next.remainingTicks <= 0) return settleAuction(next);
  return next;
};
