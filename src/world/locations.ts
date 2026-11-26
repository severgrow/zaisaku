import type { ActorDef, ExitDef, LocationDef } from './types.js';
import { extraSolids } from './identity.js';
import { feetOf } from './movement.js';
import { GATE } from './state.js';
import { stampShell } from './stamp.js';
import { TILE, blank, solidFrom } from './tiles.js';

const set = (tiles: number[][], tx: number, ty: number, tile: number): void => {
  const row = tiles[ty];
  if (row && tx >= 0 && tx < row.length) row[tx] = tile;
};

const occupy = (solid: boolean[][], tx: number, ty: number): void => {
  const row = solid[ty];
  if (row && tx >= 0 && tx < row.length) row[tx] = true;
};

const border = (tiles: number[][]): void => {
  const height = tiles.length;
  const width = tiles[0]?.length ?? 0;
  for (let x = 0; x < width; x += 1) {
    set(tiles, x, 0, TILE.wall);
    set(tiles, x, height - 1, TILE.wall);
  }
  for (let y = 0; y < height; y += 1) {
    set(tiles, 0, y, TILE.wall);
    set(tiles, width - 1, y, TILE.wall);
  }
};

export const buildDistrict = (): LocationDef => {
  const width = 32;
  const height = 24;
  const tiles = blank(width, height, TILE.ground);
  border(tiles);
  const exchange = stampShell(tiles, 2, 1, 9, 6, 's');
  const research = stampShell(tiles, 21, 1, 9, 6, 's');
  const duel = stampShell(tiles, 2, 10, 6, 5, 'e');
  const auction = stampShell(tiles, 24, 10, 6, 5, 'w');
  const residence = stampShell(tiles, 12, 19, 8, 4, 'n');
  set(tiles, exchange.doorTx + 2, exchange.doorTy - 1, TILE.pipe);
  set(tiles, research.doorTx - 2, research.doorTy, TILE.vent);
  for (let x = 2; x < width - 2; x += 1) {
    if (tiles[8]![x] === TILE.ground) set(tiles, x, 8, TILE.path);
    if (tiles[16]![x] === TILE.ground) set(tiles, x, 16, TILE.path);
  }
  for (let y = 8; y <= 18; y += 1) if (tiles[y]![16] === TILE.ground) set(tiles, 16, y, TILE.path);
  set(tiles, 8, 15, TILE.reed);
  set(tiles, 22, 15, TILE.reed);
  set(tiles, 11, 9, TILE.vein);
  set(tiles, 20, 9, TILE.vein);
  set(tiles, 14, 11, TILE.lantern);
  set(tiles, 10, 9, TILE.lamp);
  set(tiles, 21, 9, TILE.lamp);
  set(tiles, 13, 13, TILE.counter);
  const solid = solidFrom(tiles);
  const actors: ActorDef[] = [
    {
      id: 'ivo',
      name: 'Ivo',
      tx: 8,
      ty: 7,
      facing: 's',
      kind: 'merchant',
      symbol: 'exchange',
      form: 'person',
      coat: '#c9b59a',
      accessory: 'none',
      line: 'The board is priced this hour. Nothing on it has a fixed worth.',
      slot: null,
    },
    {
      id: 'ness',
      name: 'Ness',
      tx: 15,
      ty: 13,
      facing: 's',
      kind: 'contract',
      symbol: 'contract',
      form: 'person',
      coat: '#6d7550',
      accessory: 'hood',
      line: 'I keep a private request. It is not posted on the board.',
      slot: null,
    },
    {
      id: 'archivist',
      name: 'Archivist',
      tx: 27,
      ty: 7,
      facing: 's',
      kind: 'research',
      symbol: 'research',
      form: 'person',
      coat: '#2c2824',
      accessory: 'visor',
      line: 'Papers stay unread until you ask the bench.',
      slot: null,
    },
  ];
  actors.push(
    { id: 'stall', name: 'Stall', tx: 13, ty: 13, facing: 's', kind: 'merchant', symbol: 'exchange', form: 'terminal', coat: '#c9b59a', accessory: 'none', line: 'The same prices as Ivo. The stall does not keep a second ledger.', slot: null },
    { id: 'research-door', name: 'Research bench', tx: research.doorTx, ty: research.doorTy, facing: 's', kind: 'research', symbol: 'research', form: 'terminal', coat: '#4c5340', accessory: 'none', line: 'The bench reads papers you already own.', slot: null },
    { id: 'duel-door', name: 'Duel terminal', tx: duel.doorTx, ty: duel.doorTy, facing: 'e', kind: 'duel', symbol: 'exchange', form: 'terminal', coat: '#2e3328', accessory: 'none', line: 'A sealed match. Clerk Vesper is simulated.', slot: null },
    { id: 'auction-door', name: 'Auction desk', tx: auction.doorTx, ty: auction.doorTy, facing: 'w', kind: 'auction', symbol: 'auction', form: 'terminal', coat: '#6d7550', accessory: 'none', line: 'One lot. The house bidders are simulated.', slot: null },
    { id: 'plaza-lantern', name: 'Lantern growth', tx: 14, ty: 11, facing: 's', kind: 'flora', symbol: 'cultivation', form: 'flora', coat: '#7d8a62', accessory: 'none', line: 'It drinks the evening and gives a little back.', slot: null },
    { id: 'plaza-rings', name: 'Rings', tx: 16, ty: 12, facing: 's', kind: 'resonance', symbol: 'resonance', form: 'flora', coat: '#d29a3a', accessory: 'none', line: 'The rings are not on any notice.', slot: null },
  );
  for (const actor of actors) {
    if (actor.kind === 'resonance') continue;
    occupy(solid, actor.tx, actor.ty);
  }
  for (const block of extraSolids('district-01')) occupy(solid, block.tx, block.ty);
  const exits: ExitDef[] = [
    { id: 'to-residence', tx: residence.doorTx, ty: residence.doorTy, to: 'residence', spawn: 'door', label: 'Residence', symbol: 'residence' },
  ];
  return {
    id: 'district-01',
    name: 'District 01',
    paletteId: 'exchange',
    width,
    height,
    tiles,
    solid,
    spawns: {
      gate: GATE,
      'from-residence': { tx: residence.frontTx, ty: residence.frontTy, facing: 'n' },
    },
    exits,
    actors,
    resonance: { tx: 16, ty: 12 },
    audioBed: null,
    blurb: 'A public square in the exchange. The notices are ordinary. The light is not.',
  };
};

export const buildResidence = (): LocationDef => {
  const width = 14;
  const height = 10;
  const tiles = blank(width, height, TILE.ground);
  border(tiles);
  set(tiles, 2, 3, TILE.counter);
  set(tiles, 3, 3, TILE.counter);
  set(tiles, 10, 3, TILE.counter);
  set(tiles, 12, 3, TILE.counter);
  set(tiles, 3, 6, TILE.counter);
  set(tiles, 11, 6, TILE.counter);
  set(tiles, 5, 4, TILE.lantern);
  set(tiles, 7, 8, TILE.door);
  const solid = solidFrom(tiles);
  const actors: ActorDef[] = [
    { id: 'bed', name: 'Bed', tx: 2, ty: 3, facing: 's', kind: 'rest', symbol: 'residence', form: 'furnishing', coat: '#c9b59a', accessory: 'none', line: 'You sit for a moment. The room does not charge you.', slot: null },
    { id: 'shelf-a', name: 'Shelf', tx: 10, ty: 3, facing: 's', kind: 'display', symbol: 'storage', form: 'furnishing', coat: '#e6d7c3', accessory: 'none', line: 'A place for one object you actually own.', slot: 'shelf-a' },
    { id: 'shelf-b', name: 'Shelf', tx: 12, ty: 3, facing: 's', kind: 'display', symbol: 'storage', form: 'furnishing', coat: '#e6d7c3', accessory: 'none', line: 'A second place, still one object.', slot: 'shelf-b' },
    { id: 'terminal', name: 'Terminal', tx: 3, ty: 6, facing: 'e', kind: 'terminal', symbol: 'exchange', form: 'terminal', coat: '#6d7550', accessory: 'none', line: 'The same terminal as the floor.', slot: null },
    { id: 'bench', name: 'Workbench', tx: 11, ty: 6, facing: 'w', kind: 'research', symbol: 'research', form: 'terminal', coat: '#4c5340', accessory: 'none', line: 'The bench reads papers. It does not invent them.', slot: null },
    { id: 'house-plant', name: 'Lantern growth', tx: 5, ty: 4, facing: 's', kind: 'flora', symbol: 'cultivation', form: 'flora', coat: '#7d8a62', accessory: 'none', line: 'It drinks the evening and gives a little back.', slot: null },
  ];
  for (const actor of actors) occupy(solid, actor.tx, actor.ty);
  for (const block of extraSolids('residence')) occupy(solid, block.tx, block.ty);
  return {
    id: 'residence',
    name: 'Residence',
    paletteId: 'exchange',
    width,
    height,
    tiles,
    solid,
    spawns: {
      door: { tx: 7, ty: 6, facing: 's' },
    },
    exits: [{ id: 'to-district', tx: 7, ty: 8, to: 'district-01', spawn: 'from-residence', label: 'District', symbol: 'transit' }],
    actors,
    resonance: null,
    audioBed: null,
    blurb: 'A small room. Bed, shelf, terminal, and one organism that is not from anywhere you know.',
  };
};

export const LOCATIONS: Readonly<Record<string, LocationDef>> = {
  'district-01': buildDistrict(),
  residence: buildResidence(),
};

export const locationById = (id: string): LocationDef => LOCATIONS[id] ?? LOCATIONS['district-01']!;

export const poseFor = (locationId: string, spawnId: string): { locationId: string; x: number; y: number; facing: LocationDef['spawns'][string]['facing'] } => {
  const location = locationById(locationId);
  const spawn = location.spawns[spawnId] ?? location.spawns.gate ?? location.spawns.door!;
  const feet = feetOf(spawn.tx, spawn.ty);
  return { locationId: location.id, x: feet.x, y: feet.y, facing: spawn.facing };
};
