import { AGGRESSIVE, BALANCED } from '../bots/heuristic.js';
import { playMatch } from './match.js';

let bids = 0;
let finished = 0;
let negative = 0;
const wins = { p0: 0, p1: 0, draw: 0 };
for (let seed = 1; seed <= 24; seed += 1) {
  const match = playMatch(seed, seed % 2 === 0 ? BALANCED : AGGRESSIVE, seed % 2 === 0 ? AGGRESSIVE : BALANCED);
  if (match.phase === 'complete') finished += 1;
  for (const id of ['p0', 'p1'] as const) {
    if (match.players[id].cash < 0) negative += 1;
    bids += match.players[id].actions.filter((action) => action.type === 'bid').length;
  }
  if (match.result) wins[match.result.winner] += 1;
}
console.log(JSON.stringify({ finished, negative, bids, wins }));
