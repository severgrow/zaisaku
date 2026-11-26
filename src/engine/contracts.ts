import { definition } from './definitions.js';
import { appraise, emptyContext } from './valuation.js';
import { DEFAULT_RULES } from './rules.js';
import type { ContractInstance, ContractScope, ItemDefinition, ItemInstance, Rules, SaleRecord } from './types.js';

export interface ContractTemplate {
  id: string;
  title: string;
  description: string;
  reward: number;
  target: number;
}

export const TEMPLATES: readonly ContractTemplate[] = [
  { id: 'two-timepieces', title: 'Two Clocks', description: 'Hold two timekeeping objects at once.', reward: 160, target: 2 },
  { id: 'same-maker', title: 'One Workshop', description: 'Hold two objects from the same manufacturer.', reward: 140, target: 2 },
  { id: 'three-categories', title: 'Three Rooms', description: 'Hold objects from three different categories.', reward: 180, target: 3 },
  { id: 'matching-pair', title: 'The Pair', description: 'Hold both of The Twins.', reward: 220, target: 2 },
  { id: 'sell-two-profit', title: 'Two Quiet Profits', description: 'Sell two objects for more than you paid.', reward: 200, target: 2 },
  { id: 'authenticated-rare', title: 'Papered Rare', description: 'Hold a rare or singular genuine object whose papers you have read.', reward: 190, target: 1 },
  { id: 'magical-and-ordinary', title: 'Both Registers', description: 'Hold one magical object and one ordinary object.', reward: 150, target: 2 },
  { id: 'no-damage', title: 'Clean Shelf', description: 'Hold at least two objects, none of them damaged.', reward: 130, target: 2 },
  { id: 'hold-three-rounds', title: 'A Long Loan', description: 'Keep one object through three rounds.', reward: 120, target: 3 },
  { id: 'profit-curiosity', title: 'A Curious Profit', description: 'Sell a curiosity for more than you paid.', reward: 150, target: 1 },
  { id: 'hold-anything', title: 'A First Lot', description: 'Hold one object.', reward: 40, target: 1 },
];

export const templateById = (id: string): ContractTemplate => {
  const found = TEMPLATES.find((template) => template.id === id);
  if (!found) throw new Error(`Unknown contract: ${id}`);
  return found;
};

export const PLAYER_TEMPLATES = TEMPLATES.filter((template) => template.id !== 'hold-anything');

export interface ContractCtx {
  held: readonly ItemInstance[];
  sales: readonly SaleRecord[];
  known: Readonly<Record<string, readonly string[]>>;
  round: number;
  damagedBelow: number;
}

export interface Achievability {
  rounds: number;
  upside: boolean;
  rules?: Rules;
}

const bestLiquidation = (def: ItemDefinition, rules: Rules): number => {
  const instance: ItemInstance = {
    id: `probe-${def.id}`,
    definitionId: def.id,
    ownerId: null,
    condition: def.conditionRange[1],
    authenticity: 'genuine',
    acquiredAt: 0,
    acquisitionPrice: 0,
    status: 'offered',
    revealedProps: [],
    serial: 'probe',
    provenance: [],
    effectState: {},
    location: 'market',
  };
  return appraise(def, instance, emptyContext(rules)).liquidation;
};

/** Structural check: could this catalogue ever satisfy the contract? */
export const contractAchievable = (id: string, defs: readonly ItemDefinition[], opts: Achievability): boolean => {
  const rules = opts.rules ?? DEFAULT_RULES;
  const categories = new Set(defs.map((def) => def.category));
  switch (id) {
    case 'two-timepieces':
      return defs.filter((def) => def.category === 'timekeeping').length >= 2;
    case 'same-maker': {
      const counts = new Map<string, number>();
      for (const def of defs) counts.set(def.manufacturer, (counts.get(def.manufacturer) ?? 0) + 1);
      return [...counts.values()].some((count) => count >= 2);
    }
    case 'three-categories':
      return categories.size >= 3;
    case 'matching-pair':
      return defs.some((def) => def.id === 'twin-left') && defs.some((def) => def.id === 'twin-right');
    case 'sell-two-profit':
      return defs.filter((def) => bestLiquidation(def, rules) > rules.minBid).length >= 2;
    case 'authenticated-rare':
      return defs.some((def) => def.rarity === 'rare' || def.rarity === 'singular');
    case 'magical-and-ordinary':
      return categories.has('magical') && [...categories].some((category) => category !== 'magical');
    case 'no-damage':
      return defs.filter((def) => def.conditionRange[1] >= rules.damagedBelow).length >= 2;
    case 'hold-three-rounds':
      return opts.rounds >= 3 && defs.length >= 1;
    case 'profit-curiosity':
      return defs.some((def) => def.category === 'curiosities' && bestLiquidation(def, rules) > rules.minBid);
    case 'hold-anything':
      return defs.length >= 1;
    default:
      return false;
  }
};

export const evaluateContract = (templateId: string, ctx: ContractCtx): { progress: number; target: number; done: boolean } => {
  const template = templateById(templateId);
  const defOf = (item: ItemInstance) => definition(item.definitionId);
  let progress = 0;
  switch (templateId) {
    case 'two-timepieces':
      progress = ctx.held.filter((item) => defOf(item).category === 'timekeeping').length;
      break;
    case 'same-maker': {
      const counts = new Map<string, number>();
      for (const item of ctx.held) {
        const maker = defOf(item).manufacturer;
        counts.set(maker, (counts.get(maker) ?? 0) + 1);
      }
      progress = Math.max(0, ...counts.values(), 0);
      break;
    }
    case 'three-categories':
      progress = new Set(ctx.held.map((item) => defOf(item).category)).size;
      break;
    case 'matching-pair': {
      const ids = new Set(ctx.held.map((item) => item.definitionId));
      progress = ['twin-left', 'twin-right'].filter((id) => ids.has(id)).length;
      break;
    }
    case 'sell-two-profit':
      progress = ctx.sales.filter((sale) => sale.price > sale.acquisitionPrice).length;
      break;
    case 'authenticated-rare':
      progress = ctx.held.some((item) => {
        const def = defOf(item);
        const known = ctx.known[item.id] ?? [];
        return (def.rarity === 'rare' || def.rarity === 'singular') && item.authenticity === 'genuine' && known.includes('authenticity');
      })
        ? 1
        : 0;
      break;
    case 'magical-and-ordinary': {
      const cats = ctx.held.map((item) => defOf(item).category);
      progress = (cats.includes('magical') ? 1 : 0) + (cats.some((category) => category !== 'magical') ? 1 : 0);
      break;
    }
    case 'no-damage':
      if (ctx.held.length < 2 || ctx.held.some((item) => item.condition < ctx.damagedBelow)) progress = 0;
      else progress = ctx.held.length;
      break;
    case 'hold-three-rounds':
      progress = ctx.held.length ? Math.max(...ctx.held.map((item) => ctx.round - item.acquiredAt + 1)) : 0;
      break;
    case 'profit-curiosity':
      progress = ctx.sales.some((sale) => sale.category === 'curiosities' && sale.price > sale.acquisitionPrice) ? 1 : 0;
      break;
    case 'hold-anything':
      progress = ctx.held.length;
      break;
    default:
      progress = 0;
  }
  return { progress, target: template.target, done: progress >= template.target };
};

export const makeContract = (template: ContractTemplate, instanceId: string, scope: ContractScope, assignedTick: number): ContractInstance => ({
  instanceId,
  templateId: template.id,
  title: template.title,
  description: template.description,
  reward: template.reward,
  target: template.target,
  scope,
  status: 'active',
  progress: 0,
  rewardPaid: false,
  assignedTick,
});

export const refreshContract = (
  contract: ContractInstance,
  ctx: ContractCtx,
): { contract: ContractInstance; justCompleted: boolean } => {
  if (contract.status !== 'active' || contract.rewardPaid) return { contract, justCompleted: false };
  const evaluated = evaluateContract(contract.templateId, ctx);
  const done = evaluated.done;
  return {
    contract: { ...contract, progress: evaluated.progress, status: done ? 'complete' : 'active' },
    justCompleted: done,
  };
};
