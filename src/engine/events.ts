import { deriveSeed, mulberry32, shuffle } from './prng.js';
import type { EventTemplate, ItemInstance, MatchEvent } from './types.js';
import type { Rng } from './prng.js';

export const EVENT_TEMPLATES: readonly EventTemplate[] = [
  {
    id: 'analog-revival',
    name: 'Analog Revival',
    categories: ['timekeeping'],
    tags: [],
    manufacturers: [],
    rarities: [],
    demandBps: 14_000,
    supplyBps: 10_000,
    rumour: 'Workshops are paying for clocks again.',
    warning: 'Timekeeping demand is stirring.',
    summary: 'Timekeeping prices rise while the revival holds.',
  },
  {
    id: 'lunar-exhibition',
    name: 'Lunar Exhibition',
    categories: [],
    tags: ['moon'],
    manufacturers: [],
    rarities: [],
    demandBps: 14_500,
    supplyBps: 10_000,
    rumour: 'A moon show is being hung.',
    warning: 'Moon-marked objects are being requested.',
    summary: 'Moon-marked objects are bid up for the length of the show.',
  },
  {
    id: 'ceramic-recall',
    name: 'Ceramic Recall',
    categories: ['ceramics'],
    tags: [],
    manufacturers: [],
    rarities: [],
    demandBps: 7_500,
    supplyBps: 10_000,
    rumour: 'A kiln batch is being questioned.',
    warning: 'Ceramics may be discounted.',
    summary: 'Ceramics are cheaper. Loose stock is marked down. Owned pieces are not harmed.',
  },
  {
    id: 'counterfeit-scandal',
    name: 'Counterfeit Scandal',
    categories: [],
    tags: [],
    manufacturers: [],
    rarities: ['rare', 'singular'],
    demandBps: 8_000,
    supplyBps: 10_000,
    rumour: 'Papers are being forged downtown.',
    warning: 'Rare papers are under suspicion.',
    summary: 'Rare and singular prices fall until the scandal passes.',
  },
  {
    id: 'import-suspension',
    name: 'Import Suspension',
    categories: [],
    tags: ['import'],
    manufacturers: [],
    rarities: [],
    demandBps: 10_000,
    supplyBps: 7_000,
    rumour: 'A dock has closed.',
    warning: 'Imported stock may thin.',
    summary: 'Imported objects thin out and cost more.',
  },
  {
    id: 'red-frequency',
    name: 'Red Frequency',
    categories: [],
    tags: ['red', 'frequency'],
    manufacturers: [],
    rarities: [],
    demandBps: 14_000,
    supplyBps: 10_000,
    rumour: 'A red signal is on the wire.',
    warning: 'Red-marked objects are humming.',
    summary: 'Red and frequency-marked objects are wanted.',
  },
  {
    id: 'forgotten-manufacturer',
    name: 'Forgotten Manufacturer',
    categories: [],
    tags: [],
    manufacturers: ['Lampblack'],
    rarities: [],
    demandBps: 7_200,
    supplyBps: 10_000,
    rumour: 'A maker is slipping out of the catalogues.',
    warning: 'Lampblack pieces are being overlooked.',
    summary: 'Lampblack pieces are overlooked while the name fades.',
  },
];

export const scheduleMatchEvents = (rng: Rng, rounds: number): MatchEvent[] => {
  const starts = [2, 4, 6].filter((start) => start <= rounds);
  const picked = shuffle(EVENT_TEMPLATES, rng).slice(0, starts.length);
  return picked.map((template, index) => {
    const startRound = starts[index]!;
    return { ...template, startRound, endRound: Math.min(rounds, startRound + 1) };
  });
};

export const persistentRotation = (seed: number): readonly EventTemplate[] =>
  shuffle(EVENT_TEMPLATES, mulberry32(deriveSeed(seed, 4)));

/** Tick 0 is quiet. After that each event holds the wire for two ticks. */
export const activeAtTick = (seed: number, tick: number): EventTemplate[] => {
  if (tick <= 0) return [];
  const rotation = persistentRotation(seed);
  const index = Math.floor((tick - 1) / 2) % rotation.length;
  const event = rotation[index];
  return event ? [event] : [];
};

export const activeMatchEvents = (events: readonly MatchEvent[], round: number): MatchEvent[] =>
  events.filter((event) => round >= event.startRound && round <= event.endRound);

export const rumoursFor = (events: readonly MatchEvent[], round: number): string[] =>
  events.filter((event) => event.startRound === round + 1).map((event) => event.rumour);

/** Markdown applies to loose market stock only, once per event window, and never destroys it. */
export const markCeramicListings = (
  listings: readonly ItemInstance[],
  tick: number,
  events: readonly EventTemplate[],
  isCeramic: (definitionId: string) => boolean,
  markdown: number,
  floor: number,
): ItemInstance[] => {
  if (!events.some((event) => event.id === 'ceramic-recall') || tick <= 0) return [...listings];
  const window = Math.floor((tick - 1) / 2);
  return listings.map((item) => {
    if (!isCeramic(item.definitionId)) return item;
    if (item.effectState.recallWindow === window) return item;
    return {
      ...item,
      condition: Math.max(floor, item.condition - markdown),
      effectState: { ...item.effectState, recallWindow: window },
    };
  });
};
