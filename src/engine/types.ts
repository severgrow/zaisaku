export type Category = 'electronics' | 'timekeeping' | 'optical' | 'ceramics' | 'curiosities' | 'magical';
export type Rarity = 'common' | 'uncommon' | 'rare' | 'singular';
export type Authenticity = 'genuine' | 'counterfeit';
export type ItemStatus = 'offered' | 'held' | 'listed' | 'escrow' | 'retired';
export type ItemLocation = 'duel' | 'market' | 'vault' | 'auction' | 'house';
export type EffectType =
  | 'amber_hourglass'
  | 'null_magnet'
  | 'red_box'
  | 'tomorrow_receiver'
  | 'twins'
  | 'memory_lens';
export type PlayerId = 'p0' | 'p1';
export type ContractStatus = 'active' | 'complete' | 'expired';
export type ContractScope = 'match' | 'persistent';

export const CATEGORIES: readonly Category[] = [
  'electronics',
  'timekeeping',
  'optical',
  'ceramics',
  'curiosities',
  'magical',
];
export const RARITIES: readonly Rarity[] = ['common', 'uncommon', 'rare', 'singular'];
export const EFFECT_TYPES: readonly EffectType[] = [
  'amber_hourglass',
  'null_magnet',
  'red_box',
  'tomorrow_receiver',
  'twins',
  'memory_lens',
];
export const PLAYERS: readonly PlayerId[] = ['p0', 'p1'];

export interface EffectDef {
  type: EffectType;
  params: Readonly<Record<string, number | string>>;
}

export interface InspectionProp {
  key: string;
  label: string;
  hidden: boolean;
  value: string;
}

export interface ItemDefinition {
  id: string;
  name: string;
  description: string;
  lore: string;
  category: Category;
  manufacturer: string;
  era: string;
  rarity: Rarity;
  baseValue: number;
  conditionRange: readonly [number, number];
  collection: string | null;
  tags: readonly string[];
  artworkRef: string;
  supply: number;
  tradeable: boolean;
  inspectionProps: readonly InspectionProp[];
  effectDefs: readonly EffectDef[];
  eventSensitivities: readonly string[];
  version: number;
}

export interface ItemInstance {
  id: string;
  definitionId: string;
  ownerId: string | null;
  condition: number;
  authenticity: Authenticity;
  acquiredAt: number;
  acquisitionPrice: number;
  status: ItemStatus;
  revealedProps: readonly string[];
  serial: string;
  provenance: readonly string[];
  effectState: Readonly<Record<string, number | string | boolean>>;
  location: ItemLocation;
}

export interface Quote {
  mid: number;
  ask: number;
  liquidation: number;
  low: number;
  high: number;
}

export type DuelAction =
  | { type: 'bid'; instanceId: string; amount: number }
  | { type: 'sell'; instanceId: string }
  | { type: 'inspect'; instanceId: string }
  | { type: 'pass' };

export type Result<T> = { ok: true; value: T; duplicate: boolean } | { ok: false; reason: string };

export const ok = <T>(value: T, duplicate = false): Result<T> => ({ ok: true, value, duplicate });
export const fail = <T>(reason: string): Result<T> => ({ ok: false, reason });

export interface SaleRecord {
  instanceId: string;
  definitionId: string;
  category: Category;
  price: number;
  acquisitionPrice: number;
  round: number;
}

export interface ContractInstance {
  instanceId: string;
  templateId: string;
  title: string;
  description: string;
  reward: number;
  target: number;
  scope: ContractScope;
  status: ContractStatus;
  progress: number;
  rewardPaid: boolean;
  assignedTick: number;
}

export interface MatchEvent {
  id: string;
  name: string;
  startRound: number;
  endRound: number;
  categories: readonly Category[];
  tags: readonly string[];
  manufacturers: readonly string[];
  rarities: readonly Rarity[];
  demandBps: number;
  supplyBps: number;
  rumour: string;
  warning: string;
  summary: string;
}

export interface EventTemplate {
  id: string;
  name: string;
  categories: readonly Category[];
  tags: readonly string[];
  manufacturers: readonly string[];
  rarities: readonly Rarity[];
  demandBps: number;
  supplyBps: number;
  rumour: string;
  warning: string;
  summary: string;
}

export interface Offered {
  item: ItemInstance;
  arrivedRound: number;
  revealed: Record<PlayerId, readonly string[]>;
}

export interface DuelPlayer {
  id: PlayerId;
  name: string;
  simulated: boolean;
  cash: number;
  inventory: ItemInstance[];
  known: Readonly<Record<string, readonly string[]>>;
  contract: ContractInstance;
  contractRewards: number;
  sales: SaleRecord[];
  warnings: readonly string[];
  knowledge: { eventId: string; name: string; summary: string } | null;
  actions: DuelAction[];
}

export interface RoundRecord {
  round: number;
  notes: readonly string[];
  actions: Record<PlayerId, DuelAction>;
}

export interface ScoreLine {
  player: PlayerId;
  name: string;
  starting: number;
  cash: number;
  inventoryValue: number;
  contractRewards: number;
  netWorth: number;
  profit: number;
}

export interface MatchResult {
  scores: readonly [ScoreLine, ScoreLine];
  winner: PlayerId | 'draw';
  decisions: readonly RoundRecord[];
}

export interface ActionLogEntry {
  player: PlayerId;
  action: DuelAction;
  expired: boolean;
}

export interface DuelState {
  rulesVersion: string;
  rules: Rules;
  seed: number;
  rngState: number;
  round: number;
  phase: 'decide' | 'complete';
  players: Record<PlayerId, DuelPlayer>;
  offered: Offered[];
  queue: ItemInstance[];
  events: MatchEvent[];
  decisions: Record<PlayerId, DuelAction | null>;
  expired: Record<PlayerId, boolean>;
  log: string[];
  rounds: RoundRecord[];
  result: MatchResult | null;
  actionLog: ActionLogEntry[];
}

export interface Rules {
  version: string;
  startingCash: number;
  rounds: number;
  objectsPerRound: number;
  minBid: number;
  bidIncrement: number;
  lingerRounds: number;
  decisionMs: number;
  askSpreadBps: number;
  bidSpreadBps: number;
  appraisalBandBps: number;
  conditionFloorBps: number;
  conditionSpanBps: number;
  rarityBps: Record<Rarity, number>;
  counterfeitBps: number;
  demandMinBps: number;
  demandMaxBps: number;
  nullMagnetFallbackBps: number;
  damagedBelow: number;
  startingPermanent: number;
  marketListings: number;
  requestLifetime: number;
  auctionTicks: number;
  auctionAntiSnipeWindow: number;
  auctionAntiSnipeAdd: number;
  auctionMaxExtensions: number;
  auctionIncrement: number;
  ceramicMarkdown: number;
  ceramicConditionFloor: number;
}

export interface ValueContext {
  rules: Rules;
  categoryDemand: Partial<Record<Category, number>>;
  tagDemand: Readonly<Record<string, number>>;
  manufacturerDemand: Readonly<Record<string, number>>;
  rarityDemand: Partial<Record<Rarity, number>>;
  categorySupply: Partial<Record<Category, number>>;
  tagSupply: Readonly<Record<string, number>>;
  nullMagnetBps: number | null;
  twinsBonusBps: number | null;
  narrowed: boolean;
}

export interface RevealedNote {
  key: string;
  label: string;
  value: string;
}

export interface PublicItem {
  instanceId: string;
  definitionId: string;
  name: string;
  description: string;
  category: Category;
  manufacturer: string;
  era: string;
  rarity: Rarity;
  collection: string | null;
  tags: readonly string[];
  artworkRef: string;
  conditionWord: string;
  conditionExact: number | null;
  authenticity: Authenticity | null;
  quote: Quote;
  hiddenRemaining: number;
  revealed: readonly RevealedNote[];
  acquisitionPrice: number | null;
  warning: boolean;
  roundsHeld: number;
  tradeable: boolean;
  lingeringRounds: number | null;
}

export interface ContractView {
  id: string;
  title: string;
  description: string;
  progress: number;
  target: number;
  reward: number;
  status: ContractStatus;
}

export interface PlayerView {
  you: PlayerId;
  seed: number;
  round: number;
  maxRounds: number;
  phase: 'decide' | 'complete';
  minBid: number;
  increment: number;
  cash: number;
  opponentCash: number;
  youName: string;
  opponentName: string;
  opponentSimulated: boolean;
  youLocked: boolean;
  opponentLocked: boolean;
  offers: readonly PublicItem[];
  inventory: readonly PublicItem[];
  opponentInventory: readonly PublicItem[];
  contract: ContractView | null;
  warnings: readonly string[];
  knowledge: { name: string; summary: string } | null;
  activeEvents: readonly { name: string; summary: string }[];
  rumours: readonly string[];
  recentOpponentActions: readonly DuelAction['type'][];
  log: readonly string[];
  worth: { cash: number; inventoryValue: number; netWorth: number };
  result: MatchResult | null;
}

export interface AuctionBid {
  bidderId: string;
  label: string;
  amount: number;
  tick: number;
  simulated: boolean;
  withdrawn: boolean;
}

export type AuctionStatus = 'open' | 'settled' | 'refunded' | 'cancelled';

export interface Auction {
  id: string;
  item: ItemInstance;
  reserve: number;
  increment: number;
  remainingTicks: number;
  antiSnipeWindow: number;
  antiSnipeAdd: number;
  extensions: number;
  maxExtensions: number;
  bids: AuctionBid[];
  status: AuctionStatus;
  winnerId: string | null;
  tick: number;
}

export interface LedgerEntry {
  id: string;
  tick: number;
  amount: number;
  balanceAfter: number;
  reason: string;
  ref: string;
}

export interface TxRecord {
  id: string;
  tick: number;
  kind: 'buy' | 'sell' | 'auction' | 'reward' | 'adjust';
  instanceId: string | null;
  amount: number;
  note: string;
}

export interface PricePoint {
  tick: number;
  instanceId: string;
  ask: number;
  liquidation: number;
}

export interface Notice {
  id: string;
  text: string;
  seen: boolean;
}

export interface Profile {
  version: 1;
  id: string;
  name: string;
  seed: number;
  tick: number;
  rngState: number;
  wallets: { permanent: number; cosmetic: number; reserved: number };
  inventory: ItemInstance[];
  listings: ItemInstance[];
  ledger: LedgerEntry[];
  transactions: TxRecord[];
  requests: ContractInstance[];
  sales: SaleRecord[];
  auction: Auction | null;
  notifications: Notice[];
  priceHistory: PricePoint[];
  analytics: { counts: Record<string, number> };
  idempotency: string[];
}
