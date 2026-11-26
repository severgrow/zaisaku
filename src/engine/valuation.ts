import { clamp, mulBps, mulBpsCeil, stateNum, supplyToPriceBps } from './money.js';
import { DEFAULT_RULES } from './rules.js';
import type { Category, EventTemplate, ItemDefinition, ItemInstance, Quote, Rarity, Rules, ValueContext } from './types.js';

export const emptyContext = (rules: Rules = DEFAULT_RULES): ValueContext => ({
  rules,
  categoryDemand: {},
  tagDemand: {},
  manufacturerDemand: {},
  rarityDemand: {},
  categorySupply: {},
  tagSupply: {},
  nullMagnetBps: null,
  twinsBonusBps: null,
  narrowed: false,
});

const bump = (current: number | undefined, bps: number): number => mulBps(current ?? 10_000, bps);

export const contextFromEvents = (
  rules: Rules,
  events: readonly EventTemplate[],
  extras: { nullMagnetBps: number | null; twinsBonusBps: number | null; narrowed: boolean },
): ValueContext => {
  const categoryDemand: Partial<Record<Category, number>> = {};
  const tagDemand: Record<string, number> = {};
  const manufacturerDemand: Record<string, number> = {};
  const rarityDemand: Partial<Record<Rarity, number>> = {};
  const categorySupply: Partial<Record<Category, number>> = {};
  const tagSupply: Record<string, number> = {};
  for (const event of events) {
    if (event.demandBps !== 10_000) {
      for (const category of event.categories) categoryDemand[category] = bump(categoryDemand[category], event.demandBps);
      for (const tag of event.tags) tagDemand[tag] = bump(tagDemand[tag], event.demandBps);
      for (const maker of event.manufacturers) manufacturerDemand[maker] = bump(manufacturerDemand[maker], event.demandBps);
      for (const rarity of event.rarities) rarityDemand[rarity] = bump(rarityDemand[rarity], event.demandBps);
    }
    if (event.supplyBps !== 10_000) {
      for (const category of event.categories) categorySupply[category] = bump(categorySupply[category], event.supplyBps);
      for (const tag of event.tags) tagSupply[tag] = bump(tagSupply[tag], event.supplyBps);
    }
  }
  return { rules, categoryDemand, tagDemand, manufacturerDemand, rarityDemand, categorySupply, tagSupply, ...extras };
};

/** The only price formula in the game. Ask is what the house charges. Liquidation is what it pays. */
export const appraise = (def: ItemDefinition, instance: ItemInstance, ctx: ValueContext): Quote => {
  const rules = ctx.rules;
  const conditionBps = rules.conditionFloorBps + Math.floor((rules.conditionSpanBps * instance.condition) / 100);
  const rarityBps = rules.rarityBps[def.rarity];
  let demand = 10_000;
  const category = ctx.categoryDemand[def.category];
  if (category !== undefined) demand = mulBps(demand, category);
  for (const tag of def.tags) {
    const mod = ctx.tagDemand[tag];
    if (mod !== undefined) demand = mulBps(demand, mod);
  }
  const maker = ctx.manufacturerDemand[def.manufacturer];
  if (maker !== undefined) demand = mulBps(demand, maker);
  const rarityMod = ctx.rarityDemand[def.rarity];
  if (rarityMod !== undefined) demand = mulBps(demand, rarityMod);
  demand = clamp(demand, rules.demandMinBps, rules.demandMaxBps);

  let supply = 10_000;
  const categorySupply = ctx.categorySupply[def.category];
  if (categorySupply !== undefined) supply = mulBps(supply, categorySupply);
  for (const tag of def.tags) {
    const mod = ctx.tagSupply[tag];
    if (mod !== undefined) supply = mulBps(supply, mod);
  }
  const supplyPrice = supplyToPriceBps(supply);

  let effect = 10_000;
  const amber = def.effectDefs.find((e) => e.type === 'amber_hourglass');
  if (amber) {
    const cap = Number(amber.params.capRounds);
    const per = Number(amber.params.perRoundBps);
    const held = Math.min(cap, stateNum(instance.effectState, 'roundsHeld'));
    effect += held * per;
  }
  if (ctx.twinsBonusBps !== null && def.collection === 'the-twins') effect = mulBps(effect, ctx.twinsBonusBps);
  if (ctx.nullMagnetBps !== null && def.category === 'electronics') effect = mulBps(effect, ctx.nullMagnetBps);
  if (instance.authenticity === 'counterfeit') effect = mulBps(effect, rules.counterfeitBps);

  let value = Math.max(1, def.baseValue);
  value = mulBps(value, conditionBps);
  value = mulBps(value, rarityBps);
  value = mulBps(value, demand);
  value = mulBps(value, supplyPrice);
  value = Math.max(1, mulBps(value, effect));

  let ask = Math.max(1, mulBpsCeil(value, rules.askSpreadBps));
  const liquidation = Math.max(1, mulBps(value, rules.bidSpreadBps));
  if (ask <= liquidation) ask = liquidation + 1;
  const band = ctx.narrowed ? Math.floor(rules.appraisalBandBps / 2) : rules.appraisalBandBps;
  const low = Math.max(1, value - mulBps(value, band));
  const high = value + mulBpsCeil(value, band);
  return { mid: value, ask, liquidation, low, high };
};

export const conditionWord = (n: number): string => {
  if (n < 40) return 'damaged';
  if (n < 55) return 'tired';
  if (n < 70) return 'worn';
  if (n < 85) return 'sound';
  return 'fine';
};
