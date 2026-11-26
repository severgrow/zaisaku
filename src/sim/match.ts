import { AGGRESSIVE, BALANCED, chooseAction } from '../bots/heuristic.js';
import type { Personality } from '../bots/heuristic.js';
import { createDuel, submit, validateAction } from '../engine/duel.js';
import { viewFor } from '../engine/view.js';
import type { DuelState, Rules } from '../engine/types.js';

export const playMatch = (
  seed: number,
  p0: Personality = BALANCED,
  p1: Personality = AGGRESSIVE,
  rules?: Partial<Rules>,
): DuelState => {
  let state = createDuel(seed, {
    ...(rules ? { rules } : {}),
    names: [p0.name, p1.name],
    simulated: [false, true],
  });
  let guard = 0;
  while (state.phase !== 'complete' && guard < 24) {
    guard += 1;
    const left = chooseAction(viewFor(state, 'p0'), p0);
    const right = chooseAction(viewFor(state, 'p1'), p1);
    const a0 = validateAction(state, 'p0', left) ? { type: 'pass' as const } : left;
    const first = submit(state, 'p0', a0);
    if (!first.ok) break;
    state = first.value;
    if (state.phase !== 'decide') continue;
    const a1 = validateAction(state, 'p1', right) ? { type: 'pass' as const } : right;
    const second = submit(state, 'p1', a1);
    if (!second.ok) break;
    state = second.value;
  }
  return state;
};
