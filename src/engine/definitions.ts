import type { Category, EffectDef, ItemDefinition, Rarity } from './types.js';

type Era = 'Early Wire' | 'Glass Decade' | 'Salt Years' | 'Low Orbit' | 'After Catalogue';

interface Draft {
  id: string;
  name: string;
  description: string;
  lore: string;
  category: Category;
  manufacturer: string;
  era: Era;
  rarity: Rarity;
  baseValue: number;
  secret: string;
  conditionRange?: readonly [number, number];
  collection?: string | null;
  tags?: readonly string[];
  effects?: readonly EffectDef[];
  sensitivities?: readonly string[];
}

const props = (secret: string): ItemDefinition['inspectionProps'] => [
  { key: 'maker-mark', label: "Maker's mark", hidden: false, value: 'struck' },
  { key: 'condition-exact', label: 'Bench reading', hidden: true, value: 'measured' },
  { key: 'authenticity', label: 'Papers', hidden: true, value: 'checked' },
  { key: 'secret', label: 'Kept note', hidden: true, value: secret },
];

const item = (d: Draft): ItemDefinition => ({
  id: d.id,
  name: d.name,
  description: d.description,
  lore: d.lore,
  category: d.category,
  manufacturer: d.manufacturer,
  era: d.era,
  rarity: d.rarity,
  baseValue: d.baseValue,
  conditionRange: d.conditionRange ?? [64, 96],
  collection: d.collection ?? null,
  tags: d.tags ?? [],
  artworkRef: d.id,
  supply: d.rarity === 'common' ? 4 : d.rarity === 'uncommon' ? 2 : 1,
  tradeable: true,
  inspectionProps: props(d.secret),
  effectDefs: d.effects ?? [],
  eventSensitivities: d.sensitivities ?? [],
  version: 1,
});

const amber: EffectDef = { type: 'amber_hourglass', params: { perRoundBps: 800, capRounds: 5 } };
const magnet: EffectDef = { type: 'null_magnet', params: { category: 'electronics', demandBps: 8500 } };
const red: EffectDef = { type: 'red_box', params: { rounds: 3, damage: 18, floor: 20 } };
const receiver: EffectDef = { type: 'tomorrow_receiver', params: { lookahead: 1 } };
const twins: EffectDef = { type: 'twins', params: { pairId: 'the-twins', bonusBps: 12000 } };
const lens: EffectDef = { type: 'memory_lens', params: { extraReveals: 1 } };

export const DEFINITIONS: readonly ItemDefinition[] = [
  item({ id: 'tomorrow-receiver', name: 'Tomorrow Receiver', description: 'A wireless set that hums a minute ahead of the wire.', lore: 'Vesper built it to hear announcements before they were spoken.', category: 'electronics', manufacturer: 'Vesper Works', era: 'Low Orbit', rarity: 'rare', baseValue: 220, secret: 'SECRET:tomorrow-receiver:it already knows the next notice.', tags: ['import'], effects: [receiver], sensitivities: ['import-suspension'] }),
  item({ id: 'dream-receiver', name: 'Dream Receiver', description: 'A sister set that plays what you almost remembered.', lore: 'It was never sold. It arrived in the catalogue anyway.', category: 'magical', manufacturer: 'Vesper Works', era: 'After Catalogue', rarity: 'singular', baseValue: 280, secret: 'SECRET:dream-receiver:the dream is someone else\'s inventory.', tags: ['dream'] }),
  item({ id: 'null-magnet', name: 'Null Magnet', description: 'A matte horseshoe that makes nearby circuits feel tired.', lore: 'Orry foundry poured it on a day the lights dipped.', category: 'electronics', manufacturer: 'Orry Foundry', era: 'Early Wire', rarity: 'rare', baseValue: 180, secret: 'SECRET:null-magnet:it prefers other people\'s radios.', tags: ['frequency'], effects: [magnet], sensitivities: ['red-frequency'] }),
  item({ id: 'silent-telephone', name: 'Silent Telephone', description: 'A handset with a dial and no bell.', lore: 'Quiet Bureau issued these to rooms that were not to be called.', category: 'electronics', manufacturer: 'Quiet Bureau', era: 'Glass Decade', rarity: 'uncommon', baseValue: 120, secret: 'SECRET:silent-telephone:the last number is still under the finger plate.' }),
  item({ id: 'wire-hymnal', name: 'Wire Hymnal', description: 'A coil-bound speaker that only plays held notes.', lore: 'Kite & Hollow printed the hymns as copper.', category: 'electronics', manufacturer: 'Kite & Hollow', era: 'Early Wire', rarity: 'common', baseValue: 70, secret: 'SECRET:wire-hymnal:verse four is a parts list.', tags: ['import'], sensitivities: ['import-suspension'] }),
  item({ id: 'pocket-static', name: 'Pocket Static', description: 'A tin of recorded hush.', lore: 'Travellers shook it when a room was too quiet.', category: 'electronics', manufacturer: 'Kite & Hollow', era: 'Salt Years', rarity: 'common', baseValue: 55, secret: 'SECRET:pocket-static:the hush was recorded in a station.', tags: ['import'] }),
  item({ id: 'red-coil', name: 'Red Frequency Coil', description: 'A copper spiral dyed the colour of a warning lamp.', lore: 'It warms when a red notice is about to post.', category: 'electronics', manufacturer: 'Orry Foundry', era: 'Low Orbit', rarity: 'uncommon', baseValue: 130, secret: 'SECRET:red-coil:it was wound during a blackout.', tags: ['frequency', 'red'], sensitivities: ['red-frequency'] }),
  item({ id: 'moon-clock', name: 'Moon Clock', description: 'A desk clock whose hour hand prefers the moon.', lore: 'Brine set it to a tide that no longer visits this city.', category: 'timekeeping', manufacturer: 'Brine Instrument', era: 'Salt Years', rarity: 'uncommon', baseValue: 150, secret: 'SECRET:moon-clock:midnight is marked twice.', tags: ['moon', 'time'], sensitivities: ['lunar-exhibition', 'analog-revival'] }),
  item({ id: 'amber-hourglass', name: 'Amber Hourglass', description: 'Sand the colour of resin, slower each time you turn it.', lore: 'Sable swore the sand was a melted evening.', category: 'timekeeping', manufacturer: 'Sable Atelier', era: 'Glass Decade', rarity: 'rare', baseValue: 200, secret: 'SECRET:amber-hourglass:each round it remembers being kept.', tags: ['time'], effects: [amber], sensitivities: ['analog-revival'] }),
  item({ id: 'station-pendulum', name: 'Station Pendulum', description: 'A platform clock weight, still willing to swing.', lore: 'It was unscrewed the night the line closed.', category: 'timekeeping', manufacturer: 'Brine Instrument', era: 'Early Wire', rarity: 'common', baseValue: 80, secret: 'SECRET:station-pendulum:the beat matches a demolished platform.', tags: ['time'], sensitivities: ['analog-revival'] }),
  item({ id: 'saltwater-watch', name: 'Saltwater Watch', description: 'A pocket watch that fogs when storms are inland.', lore: 'Mare & Co. cased it for pilots who distrusted the sky.', category: 'timekeeping', manufacturer: 'Mare & Co.', era: 'Salt Years', rarity: 'uncommon', baseValue: 140, secret: 'SECRET:saltwater-watch:the second hand sticks at the dock.', tags: ['time', 'import'], sensitivities: ['analog-revival', 'import-suspension'] }),
  item({ id: 'second-mouth', name: 'Second Mouth', description: 'A metronome with two shutters and one tongue.', lore: 'Lampblack sold it as a practice machine. It counts people.', category: 'timekeeping', manufacturer: 'Lampblack', era: 'Glass Decade', rarity: 'common', baseValue: 64, secret: 'SECRET:second-mouth:it skips the beat you are waiting for.', tags: ['time'], sensitivities: ['analog-revival', 'forgotten-manufacturer'] }),
  item({ id: 'late-bell', name: 'Late Bell', description: 'A small bell that rings after the hour, never on it.', lore: 'Stations kept one so no one could claim to be early.', category: 'timekeeping', manufacturer: 'Brine Instrument', era: 'Early Wire', rarity: 'uncommon', baseValue: 110, secret: 'SECRET:late-bell:the clapper is wrapped in cloth.', tags: ['time'], sensitivities: ['analog-revival'] }),
  item({ id: 'memory-lens', name: 'Memory Lens', description: 'A thick optic that shows the note you did not think to ask for.', lore: 'Northglass ground it from a window that had seen a sale.', category: 'optical', manufacturer: 'Northglass', era: 'Glass Decade', rarity: 'rare', baseValue: 210, secret: 'SECRET:memory-lens:look twice and the second fact stays.', effects: [lens], sensitivities: [] }),
  item({ id: 'dust-telescope', name: 'Dust Telescope', description: 'A short brass scope full of polite dust.', lore: 'It was aimed at the moon and then at inventory tags.', category: 'optical', manufacturer: 'Northglass', era: 'Salt Years', rarity: 'uncommon', baseValue: 160, secret: 'SECRET:dust-telescope:the dust is sorted by year.', tags: ['moon'], sensitivities: ['lunar-exhibition'] }),
  item({ id: 'green-filter', name: 'Green Filter', description: 'A square of glass that makes prices look calmer.', lore: 'Clerks held it over ledgers during loud weeks.', category: 'optical', manufacturer: 'Pell & Daughter', era: 'Glass Decade', rarity: 'common', baseValue: 48, secret: 'SECRET:green-filter:the tint is kiln-slag, not dye.' }),
  item({ id: 'eclipse-monocle', name: 'Eclipse Monocle', description: 'A dark lens on a silk ribbon.', lore: 'Worn once, during a moon that arrived early.', category: 'optical', manufacturer: 'Northglass', era: 'Low Orbit', rarity: 'uncommon', baseValue: 135, secret: 'SECRET:eclipse-monocle:the ribbon is ticket stock.', tags: ['moon'], sensitivities: ['lunar-exhibition'] }),
  item({ id: 'catalogue-eye', name: 'Catalogue Eye', description: 'A glass marble used as a paperweight on lot lists.', lore: 'Quiet Bureau claimed it kept columns from wandering.', category: 'optical', manufacturer: 'Quiet Bureau', era: 'After Catalogue', rarity: 'common', baseValue: 60, secret: 'SECRET:catalogue-eye:a lot number is etched inside.' }),
  item({ id: 'prism-ticket', name: 'Prism Ticket', description: 'A punched ticket that throws a small spectrum.', lore: 'Admission to a hall that showed objects, not plays.', category: 'optical', manufacturer: 'Pell & Daughter', era: 'Salt Years', rarity: 'uncommon', baseValue: 90, secret: 'SECRET:prism-ticket:the seat was a glass case.' }),
  item({ id: 'orchid-vessel', name: 'Orchid Vessel', description: 'A narrow porcelain vase with a painted throat.', lore: 'Sable kept orchids that refused soil. The vase remembers the refusal.', category: 'ceramics', manufacturer: 'Sable Atelier', era: 'Glass Decade', rarity: 'uncommon', baseValue: 125, secret: 'SECRET:orchid-vessel:the flower was never real.', sensitivities: ['ceramic-recall'] }),
  item({ id: 'cracked-saucer', name: 'Cracked Saucer', description: 'A saucer with an honest crack and a gold-less repair.', lore: 'It was kept because the cup outlived it.', category: 'ceramics', manufacturer: 'Pell & Daughter', era: 'Early Wire', rarity: 'common', baseValue: 36, conditionRange: [22, 48], secret: 'SECRET:cracked-saucer:the crack predates the mark.', sensitivities: ['ceramic-recall'] }),
  item({ id: 'kiln-ghost', name: 'Kiln Ghost Bowl', description: 'A bowl with a pale figure that only shows when warm.', lore: 'The figure is the silhouette of whoever opened the kiln.', category: 'ceramics', manufacturer: 'Sable Atelier', era: 'Salt Years', rarity: 'rare', baseValue: 190, secret: 'SECRET:kiln-ghost:the figure faces the door.', sensitivities: ['ceramic-recall'] }),
  item({ id: 'tea-for-nobody', name: 'Tea for Nobody', description: 'A cup with no handle, meant to be held in both hands.', lore: 'Pell served it at closings, when the buyer had already left.', category: 'ceramics', manufacturer: 'Pell & Daughter', era: 'Glass Decade', rarity: 'common', baseValue: 44, secret: 'SECRET:tea-for-nobody:the glaze lists a cancelled name.', sensitivities: ['ceramic-recall'] }),
  item({ id: 'blue-fault', name: 'Blue Fault Cup', description: 'A cup whose blue pooled in the fault and made it famous.', lore: 'Lampblack tried to recall the line. Collectors refused.', category: 'ceramics', manufacturer: 'Lampblack', era: 'Low Orbit', rarity: 'uncommon', baseValue: 72, conditionRange: [45, 90], secret: 'SECRET:blue-fault:the fault is under the glaze on purpose.', sensitivities: ['ceramic-recall', 'forgotten-manufacturer'] }),
  item({ id: 'white-jar', name: 'White Reserve Jar', description: 'A lidded jar with an empty paper label.', lore: 'Sable stored glaze samples. The label was never written.', category: 'ceramics', manufacturer: 'Sable Atelier', era: 'After Catalogue', rarity: 'common', baseValue: 58, secret: 'SECRET:white-jar:the lid does not match the foot.', sensitivities: ['ceramic-recall'] }),
  item({ id: 'red-box', name: 'Red Box', description: 'A lacquer box that ticks like a patient clock.', lore: 'It was a gift. The note said not to keep it near anything loved.', category: 'curiosities', manufacturer: 'Lampblack', era: 'Low Orbit', rarity: 'rare', baseValue: 170, conditionRange: [78, 98], secret: 'SECRET:red-box:it warns once, then it chooses.', tags: ['red', 'frequency'], effects: [red], sensitivities: ['red-frequency', 'forgotten-manufacturer'] }),
  item({ id: 'twin-left', name: 'The Twin, Left', description: 'One of a pair of bone figures, facing right.', lore: 'Mare carved them on a crossing. They are worth more when they can see each other.', category: 'curiosities', manufacturer: 'Mare & Co.', era: 'Salt Years', rarity: 'rare', baseValue: 140, collection: 'the-twins', secret: 'SECRET:twin-left:the base is numbered 1 of 2.', effects: [twins] }),
  item({ id: 'twin-right', name: 'The Twin, Right', description: 'One of a pair of bone figures, facing left.', lore: 'Apart, each is a curiosity. Together they are a sentence.', category: 'curiosities', manufacturer: 'Mare & Co.', era: 'Salt Years', rarity: 'rare', baseValue: 140, collection: 'the-twins', secret: 'SECRET:twin-right:the base is numbered 2 of 2.', effects: [twins] }),
  item({ id: 'bone-dice', name: 'Bone Dice', description: 'A pair of dice that prefer low numbers.', lore: 'Orry cast them for a game that was never finished.', category: 'curiosities', manufacturer: 'Orry Foundry', era: 'Early Wire', rarity: 'common', baseValue: 40, secret: 'SECRET:bone-dice:the pips are drilled, not painted.' }),
  item({ id: 'travellers-weight', name: 'Traveller\'s Weight', description: 'A brass weight from a scale that travelled.', lore: 'It is slightly light. The difference paid for the journey.', category: 'curiosities', manufacturer: 'Mare & Co.', era: 'Salt Years', rarity: 'uncommon', baseValue: 100, secret: 'SECRET:travellers-weight:it is two grams short.', tags: ['import'], sensitivities: ['import-suspension'] }),
  item({ id: 'closed-city', name: 'Map of a Closed City', description: 'A folded map of streets that end in walls.', lore: 'Quiet Bureau printed it after the gates were shut.', category: 'curiosities', manufacturer: 'Quiet Bureau', era: 'After Catalogue', rarity: 'uncommon', baseValue: 115, secret: 'SECRET:closed-city:your street is drawn and then crossed out.' }),
  item({ id: 'spare-key', name: 'Spare Key to Nothing', description: 'A key with no ward that still feels specific.', lore: 'Kite & Hollow cut a thousand, each for a door that was theoretical.', category: 'curiosities', manufacturer: 'Kite & Hollow', era: 'Glass Decade', rarity: 'common', baseValue: 42, secret: 'SECRET:spare-key:the bow is stamped with a room that was renumbered.' }),
  item({ id: 'paper-charm', name: 'Paper Charm', description: 'A folded slip that smells faintly of smoke and ink.', lore: 'Slipped into lots to keep them from being forgotten.', category: 'magical', manufacturer: 'Quiet Bureau', era: 'After Catalogue', rarity: 'common', baseValue: 66, secret: 'SECRET:paper-charm:the fold hides a price that was refused.' }),
  item({ id: 'glass-saint', name: 'Glass Saint', description: 'A small cast figure, clear, with a coin in the chest.', lore: 'Northglass made saints for people who did not want them opaque.', category: 'magical', manufacturer: 'Northglass', era: 'Glass Decade', rarity: 'uncommon', baseValue: 155, secret: 'SECRET:glass-saint:the coin is dated after the mould.' }),
  item({ id: 'mute-candle', name: 'Mute Candle', description: 'A candle that gives light and refuses a flame you can hear.', lore: 'Sable poured it for night sales.', category: 'magical', manufacturer: 'Sable Atelier', era: 'Salt Years', rarity: 'common', baseValue: 74, secret: 'SECRET:mute-candle:it was lit once, in a photograph.' }),
  item({ id: 'counterfeit-seal', name: 'Counterfeit Seal', description: 'A stamp that makes papers look older than they are.', lore: 'Lampblack denies making it. The denial is stamped with it.', category: 'curiosities', manufacturer: 'Lampblack', era: 'Low Orbit', rarity: 'uncommon', baseValue: 85, secret: 'SECRET:counterfeit-seal:the handle is a real bureau issue.', tags: ['often-counterfeit'], sensitivities: ['counterfeit-scandal', 'forgotten-manufacturer'] }),
];

const byId = new Map(DEFINITIONS.map((d) => [d.id, d]));

export const definition = (id: string): ItemDefinition => {
  const found = byId.get(id);
  if (!found) throw new Error(`Unknown object: ${id}`);
  return found;
};

export const hasDefinition = (id: string): boolean => byId.has(id);
