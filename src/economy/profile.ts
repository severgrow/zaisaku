import { cancelAuction, createAuction, highBid, placeAuctionBid, tickAuction, withdrawPlayerBids } from '../engine/auction.js';
import { makeContract, refreshContract, templateById } from '../engine/contracts.js';
import type { ContractCtx } from '../engine/contracts.js';
import { definition, DEFINITIONS } from '../engine/definitions.js';
import { inspectRevealCount, nextRevealKeys, nullMagnetBps, twinsBonusBps } from '../engine/effects.js';
import { activeAtTick } from '../engine/events.js';
import { markCeramicListings } from '../engine/events.js';
import { instantiate } from '../engine/instances.js';
import { mulBps } from '../engine/money.js';
import { deriveSeed, mulberry32 } from '../engine/prng.js';
import { resolveRules } from '../engine/rules.js';
import { appraise, contextFromEvents } from '../engine/valuation.js';
import { fail, ok } from '../engine/types.js';
import type { Auction, Profile, Result, SaleRecord, ValueContext } from '../engine/types.js';

const ROTATION = [
  'magical-and-ordinary',
  'two-timepieces',
  'same-maker',
  'profit-curiosity',
  'authenticated-rare',
  'no-damage',
  'sell-two-profit',
] as const;

export const cleanName = (name: string): string => {
  const trimmed = name.trim().slice(0, 24);
  return trimmed.length ? trimmed : 'Guest';
};

const track = (profile: Profile, event: string): Profile => ({
  ...profile,
  analytics: { counts: { ...profile.analytics.counts, [event]: (profile.analytics.counts[event] ?? 0) + 1 } },
});

export const note = (profile: Profile, event: string): Profile => track(profile, event);

export const remember = (profile: Profile, key: string, value: number): Profile => ({
  ...profile,
  analytics: { counts: { ...profile.analytics.counts, [key]: value } },
});

const once = (profile: Profile, key: string, apply: (current: Profile) => Result<Profile>): Result<Profile> => {
  if (profile.idempotency.includes(key)) return ok(profile, true);
  const result = apply(profile);
  if (!result.ok) return result;
  return ok({ ...result.value, idempotency: [...result.value.idempotency, key].slice(-200) }, false);
};

export const credit = (profile: Profile, amount: number, reason: string, ref: string): Result<Profile> => {
  if (!Number.isInteger(amount)) return fail('Zai must be a whole number.');
  const permanent = profile.wallets.permanent + amount;
  if (permanent < 0 || permanent < profile.wallets.reserved) return fail('The balance would not cover that.');
  return ok({
    ...profile,
    wallets: { ...profile.wallets, permanent },
    ledger: [
      ...profile.ledger,
      {
        id: `${profile.tick}:${profile.ledger.length}:${reason}:${ref}`,
        tick: profile.tick,
        amount,
        balanceAfter: permanent,
        reason,
        ref,
      },
    ],
  });
};

export const marketContext = (profile: Profile, narrowed = false): ValueContext =>
  contextFromEvents(resolveRules(), activeAtTick(profile.seed, profile.tick), {
    nullMagnetBps: nullMagnetBps([profile.inventory]),
    twinsBonusBps: twinsBonusBps(profile.inventory),
    narrowed,
  });

const contractCtx = (profile: Profile): ContractCtx => {
  const known: Record<string, readonly string[]> = {};
  for (const item of profile.inventory) known[item.id] = item.revealedProps;
  return { held: profile.inventory, sales: profile.sales, known, round: profile.tick, damagedBelow: resolveRules().damagedBelow };
};

const nextRequest = (profile: Profile) => {
  const used = new Set(profile.requests.map((request) => request.templateId));
  const index = Math.abs(profile.seed + profile.tick + profile.requests.length) % ROTATION.length;
  const id = ROTATION.find((_, offset) => !used.has(ROTATION[(index + offset) % ROTATION.length]!)) ?? ROTATION[index]!;
  const pick = ROTATION[(index + profile.requests.length) % ROTATION.length]!;
  const templateId = used.has(pick) ? id : pick;
  return makeContract(templateById(templateId), `req-${profile.seed}-${profile.requests.length}`, 'persistent', profile.tick);
};

const refreshRequests = (profile: Profile): Profile => {
  let next = profile;
  const requests = [];
  for (const request of next.requests) {
    if (request.status !== 'active') {
      requests.push(request);
      continue;
    }
    if (next.tick - request.assignedTick > resolveRules().requestLifetime) {
      requests.push({ ...request, status: 'expired' as const });
      continue;
    }
    const refreshed = refreshContract(request, contractCtx(next));
    if (!refreshed.justCompleted) {
      requests.push(refreshed.contract);
      continue;
    }
    const paid = credit(next, request.reward, 'contract', request.instanceId);
    if (!paid.ok) {
      requests.push(request);
      continue;
    }
    next = track(
      {
        ...paid.value,
        transactions: [
          ...paid.value.transactions,
          { id: `reward-${request.instanceId}`, tick: next.tick, kind: 'reward', instanceId: null, amount: request.reward, note: request.title },
        ],
      },
      'contract_complete',
    );
    requests.push({ ...refreshed.contract, rewardPaid: true });
  }
  next = { ...next, requests };
  if (!next.requests.some((request) => request.status === 'active')) {
    next = { ...next, requests: [...next.requests, nextRequest(next)] };
  }
  return next;
};

const recordPrices = (profile: Profile): Profile => {
  const ctx = marketContext(profile);
  const points = profile.listings.map((item) => {
    const quote = appraise(definition(item.definitionId), item, ctx);
    return { tick: profile.tick, instanceId: item.id, ask: quote.ask, liquidation: quote.liquidation };
  });
  return { ...profile, priceHistory: [...profile.priceHistory, ...points].slice(-120) };
};

export const createProfile = (name: string, seed: number): Profile => {
  const rules = resolveRules();
  const rng = mulberry32(deriveSeed(seed >>> 0, 1));
  const listings = [];
  for (let i = 0; i < rules.marketListings; i += 1) {
    const def = DEFINITIONS[rng.int(DEFINITIONS.length)]!;
    listings.push(instantiate(def, rng, `lot-${seed >>> 0}-${i}`, null, 0));
  }
  const profile: Profile = {
    version: 1,
    id: `collector-${seed >>> 0}`,
    name: cleanName(name),
    seed: seed >>> 0,
    tick: 0,
    rngState: rng.state(),
    wallets: { permanent: rules.startingPermanent, cosmetic: 0, reserved: 0 },
    inventory: [],
    listings,
    ledger: [
      {
        id: 'opening',
        tick: 0,
        amount: rules.startingPermanent,
        balanceAfter: rules.startingPermanent,
        reason: 'opening-balance',
        ref: 'grant',
      },
    ],
    transactions: [],
    requests: [makeContract(templateById('three-categories'), `req-${seed >>> 0}-0`, 'persistent', 0)],
    sales: [],
    auction: null,
    notifications: [{ id: 'open', text: 'The floor is quiet. Six lots are on the board.', seen: false }],
    priceHistory: [],
    analytics: { counts: { first_session: 1 } },
    idempotency: [],
  };
  return recordPrices(profile);
};

export const availableFunds = (profile: Profile): number => profile.wallets.permanent - profile.wallets.reserved;

export const rename = (profile: Profile, name: string): Profile => ({ ...profile, name: cleanName(name) });

export const markNoticesSeen = (profile: Profile): Profile => ({
  ...profile,
  notifications: profile.notifications.map((notice) => ({ ...notice, seen: true })),
});

export const buyListing = (profile: Profile, instanceId: string, key: string): Result<Profile> =>
  once(profile, key, (current) => {
    const item = current.listings.find((listing) => listing.id === instanceId);
    if (!item) return fail('That lot is no longer on the board.');
    const def = definition(item.definitionId);
    if (!def.tradeable) return fail('That object is not for sale.');
    const quote = appraise(def, item, marketContext(current));
    if (quote.ask > availableFunds(current)) return fail('You do not have enough Zai.');
    const paid = credit(current, -quote.ask, 'buy', item.id);
    if (!paid.ok) return paid;
    const bought = {
      ...item,
      ownerId: current.id,
      status: 'held' as const,
      location: 'vault' as const,
      acquisitionPrice: quote.ask,
      acquiredAt: current.tick,
      provenance: [...item.provenance, `bought on tick ${current.tick}`],
    };
    return ok(
      refreshRequests(
        track(
          {
            ...paid.value,
            inventory: [...paid.value.inventory, bought],
            listings: paid.value.listings.filter((listing) => listing.id !== item.id),
            transactions: [
              ...paid.value.transactions,
              { id: key, tick: current.tick, kind: 'buy', instanceId: item.id, amount: -quote.ask, note: `Bought ${def.name}` },
            ],
          },
          'market_action',
        ),
      ),
    );
  });

export const sellOwned = (profile: Profile, instanceId: string, key: string): Result<Profile> =>
  once(profile, key, (current) => {
    const item = current.inventory.find((owned) => owned.id === instanceId);
    if (!item || (item.ownerId !== null && item.ownerId !== current.id)) return fail('You do not own that object.');
    const def = definition(item.definitionId);
    if (!def.tradeable) return fail('That object cannot be sold.');
    const quote = appraise(def, item, marketContext(current));
    const paid = credit(current, quote.liquidation, 'sell', item.id);
    if (!paid.ok) return paid;
    const sale: SaleRecord = {
      instanceId: item.id,
      definitionId: item.definitionId,
      category: def.category,
      price: quote.liquidation,
      acquisitionPrice: item.acquisitionPrice,
      round: current.tick,
    };
    return ok(
      refreshRequests(
        track(
          {
            ...paid.value,
            inventory: paid.value.inventory.filter((owned) => owned.id !== item.id),
            sales: [...paid.value.sales, sale],
            transactions: [
              ...paid.value.transactions,
              { id: key, tick: current.tick, kind: 'sell', instanceId: item.id, amount: quote.liquidation, note: `Sold ${def.name}` },
            ],
          },
          'market_action',
        ),
      ),
    );
  });

export const inspectOwned = (profile: Profile, instanceId: string): Result<Profile> => {
  const item = profile.inventory.find((owned) => owned.id === instanceId);
  if (!item) return fail('That object is not in the vault.');
  const keys = nextRevealKeys(item.definitionId, item.revealedProps, inspectRevealCount(profile.inventory));
  if (!keys.length) return fail('There is nothing left to learn about that object.');
  const inventory = profile.inventory.map((owned) =>
    owned.id === item.id ? { ...owned, revealedProps: [...owned.revealedProps, ...keys] } : owned,
  );
  return ok(refreshRequests({ ...profile, inventory }));
};

export const advanceMarket = (profile: Profile): Profile => {
  const rules = resolveRules();
  let next: Profile = { ...profile, tick: profile.tick + 1 };
  const events = activeAtTick(next.seed, next.tick);
  next = {
    ...next,
    listings: markCeramicListings(
      next.listings,
      next.tick,
      events,
      (id) => definition(id).category === 'ceramics',
      rules.ceramicMarkdown,
      rules.ceramicConditionFloor,
    ),
  };
  const rng = mulberry32(next.rngState);
  const fresh = [];
  for (let i = 0; i < 2; i += 1) {
    const def = DEFINITIONS[rng.int(DEFINITIONS.length)]!;
    fresh.push(instantiate(def, rng, `lot-${next.seed}-${next.tick}-${i}`, null, next.tick));
  }
  const head = events[0];
  next = {
    ...next,
    rngState: rng.state(),
    listings: [...next.listings.slice(2), ...fresh].slice(0, rules.marketListings),
    notifications: head
      ? [{ id: `ev-${next.tick}`, text: `${head.name}. ${head.summary}`, seen: false }, ...next.notifications].slice(0, 24)
      : next.notifications,
  };
  return refreshRequests(recordPrices(next));
};

const escrowOf = (profile: Profile, auction: Auction | null): number => {
  if (!auction || auction.status !== 'open') return 0;
  const mine = auction.bids.filter((bid) => bid.bidderId === profile.id && !bid.withdrawn);
  if (!mine.length) return 0;
  const mineHigh = Math.max(...mine.map((bid) => bid.amount));
  return mineHigh === highBid(auction) ? mineHigh : 0;
};

const applyAuction = (profile: Profile, auction: Auction): Profile => {
  const reserved = escrowOf(profile, auction);
  let next: Profile = { ...profile, auction, wallets: { ...profile.wallets, reserved } };
  const terminal = auction.status !== 'open';
  if (!terminal) return next;
  next = { ...next, wallets: { ...next.wallets, reserved: 0 } };
  const key = `settle:${auction.id}`;
  if (auction.status !== 'settled' || auction.winnerId !== profile.id || next.idempotency.includes(key)) return next;
  const price = highBid(auction);
  const paid = credit(next, -price, 'auction', auction.id);
  if (!paid.ok) return next;
  const item = {
    ...auction.item,
    ownerId: profile.id,
    status: 'held' as const,
    location: 'vault' as const,
    acquisitionPrice: price,
    acquiredAt: profile.tick,
    provenance: [...auction.item.provenance, 'won at auction'],
  };
  return refreshRequests({
    ...paid.value,
    inventory: [...paid.value.inventory, item],
    wallets: { ...paid.value.wallets, reserved: 0 },
    idempotency: [...paid.value.idempotency, key],
    transactions: [
      ...paid.value.transactions,
      {
        id: key,
        tick: profile.tick,
        kind: 'auction',
        instanceId: item.id,
        amount: -price,
        note: `Won ${definition(item.definitionId).name}`,
      },
    ],
  });
};

export const openAuction = (profile: Profile, key: string): Result<Profile> =>
  once(profile, key, (current) => {
    if (current.auction?.status === 'open') return fail('An auction is already on the block.');
    const rules = resolveRules();
    const rng = mulberry32(current.rngState);
    const def = DEFINITIONS[rng.int(DEFINITIONS.length)]!;
    const item = instantiate(def, rng, `auc-item-${current.seed}-${current.tick}`, null, current.tick);
    const quote = appraise(def, item, marketContext(current));
    const auction = createAuction(`auc-${current.seed}-${current.tick}`, item, {
      reserve: Math.max(rules.auctionIncrement, mulBps(quote.mid, 9_200)),
      increment: rules.auctionIncrement,
      ticks: rules.auctionTicks,
      antiSnipeWindow: rules.auctionAntiSnipeWindow,
      antiSnipeAdd: rules.auctionAntiSnipeAdd,
      maxExtensions: rules.auctionMaxExtensions,
    });
    return ok(track(applyAuction({ ...current, rngState: rng.state() }, auction), 'auction_join'));
  });

export const bidInAuction = (profile: Profile, amount: number, key: string): Result<Profile> =>
  once(profile, key, (current) => {
    if (!current.auction || current.auction.status !== 'open') return fail('There is no open auction.');
    const available = current.wallets.permanent - current.wallets.reserved + escrowOf(current, current.auction);
    const placed = placeAuctionBid(current.auction, {
      bidderId: current.id,
      label: current.name,
      amount,
      simulated: false,
      available,
    });
    if (!placed.ok) return placed;
    return ok(applyAuction(current, placed.value));
  });

export const withdrawAuctionBid = (profile: Profile): Result<Profile> => {
  if (!profile.auction || profile.auction.status !== 'open') return fail('There is no open auction.');
  const pulled = withdrawPlayerBids(profile.auction, profile.id);
  if (!pulled.ok) return pulled;
  return ok(applyAuction(profile, pulled.value));
};

export const cancelCurrentAuction = (profile: Profile): Result<Profile> => {
  if (!profile.auction) return fail('There is no auction to cancel.');
  const cancelled = cancelAuction(profile.auction);
  if (!cancelled.ok) return cancelled;
  return ok(applyAuction(profile, cancelled.value));
};

export const tickAuctionProfile = (profile: Profile, allowSimulated = true): Profile => {
  if (!profile.auction || profile.auction.status !== 'open') return profile;
  const quote = appraise(definition(profile.auction.item.definitionId), profile.auction.item, marketContext(profile));
  const cap = Math.max(profile.auction.increment, mulBps(quote.liquidation, 11_000));
  const rng = mulberry32(profile.rngState);
  const ticked = tickAuction(profile.auction, cap, rng, allowSimulated);
  return { ...applyAuction(profile, ticked), rngState: rng.state() };
};

export const balancesMatchLedger = (profile: Profile): boolean => {
  const sum = profile.ledger.reduce((total, entry) => total + entry.amount, 0);
  const ids = [...profile.inventory, ...profile.listings].map((item) => item.id);
  return (
    sum === profile.wallets.permanent &&
    profile.wallets.cosmetic === 0 &&
    profile.wallets.reserved >= 0 &&
    profile.wallets.reserved <= profile.wallets.permanent &&
    new Set(ids).size === ids.length &&
    profile.wallets.permanent >= 0
  );
};
