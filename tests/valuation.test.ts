import { describe, expect, it } from 'vitest';
import { validateCatalogue } from '../src/engine/catalogue.js';
import { DEFINITIONS, definition } from '../src/engine/definitions.js';
import { EVENT_TEMPLATES, activeAtTick, markCeramicListings } from '../src/engine/events.js';
import { appraise, contextFromEvents, emptyContext } from '../src/engine/valuation.js';
import { DEFAULT_RULES } from '../src/engine/rules.js';
import type { ItemInstance } from '../src/engine/types.js';

const piece = (defId: string, over: Partial<ItemInstance> = {}): ItemInstance => ({
  id: `t-${defId}`,
  definitionId: defId,
  ownerId: null,
  condition: 100,
  authenticity: 'genuine',
  acquiredAt: 0,
  acquisitionPrice: 0,
  status: 'listed',
  revealedProps: [],
  serial: 'T',
  provenance: [],
  effectState: {},
  location: 'market',
  ...over,
});

describe('valuation', () => {
  it('prices a plain object with the published spreads', () => {
    const def = { ...definition('wire-hymnal'), baseValue: 100, rarity: 'common' as const, tags: [], effectDefs: [], collection: null };
    const quote = appraise(def, piece(def.id), emptyContext());
    expect(quote.mid).toBe(100);
    expect(quote.ask).toBe(108);
    expect(quote.liquidation).toBe(86);
    expect(quote.ask).toBeGreaterThan(quote.liquidation);
  });

  it('cuts counterfeits and raises amber, twins and a hot market', () => {
    const def = { ...definition('wire-hymnal'), baseValue: 100, rarity: 'common' as const, tags: [], effectDefs: [], collection: null };
    expect(appraise(def, piece(def.id, { authenticity: 'counterfeit' }), emptyContext()).mid).toBe(45);
    const amber = definition('amber-hourglass');
    const cold = appraise(amber, piece(amber.id), emptyContext());
    const warm = appraise(amber, piece(amber.id, { effectState: { roundsHeld: 2 } }), emptyContext());
    expect(warm.mid).toBeGreaterThan(cold.mid);
    const twin = definition('twin-left');
    const alone = appraise(twin, piece(twin.id), emptyContext());
    const pair = appraise(twin, piece(twin.id), { ...emptyContext(), twinsBonusBps: 12_000 });
    expect(pair.mid).toBeGreaterThan(alone.mid);
    const moon = definition('moon-clock');
    const event = EVENT_TEMPLATES.find((item) => item.id === 'analog-revival')!;
    const boosted = appraise(
      moon,
      piece(moon.id, { condition: 80 }),
      contextFromEvents(DEFAULT_RULES, [event], { nullMagnetBps: null, twinsBonusBps: null, narrowed: false }),
    );
    expect(boosted.mid).toBeGreaterThan(appraise(moon, piece(moon.id, { condition: 80 }), emptyContext()).mid);
  });

  it('damps electronics while a null magnet is in the context', () => {
    const radio = definition('silent-telephone');
    const plain = appraise(radio, piece(radio.id), emptyContext());
    const damped = appraise(radio, piece(radio.id), { ...emptyContext(), nullMagnetBps: 8_500 });
    expect(damped.liquidation).toBeLessThan(plain.liquidation);
  });
});

describe('events', () => {
  it('repeats a seeded rotation and changes modifier by tick', () => {
    expect(activeAtTick(7, 1)).toEqual(activeAtTick(7, 1));
    expect(activeAtTick(7, 1)[0]?.id).toBe(activeAtTick(7, 2)[0]?.id);
    expect(activeAtTick(7, 3)[0]?.id).not.toBe(activeAtTick(7, 1)[0]?.id);
    expect(activeAtTick(7, 0)).toEqual([]);
  });

  it('marks down loose ceramics once per window and leaves other stock alone', () => {
    const event = EVENT_TEMPLATES.find((item) => item.id === 'ceramic-recall')!;
    const listing = piece('orchid-vessel', { condition: 80, location: 'market' });
    const once = markCeramicListings([listing], 1, [event], () => true, 4, 40);
    expect(once[0]!.condition).toBe(76);
    const sameWindow = markCeramicListings(once, 2, [event], () => true, 4, 40);
    expect(sameWindow[0]!.condition).toBe(76);
    const spared = markCeramicListings([piece('moon-clock', { condition: 80 })], 1, [event], (id) => id === 'orchid-vessel', 4, 40);
    expect(spared[0]!.condition).toBe(80);
    const low = piece('orchid-vessel', { condition: 42 });
    expect(markCeramicListings([low], 1, [event], () => true, 4, 40)[0]!.condition).toBe(40);
  });
});

describe('catalogue', () => {
  it('accepts the shipped catalogue', () => {
    expect(DEFINITIONS.length).toBeGreaterThanOrEqual(36);
    expect(validateCatalogue(DEFINITIONS)).toEqual([]);
  });

  it('rejects duplicate ids, missing artwork and unknown effects', () => {
    const broken = {
      ...DEFINITIONS[0]!,
      id: DEFINITIONS[1]!.id,
      artworkRef: '',
      effectDefs: [{ type: 'not-an-effect', params: { surprise: 1 } }],
    } as unknown as (typeof DEFINITIONS)[number];
    const issues = validateCatalogue([broken, broken]);
    expect(issues.some((issue) => issue.field === 'id')).toBe(true);
    expect(issues.some((issue) => issue.field === 'artworkRef')).toBe(true);
    expect(issues.some((issue) => issue.message.includes('Unknown effect'))).toBe(true);
  });
});
