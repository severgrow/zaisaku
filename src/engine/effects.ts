import { definition } from './definitions.js';
import { stateBool, stateNum } from './money.js';
import type { Rng } from './prng.js';
import { conditionWord } from './valuation.js';
import type { DuelPlayer, ItemInstance, MatchEvent } from './types.js';

export const nullMagnetBps = (inventories: readonly (readonly ItemInstance[])[]): number | null => {
  let bps: number | null = null;
  for (const inventory of inventories) {
    for (const item of inventory) {
      const effect = definition(item.definitionId).effectDefs.find((e) => e.type === 'null_magnet');
      if (!effect) continue;
      const next = Number(effect.params.demandBps);
      bps = bps === null ? next : Math.min(bps, next);
    }
  }
  return bps;
};

export const twinsBonusBps = (inventory: readonly ItemInstance[]): number | null => {
  const ids = new Set(inventory.map((item) => item.definitionId));
  if (!ids.has('twin-left') || !ids.has('twin-right')) return null;
  const holder = inventory.find((item) => item.definitionId === 'twin-left' || item.definitionId === 'twin-right');
  if (!holder) return null;
  const effect = definition(holder.definitionId).effectDefs.find((e) => e.type === 'twins');
  return effect ? Number(effect.params.bonusBps) : null;
};

export const inspectRevealCount = (inventory: readonly ItemInstance[]): number => {
  let extra = 0;
  for (const item of inventory) {
    const effect = definition(item.definitionId).effectDefs.find((e) => e.type === 'memory_lens');
    if (effect) extra = Math.max(extra, Number(effect.params.extraReveals) || 0);
  }
  return 1 + extra;
};

export const hiddenKeys = (definitionId: string): string[] =>
  definition(definitionId).inspectionProps.filter((prop) => prop.hidden).map((prop) => prop.key);

export const nextRevealKeys = (definitionId: string, already: readonly string[], count: number): string[] =>
  hiddenKeys(definitionId).filter((key) => !already.includes(key)).slice(0, count);

export const upcomingEvent = (events: readonly MatchEvent[], round: number, lookahead: number): MatchEvent | null => {
  const future = events.filter((event) => event.startRound > round).sort((a, b) => a.startRound - b.startRound);
  return future[lookahead - 1] ?? null;
};

export const receiverKnowledge = (
  inventory: readonly ItemInstance[],
  events: readonly MatchEvent[],
  round: number,
): { eventId: string; name: string; summary: string } | null => {
  let lookahead = 0;
  for (const item of inventory) {
    const effect = definition(item.definitionId).effectDefs.find((e) => e.type === 'tomorrow_receiver');
    if (effect) lookahead = Math.max(lookahead, Number(effect.params.lookahead) || 1);
  }
  if (lookahead < 1) return null;
  const event = upcomingEvent(events, round, lookahead);
  if (!event) return null;
  return { eventId: event.id, name: event.name, summary: event.summary };
};

const copyItem = (item: ItemInstance): ItemInstance => ({ ...item, effectState: { ...item.effectState }, provenance: [...item.provenance], revealedProps: [...item.revealedProps] });

/** Round-end effects: amber remembers, the red box warns and then cracks one other object. */
export const applyRoundEnd = (player: DuelPlayer, rng: Rng): { player: DuelPlayer; notes: string[] } => {
  const notes: string[] = [];
  const inventory = player.inventory.map(copyItem);
  for (const item of inventory) {
    const def = definition(item.definitionId);
    const amber = def.effectDefs.find((e) => e.type === 'amber_hourglass');
    if (amber) {
      const cap = Number(amber.params.capRounds);
      const held = Math.min(cap, stateNum(item.effectState, 'roundsHeld') + 1);
      item.effectState = { ...item.effectState, roundsHeld: held };
      notes.push(`${def.name} has been held for ${held} round${held === 1 ? '' : 's'}.`);
    }
    const red = def.effectDefs.find((e) => e.type === 'red_box');
    if (red && !stateBool(item.effectState, 'discharged')) {
      const rounds = Number(red.params.rounds);
      const held = stateNum(item.effectState, 'roundsHeld') + 1;
      item.effectState = { ...item.effectState, roundsHeld: held };
      if (held === rounds - 1) {
        item.effectState = { ...item.effectState, warning: true };
        notes.push(`${def.name} is warm. Something else in your care may crack.`);
      }
      if (held >= rounds) {
        const damage = Number(red.params.damage);
        const floor = Number(red.params.floor);
        const eligible = inventory.filter((other) => other.id !== item.id && other.condition > floor);
        if (eligible.length) {
          const pick = eligible[rng.int(eligible.length)]!;
          pick.condition = Math.max(floor, pick.condition - damage);
          notes.push(`${def.name} damaged ${definition(pick.definitionId).name}. It is now ${conditionWord(pick.condition)}.`);
        } else {
          notes.push(`${def.name} is unstable, and nothing else can take the crack.`);
        }
        item.effectState = { ...item.effectState, discharged: true, warning: false };
      }
    }
  }
  const warnings = notes.filter((note) => note.includes('warm') || note.includes('damaged') || note.includes('unstable'));
  return { player: { ...player, inventory, warnings }, notes };
};

export const warningOn = (item: ItemInstance): boolean => stateBool(item.effectState, 'warning');
