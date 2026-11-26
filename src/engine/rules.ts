import type { Rarity, Rules } from './types.js';

export const CURRENT_RULES_VERSION = 'zaisaku-v0.1';

export const DEFAULT_RULES: Rules = {
  version: CURRENT_RULES_VERSION,
  startingCash: 1000,
  rounds: 6,
  objectsPerRound: 3,
  minBid: 20,
  bidIncrement: 5,
  lingerRounds: 2,
  decisionMs: 20_000,
  askSpreadBps: 10_800,
  bidSpreadBps: 8_600,
  appraisalBandBps: 1_000,
  conditionFloorBps: 5_500,
  conditionSpanBps: 4_500,
  rarityBps: { common: 10_000, uncommon: 11_500, rare: 14_000, singular: 18_000 },
  counterfeitBps: 4_500,
  demandMinBps: 5_000,
  demandMaxBps: 18_000,
  nullMagnetFallbackBps: 8_500,
  damagedBelow: 70,
  startingPermanent: 2_400,
  marketListings: 6,
  requestLifetime: 18,
  auctionTicks: 36,
  auctionAntiSnipeWindow: 8,
  auctionAntiSnipeAdd: 8,
  auctionMaxExtensions: 3,
  auctionIncrement: 10,
  ceramicMarkdown: 4,
  ceramicConditionFloor: 40,
};

export const RULES_VERSIONS: Readonly<Record<string, Rules>> = Object.freeze({
  [CURRENT_RULES_VERSION]: Object.freeze({
    ...DEFAULT_RULES,
    rarityBps: Object.freeze({ ...DEFAULT_RULES.rarityBps }),
  }),
});

export const rulesFor = (version: string): Rules | null => {
  const found = Object.hasOwn(RULES_VERSIONS, version) ? RULES_VERSIONS[version] : undefined;
  if (!found) return null;
  return { ...found, rarityBps: { ...found.rarityBps } };
};

export const resolveRules = (over?: Partial<Rules>): Rules => {
  const base = rulesFor(CURRENT_RULES_VERSION)!;
  const rarityBps = { ...base.rarityBps, ...(over?.rarityBps ?? {}) } as Record<Rarity, number>;
  return { ...base, ...over, rarityBps, version: over?.version ?? base.version };
};

/** Documented order. Each step runs at most once per object per round. */
export const RESOLUTION_ORDER = [
  'validate',
  'inspect',
  'sell',
  'bid',
  'on-inspection',
  'on-sale',
  'on-acquisition',
  'while-held',
  'round-end',
  'contracts',
  'linger-and-deal',
  'round-start',
] as const;
