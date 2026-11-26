import { CATEGORIES, EFFECT_TYPES, RARITIES } from './types.js';
import type { EffectDef, EffectType, ItemDefinition } from './types.js';

export interface CatalogueIssue {
  id: string;
  field: string;
  message: string;
}

const EFFECT_SCHEMA: Record<EffectType, Record<string, 'number' | 'string'>> = {
  amber_hourglass: { perRoundBps: 'number', capRounds: 'number' },
  null_magnet: { category: 'string', demandBps: 'number' },
  red_box: { rounds: 'number', damage: 'number', floor: 'number' },
  tomorrow_receiver: { lookahead: 'number' },
  twins: { pairId: 'string', bonusBps: 'number' },
  memory_lens: { extraReveals: 'number' },
};

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);

export const validateCatalogue = (defs: readonly ItemDefinition[]): CatalogueIssue[] => {
  const issues: CatalogueIssue[] = [];
  const seen = new Set<string>();
  const push = (id: string, field: string, message: string) => issues.push({ id, field, message });

  defs.forEach((def, index) => {
    const id = typeof def?.id === 'string' && def.id ? def.id : `#${index}`;
    if (typeof def?.id !== 'string' || !def.id.trim()) push(id, 'id', 'Missing id.');
    else if (seen.has(def.id)) push(def.id, 'id', 'Duplicate id.');
    else seen.add(def.id);

    if (typeof def?.name !== 'string' || !def.name.trim()) push(id, 'name', 'Missing name.');
    if (typeof def?.description !== 'string' || !def.description.trim()) push(id, 'description', 'Missing description.');
    if (typeof def?.lore !== 'string' || !def.lore.trim()) push(id, 'lore', 'Missing lore.');
    if (!CATEGORIES.includes(def?.category)) push(id, 'category', 'Unknown category.');
    if (typeof def?.manufacturer !== 'string' || !def.manufacturer.trim()) push(id, 'manufacturer', 'Missing manufacturer.');
    if (typeof def?.era !== 'string' || !def.era.trim()) push(id, 'era', 'Missing era.');
    if (!RARITIES.includes(def?.rarity)) push(id, 'rarity', 'Unknown rarity.');
    if (!Number.isInteger(def?.baseValue) || def.baseValue <= 0) push(id, 'baseValue', 'Base value must be a positive integer.');
    const range = def?.conditionRange;
    if (!range || range.length !== 2 || !Number.isInteger(range[0]) || !Number.isInteger(range[1])) {
      push(id, 'conditionRange', 'Condition range must be two integers.');
    } else if (range[0] < 0 || range[1] > 100 || range[0] > range[1]) {
      push(id, 'conditionRange', 'Condition range must sit inside 0..100.');
    }
    if (def?.collection !== null && typeof def?.collection !== 'string') push(id, 'collection', 'Collection must be a string or null.');
    if (!Array.isArray(def?.tags) || def.tags.some((t) => typeof t !== 'string' || !t)) push(id, 'tags', 'Tags must be non-empty strings.');
    if (typeof def?.artworkRef !== 'string' || !def.artworkRef.trim()) push(id, 'artworkRef', 'Missing artwork ref.');
    if (!Number.isInteger(def?.supply) || def.supply <= 0) push(id, 'supply', 'Supply must be a positive integer.');
    if (typeof def?.tradeable !== 'boolean') push(id, 'tradeable', 'Tradeable must be boolean.');
    if (!Number.isInteger(def?.version) || def.version <= 0) push(id, 'version', 'Version must be a positive integer.');
    if (!Array.isArray(def?.eventSensitivities) || def.eventSensitivities.some((t) => typeof t !== 'string')) {
      push(id, 'eventSensitivities', 'Event sensitivities must be strings.');
    }

    if (!Array.isArray(def?.inspectionProps)) push(id, 'inspectionProps', 'Inspection props must be a list.');
    else {
      const keys = new Set<string>();
      def.inspectionProps.forEach((prop, i) => {
        if (typeof prop?.key !== 'string' || !prop.key) push(id, `inspectionProps.${i}`, 'Missing prop key.');
        else if (keys.has(prop.key)) push(id, `inspectionProps.${i}`, 'Duplicate prop key.');
        else keys.add(prop.key);
        if (typeof prop?.label !== 'string' || !prop.label) push(id, `inspectionProps.${i}`, 'Missing prop label.');
        if (typeof prop?.hidden !== 'boolean') push(id, `inspectionProps.${i}`, 'Hidden must be boolean.');
        if (typeof prop?.value !== 'string') push(id, `inspectionProps.${i}`, 'Prop value must be a string.');
      });
    }

    if (!Array.isArray(def?.effectDefs)) push(id, 'effectDefs', 'Effects must be a list.');
    else {
      def.effectDefs.forEach((effect: EffectDef, i: number) => {
        const effectType = effect?.type;
        if (!effectType || !EFFECT_TYPES.includes(effectType)) {
          push(id, `effectDefs.${i}`, 'Unknown effect type.');
          return;
        }
        const schema = EFFECT_SCHEMA[effectType];
        const params = effect.params;
        if (!isRecord(params)) {
          push(id, `effectDefs.${i}`, 'Effect params must be an object.');
          return;
        }
        const keys = Object.keys(params);
        const expected = Object.keys(schema);
        for (const key of expected) {
          if (!Object.hasOwn(params, key)) push(id, `effectDefs.${i}.${key}`, 'Missing effect param.');
        }
        for (const key of keys) {
          if (!Object.hasOwn(schema, key)) push(id, `effectDefs.${i}.${key}`, 'Unexpected effect param.');
        }
        for (const [key, kind] of Object.entries(schema)) {
          const value = params[key];
          if (kind === 'number' && (typeof value !== 'number' || !Number.isInteger(value))) {
            push(id, `effectDefs.${i}.${key}`, 'Effect param must be an integer.');
          }
          if (kind === 'string' && (typeof value !== 'string' || !value.trim())) {
            push(id, `effectDefs.${i}.${key}`, 'Effect param must be a non-empty string.');
          }
        }
        if (effect.type === 'null_magnet' && typeof params.category === 'string' && !CATEGORIES.includes(params.category as never)) {
          push(id, `effectDefs.${i}.category`, 'Null magnet category is not a category.');
        }
        if (effect.type === 'red_box') {
          if (typeof params.rounds === 'number' && params.rounds < 2) push(id, `effectDefs.${i}.rounds`, 'Red box needs at least two rounds.');
          if (typeof params.damage === 'number' && params.damage <= 0) push(id, `effectDefs.${i}.damage`, 'Damage must be positive.');
          if (typeof params.floor === 'number' && params.floor < 0) push(id, `effectDefs.${i}.floor`, 'Floor cannot be negative.');
        }
        if (effect.type === 'amber_hourglass') {
          if (typeof params.perRoundBps === 'number' && params.perRoundBps <= 0) push(id, `effectDefs.${i}.perRoundBps`, 'Amber gain must be positive.');
          if (typeof params.capRounds === 'number' && params.capRounds <= 0) push(id, `effectDefs.${i}.capRounds`, 'Amber cap must be positive.');
        }
      });
    }
  });
  return issues;
};
