import { describe, expect, it } from 'vitest';
import { definition } from '../src/engine/definitions.js';
import { createDuel, expire, submit } from '../src/engine/duel.js';
import { buildDuelContext } from '../src/engine/context.js';
import { appraise } from '../src/engine/valuation.js';
import { publicSnapshot, viewFor } from '../src/engine/view.js';
import type { DuelState } from '../src/engine/types.js';

const withOffer = (defId: string): DuelState => {
  for (let seed = 1; seed < 300; seed += 1) {
    const state = createDuel(seed);
    if (state.offered.some((offer) => offer.item.definitionId === defId)) return state;
  }
  throw new Error(`No opening offer for ${defId}`);
};

const lock = (state: DuelState, amount: number, defId?: string): DuelState => {
  const offer = defId ? state.offered.find((row) => row.item.definitionId === defId)! : state.offered[0]!;
  const first = submit(state, 'p0', { type: 'bid', instanceId: offer.item.id, amount });
  if (!first.ok) throw new Error(first.reason);
  const second = submit(first.value, 'p1', { type: 'pass' });
  if (!second.ok) throw new Error(second.reason);
  return second.value;
};

describe('bids', () => {
  it('rejects a low, off-increment or unfunded bid and leaves the table untouched', () => {
    const state = createDuel(4);
    const id = state.offered[0]!.item.id;
    expect(submit(state, 'p0', { type: 'bid', instanceId: id, amount: 7 }).ok).toBe(false);
    expect(submit(state, 'p0', { type: 'bid', instanceId: id, amount: 22 }).ok).toBe(false);
    expect(submit(state, 'p0', { type: 'bid', instanceId: id, amount: 1005 }).ok).toBe(false);
    expect(submit(state, 'p0', { type: 'bid', instanceId: 'missing', amount: 20 }).ok).toBe(false);
    expect(state.players.p0.cash).toBe(1000);
  });

  it('sells an uncontested lot at the bid and lets an outbid player keep their money', () => {
    const state = createDuel(6);
    const id = state.offered[0]!.item.id;
    const bought = lock(state, 100);
    const owner = bought.players.p0.inventory.find((item) => item.id === id);
    expect(owner?.acquisitionPrice).toBe(100);
    expect(bought.players.p0.cash).toBe(1000 - 100 + bought.players.p0.contractRewards);
    expect(bought.players.p1.cash).toBe(1000 + bought.players.p1.contractRewards);

    const contested = createDuel(8);
    const lot = contested.offered[1]!.item.id;
    const p0 = submit(contested, 'p0', { type: 'bid', instanceId: lot, amount: 100 });
    if (!p0.ok) throw new Error(p0.reason);
    const p1 = submit(p0.value, 'p1', { type: 'bid', instanceId: lot, amount: 150 });
    if (!p1.ok) throw new Error(p1.reason);
    expect(p1.value.players.p1.inventory.some((item) => item.id === lot)).toBe(true);
    expect(p1.value.players.p0.inventory.some((item) => item.id === lot)).toBe(false);
    expect(p1.value.players.p0.cash).toBe(1000 + p1.value.players.p0.contractRewards);
    expect(p1.value.players.p1.cash).toBe(1000 - 150 + p1.value.players.p1.contractRewards);
  });

  it('leaves a lot unsold when the sealed bids are equal', () => {
    const state = createDuel(9);
    const id = state.offered[0]!.item.id;
    const p0 = submit(state, 'p0', { type: 'bid', instanceId: id, amount: 80 });
    if (!p0.ok) throw new Error(p0.reason);
    const p1 = submit(p0.value, 'p1', { type: 'bid', instanceId: id, amount: 80 });
    if (!p1.ok) throw new Error(p1.reason);
    expect(p1.value.players.p0.inventory.some((item) => item.id === id)).toBe(false);
    expect(p1.value.players.p1.inventory.some((item) => item.id === id)).toBe(false);
    expect(p1.value.offered.some((offer) => offer.item.id === id) || p1.value.round === 2).toBe(true);
    expect(p1.value.log.some((line) => line.includes('Equal bids'))).toBe(true);
    expect(p1.value.players.p0.cash).toBe(1000 + p1.value.players.p0.contractRewards);
  });
});

describe('duel resolution', () => {
  it('draws a match where both players only hold', () => {
    let state = createDuel(3, { rules: { rounds: 3 } });
    while (state.phase !== 'complete') {
      const a = submit(state, 'p0', { type: 'pass' });
      if (!a.ok) throw new Error(a.reason);
      const b = submit(a.value, 'p1', { type: 'pass' });
      if (!b.ok) throw new Error(b.reason);
      state = b.value;
    }
    expect(state.result?.winner).toBe('draw');
    const [left, right] = state.result!.scores;
    expect(left.netWorth).toBe(right.netWorth);
    expect(left.netWorth).toBe(left.cash + left.inventoryValue);
    expect(left.profit).toBe(left.netWorth - left.starting);
  });

  it('passes a player who lets the round expire', () => {
    const state = createDuel(11);
    const first = expire(state, 'p0');
    if (!first.ok) throw new Error(first.reason);
    expect(first.value.phase).toBe('decide');
    expect(first.value.decisions.p0).toEqual({ type: 'pass' });
    const second = expire(first.value, 'p1');
    if (!second.ok) throw new Error(second.reason);
    expect(second.value.round).toBe(2);
    expect(second.value.log.some((line) => line.includes('clock'))).toBe(true);
  });

  it('hides contracts, sealed bids, papers and future event detail', () => {
    const state = createDuel(12);
    const snap = JSON.stringify(publicSnapshot(state));
    expect(snap).not.toContain(state.players.p0.contract.description);
    expect(snap).not.toContain(state.players.p1.contract.description);
    const opponent = JSON.stringify(viewFor(state, 'p1'));
    expect(opponent).not.toContain(state.players.p0.contract.description);
    for (const event of state.events.filter((item) => item.startRound > state.round)) {
      expect(opponent).not.toContain(event.summary);
    }

    const id = state.offered[0]!.item.id;
    const secret = definition(state.offered[0]!.item.definitionId).inspectionProps.find((prop) => prop.key === 'secret')!.value;
    const sealed = submit(state, 'p0', { type: 'bid', instanceId: id, amount: 345 });
    if (!sealed.ok) throw new Error(sealed.reason);
    const hiddenBid = JSON.stringify(viewFor(sealed.value, 'p1'));
    expect(viewFor(sealed.value, 'p1').opponentLocked).toBe(true);
    expect(hiddenBid).not.toContain('345');

    const looked = submit(state, 'p0', { type: 'inspect', instanceId: id });
    if (!looked.ok) throw new Error(looked.reason);
    const done = submit(looked.value, 'p1', { type: 'pass' });
    if (!done.ok) throw new Error(done.reason);
    const mine = viewFor(done.value, 'p0');
    const theirs = JSON.stringify(viewFor(done.value, 'p1'));
    const seen = [...mine.offers, ...mine.inventory].find((item) => item.instanceId === id);
    expect(seen?.revealed.some((note) => note.key === 'condition-exact')).toBe(true);
    expect(seen?.conditionExact).not.toBeNull();
    expect(theirs).not.toContain(secret);
    const theirItem = viewFor(done.value, 'p1').offers.find((item) => item.instanceId === id);
    expect(theirItem?.conditionExact).toBeNull();
    expect(theirItem?.authenticity).toBeNull();
  });

  it('is the same match twice from the same seed', () => {
    const a = createDuel(21);
    const b = createDuel(21);
    expect(a.offered.map((offer) => offer.item.serial)).toEqual(b.offered.map((offer) => offer.item.serial));
    expect(createDuel(21).offered.map((offer) => offer.item.condition).join()).not.toBe(
      createDuel(22).offered.map((offer) => offer.item.condition).join(),
    );
  });
});

describe('effects in a match', () => {
  it('lets the amber hourglass gain value for each round it is held', () => {
    const opened = withOffer('amber-hourglass');
    const held = lock(opened, 40, 'amber-hourglass');
    const item = held.players.p0.inventory.find((owned) => owned.definitionId === 'amber-hourglass')!;
    expect(item.effectState.roundsHeld).toBe(1);
    const bare = appraise(definition(item.definitionId), { ...item, effectState: {} }, buildDuelContext(held, 'p0', true));
    const warm = appraise(definition(item.definitionId), item, buildDuelContext(held, 'p0', true));
    expect(warm.liquidation).toBeGreaterThan(bare.liquidation);
  });

  it('warns, then damages one other object once, and never destroys it', () => {
    let state = withOffer('red-box');
    state = lock(state, 40, 'red-box');
    let guard = 0;
    while (!state.log.some((line) => line.includes('damaged')) && state.phase !== 'complete' && guard < 8) {
      guard += 1;
      const offer = state.offered[0];
      if (state.players.p0.inventory.length < 2 && offer && state.players.p0.cash >= 40) {
        const bid = submit(state, 'p0', { type: 'bid', instanceId: offer.item.id, amount: 40 });
        if (!bid.ok) throw new Error(bid.reason);
        const pass = submit(bid.value, 'p1', { type: 'pass' });
        if (!pass.ok) throw new Error(pass.reason);
        state = pass.value;
      } else {
        const a = submit(state, 'p0', { type: 'pass' });
        if (!a.ok) throw new Error(a.reason);
        const b = submit(a.value, 'p1', { type: 'pass' });
        if (!b.ok) throw new Error(b.reason);
        state = b.value;
      }
    }
    expect(state.log.some((line) => line.includes('warm'))).toBe(true);
    expect(state.log.some((line) => line.includes('damaged'))).toBe(true);
    const box = state.players.p0.inventory.find((item) => item.definitionId === 'red-box');
    expect(box).toBeTruthy();
    expect(state.players.p0.inventory.every((item) => item.condition >= 20)).toBe(true);
    const notes = state.log.filter((line) => line.includes('damaged')).length;
    const more = submit(submit(state, 'p0', { type: 'pass' }).ok ? (submit(state, 'p0', { type: 'pass' }) as { ok: true; value: DuelState }).value : state, 'p1', { type: 'pass' });
    if (more.ok && more.value.phase !== 'complete') {
      expect(more.value.log.filter((line) => line.includes('damaged')).length).toBe(notes);
    }
  });

  it('reveals an extra paper when the memory lens is held', () => {
    let state = withOffer('memory-lens');
    state = lock(state, 40, 'memory-lens');
    const target = state.offered[0]!;
    const looked = submit(state, 'p0', { type: 'inspect', instanceId: target.item.id });
    if (!looked.ok) throw new Error(looked.reason);
    const done = submit(looked.value, 'p1', { type: 'pass' });
    if (!done.ok) throw new Error(done.reason);
    const known = done.value.players.p0.known[target.item.id] ?? [];
    expect(known.length).toBe(2);
  });

  it('dampens electronics after the null magnet is taken', () => {
    const opened = withOffer('null-magnet');
    const before = buildDuelContext(opened, null, false);
    const held = lock(opened, 40, 'null-magnet');
    const after = buildDuelContext(held, 'p0', false);
    expect(after.nullMagnetBps).toBe(8500);
    const radio = definition('silent-telephone');
    const sample = opened.offered.find((offer) => offer.item.definitionId !== 'null-magnet')!.item;
    const radioDef = sample.definitionId === 'silent-telephone' ? radio : definition('pocket-static');
    const probe = { ...sample, definitionId: radioDef.id };
    expect(appraise(radioDef, probe, after).mid).toBeLessThan(appraise(radioDef, probe, before).mid);
  });
});
