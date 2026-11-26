import { describe, expect, it } from 'vitest';
import { createAuction, placeAuctionBid, settleAuction, tickAuction } from '../src/engine/auction.js';
import { contractAchievable, evaluateContract, makeContract, refreshContract, templateById } from '../src/engine/contracts.js';
import { DEFINITIONS, definition } from '../src/engine/definitions.js';
import { instantiate } from '../src/engine/instances.js';
import { mulberry32 } from '../src/engine/prng.js';
import {
  advanceMarket,
  balancesMatchLedger,
  bidInAuction,
  buyListing,
  cancelCurrentAuction,
  createProfile,
  openAuction,
  sellOwned,
  tickAuctionProfile,
} from '../src/economy/profile.js';
import { decodeSave, defaultSettings } from '../src/persist/save.js';
import { createDuel, submit } from '../src/engine/duel.js';
import type { ItemInstance } from '../src/engine/types.js';

describe('contracts', () => {
  it('tracks progress, pays once, and rejects an impossible ask', () => {
    const held = ['silent-telephone', 'orchid-vessel', 'paper-charm']
      .map((id) => DEFINITIONS.find((def) => def.id === id)!)
      .map(
        (def, index): ItemInstance => ({
          id: `c-${index}`,
          definitionId: def.id,
          ownerId: 'p',
          condition: 90,
          authenticity: 'genuine',
          acquiredAt: 1,
          acquisitionPrice: 10,
          status: 'held',
          revealedProps: [],
          serial: 'C',
          provenance: [],
          effectState: {},
          location: 'vault',
        }),
      );
    const ctx = { held, sales: [], known: {}, round: 1, damagedBelow: 70 };
    const evaluated = evaluateContract('three-categories', ctx);
    expect(evaluated.done).toBe(true);
    const contract = makeContract(templateById('three-categories'), 'r1', 'persistent', 0);
    const first = refreshContract(contract, ctx);
    expect(first.justCompleted).toBe(true);
    const paid = { ...first.contract, rewardPaid: true, status: 'complete' as const };
    expect(refreshContract(paid, ctx).justCompleted).toBe(false);

    const one = DEFINITIONS.filter((def) => def.category === 'ceramics').slice(0, 1);
    expect(contractAchievable('matching-pair', one, { rounds: 6, upside: false })).toBe(false);
    expect(contractAchievable('three-categories', one, { rounds: 6, upside: false })).toBe(false);
    expect(contractAchievable('hold-three-rounds', DEFINITIONS, { rounds: 2, upside: false })).toBe(false);
    expect(contractAchievable('two-timepieces', DEFINITIONS, { rounds: 6, upside: true })).toBe(true);
    expect(contractAchievable('matching-pair', DEFINITIONS, { rounds: 6, upside: true })).toBe(true);
  });
});

describe('persistent economy', () => {
  it('keeps the ledger honest, refuses a second sale, and loses money on an immediate flip', () => {
    let profile = createProfile('Ada', 5);
    expect(balancesMatchLedger(profile)).toBe(true);
    expect(profile.wallets.cosmetic).toBe(0);
    const listing = profile.listings[0]!;
    const bought = buyListing(profile, listing.id, 'buy-1');
    if (!bought.ok) throw new Error(bought.reason);
    profile = bought.value;
    expect(profile.inventory).toHaveLength(1);
    expect(profile.inventory[0]!.ownerId).toBe(profile.id);
    expect(profile.listings.some((item) => item.id === listing.id)).toBe(false);
    expect(buyListing(profile, listing.id, 'buy-2').ok).toBe(false);
    const replay = buyListing(profile, listing.id, 'buy-1');
    expect(replay.ok && replay.duplicate).toBe(true);
    if (replay.ok) expect(replay.value.wallets.permanent).toBe(profile.wallets.permanent);

    const sold = sellOwned(profile, profile.inventory[0]!.id, 'sell-1');
    if (!sold.ok) throw new Error(sold.reason);
    expect(sold.value.wallets.permanent).toBeLessThan(createProfile('Ada', 5).wallets.permanent);
    expect(sold.value.inventory).toHaveLength(0);
    expect(sellOwned(sold.value, listing.id, 'sell-2').ok).toBe(false);
    expect(balancesMatchLedger(sold.value)).toBe(true);
    expect(sold.value.wallets.cosmetic).toBe(0);
  });

  it('completes the opening request once', () => {
    let profile = createProfile('Bea', 2);
    const seen = new Set<string>();
    let guard = 0;
    while (profile.requests[0]!.status !== 'complete' && guard < 12) {
      guard += 1;
      const listing = profile.listings.find((item) => !seen.has(definition(item.definitionId).category));
      if (!listing) {
        profile = advanceMarket(profile);
        continue;
      }
      seen.add(definition(listing.definitionId).category);
      const bought = buyListing(profile, listing.id, `cat-${guard}`);
      if (!bought.ok) {
        profile = advanceMarket(profile);
        continue;
      }
      profile = bought.value;
    }
    expect(profile.requests.some((request) => request.templateId === 'three-categories' && request.rewardPaid)).toBe(true);
    const paid = profile.ledger.filter((entry) => entry.reason === 'contract');
    expect(paid).toHaveLength(1);
    expect(balancesMatchLedger(profile)).toBe(true);
  });

  it('moves the market without touching the vault', () => {
    const profile = createProfile('Cy', 9);
    const vaultBefore = profile.inventory.map((item) => item.condition);
    const moved = advanceMarket(advanceMarket(profile));
    expect(moved.tick).toBe(2);
    expect(moved.notifications.some((notice) => notice.text.length > 0)).toBe(true);
    expect(moved.inventory.map((item) => item.condition)).toEqual(vaultBefore);
    expect(moved.wallets.permanent).toBe(profile.wallets.permanent);
    expect(balancesMatchLedger(moved)).toBe(true);
  });
});

describe('auctions', () => {
  it('settles a winning bid, refunds a bid under reserve, and releases escrow on cancel', () => {
    const rng = mulberry32(1);
    const item = instantiate(definition('moon-clock'), rng, 'lot-a', null, 0);
    let auction = createAuction('a1', item, {
      reserve: 500,
      increment: 10,
      ticks: 4,
      antiSnipeWindow: 8,
      antiSnipeAdd: 8,
      maxExtensions: 3,
    });
    const low = placeAuctionBid(auction, { bidderId: 'collector-1', label: 'Ada', amount: 100, simulated: false, available: 1000 });
    if (!low.ok) throw new Error(low.reason);
    let clock = low.value;
    while (clock.status === 'open') clock = tickAuction(clock, 0, rng, false);
    expect(clock.status).toBe('refunded');
    expect(settleAuction(clock).status).toBe('refunded');

    auction = { ...auction, reserve: 80, remainingTicks: 5 };
    const sniped = placeAuctionBid(auction, { bidderId: 'collector-1', label: 'Ada', amount: 80, simulated: false, available: 1000 });
    if (!sniped.ok) throw new Error(sniped.reason);
    expect(sniped.value.remainingTicks).toBe(13);
    expect(sniped.value.extensions).toBe(1);

    let profile = createProfile('Ada', 4);
    const opened = openAuction(profile, 'open-1');
    if (!opened.ok) throw new Error(opened.reason);
    profile = opened.value;
    const amount = profile.auction!.increment;
    const bid = bidInAuction(profile, amount, 'bid-1');
    if (!bid.ok) throw new Error(bid.reason);
    profile = bid.value;
    expect(profile.wallets.reserved).toBe(amount);
    expect(profile.wallets.permanent).toBe(2400);
    const cancelled = cancelCurrentAuction(profile);
    if (!cancelled.ok) throw new Error(cancelled.reason);
    expect(cancelled.value.wallets.reserved).toBe(0);
    expect(cancelled.value.wallets.permanent).toBe(2400);
    expect(cancelled.value.inventory).toHaveLength(0);
    expect(balancesMatchLedger(cancelled.value)).toBe(true);

    profile = createProfile('Ada', 4);
    const again = openAuction(profile, 'open-2');
    if (!again.ok) throw new Error(again.reason);
    profile = again.value;
    const reserve = profile.auction!.reserve;
    const winning = bidInAuction(profile, reserve, 'bid-win');
    if (!winning.ok) throw new Error(winning.reason);
    profile = winning.value;
    let steps = 0;
    while (profile.auction?.status === 'open' && steps < 80) {
      profile = tickAuctionProfile(profile, false);
      steps += 1;
    }
    expect(profile.auction?.status).toBe('settled');
    expect(profile.auction?.winnerId).toBe(profile.id);
    expect(profile.inventory).toHaveLength(1);
    expect(profile.wallets.permanent).toBe(2400 - reserve);
    expect(profile.wallets.reserved).toBe(0);
    const replay = tickAuctionProfile(profile, false);
    expect(replay.wallets.permanent).toBe(profile.wallets.permanent);
    expect(replay.inventory).toHaveLength(1);
    expect(balancesMatchLedger(replay)).toBe(true);
  });
});

describe('persistence', () => {
  it('reloads a valid save, migrates v0, and refuses a corrupt wallet or a broken file', () => {
    let duel = createDuel(15, { rules: { rounds: 2 } });
    const passed = submit(duel, 'p0', { type: 'pass' });
    if (!passed.ok) throw new Error(passed.reason);
    const both = submit(passed.value, 'p1', { type: 'pass' });
    if (!both.ok) throw new Error(both.reason);
    duel = both.value;
    const profile = createProfile('Ada', 6);
    const raw = JSON.stringify({ version: 1, profile, duel, settings: defaultSettings(), lastResult: null });
    const loaded = decodeSave(raw);
    expect(loaded?.version).toBe(2);
    expect(loaded?.world.locationId).toBe('district-01');
    expect(loaded?.profile.wallets.permanent).toBe(profile.wallets.permanent);
    expect(loaded?.duel?.round).toBe(duel.round);
    expect(loaded?.duel?.players.p0.cash).toBe(duel.players.p0.cash);

    const tampered = JSON.parse(raw) as { duel: { players: { p0: { cash: number } } }; profile: { wallets: { permanent: number } } };
    tampered.duel.players.p0.cash = 999_999;
    const repaired = decodeSave(JSON.stringify(tampered));
    expect(repaired?.duel?.players.p0.cash).toBe(duel.players.p0.cash);

    tampered.profile.wallets.permanent = 1;
    expect(decodeSave(JSON.stringify(tampered))).toBeNull();
    expect(decodeSave('{')).toBeNull();
    expect(decodeSave('{"version":1}')).toBeNull();

    const migrated = decodeSave(JSON.stringify({ version: 0, name: 'Ada', permanent: 100, seed: 3 }));
    expect(migrated?.profile.name).toBe('Ada');
    expect(migrated?.profile.wallets.permanent).toBe(100);
    expect(migrated?.profile.ledger.reduce((sum, entry) => sum + entry.amount, 0)).toBe(100);
  });
});
