import { describe, expect, it } from 'vitest';
import { ASSET_MANIFEST, chromaKey, readPngSize, sliceGrid, validateManifest } from '../src/world/assets.js';
import { ARTWORK } from '../src/world/artwork.js';
import { buildDistrict, buildResidence, LOCATIONS, poseFor } from '../src/world/locations.js';
import {
  ceramicTransitionKeys,
  pavingToPathKeys,
  cornerDiagonal,
  eaveFiles,
  floorKey,
  floorMaterial,
  glassItemOffset,
  openingFile,
  pieceFile,
  stepOf,
  DIRS,
  DIAGONALS,
  type Dir,
  type FloorMaterial,
} from '../src/world/connectors.js';
import { MATERIALS } from '../src/world/materials.js';
import { feetOf, inRange, move, reachable, wish } from '../src/world/movement.js';
import { TILE } from '../src/world/tiles.js';
import { PALETTES } from '../src/world/palettes.js';
import { ringRadius } from '../src/world/resonance.js';
import { defaultWorld, GATE, reconcileDisplays } from '../src/world/state.js';
import { chooseSave, decodeSave, encodeSave } from '../src/persist/save.js';
import { createProfile } from '../src/economy/profile.js';
import { createDuel, submit } from '../src/engine/duel.js';
import { defaultSettings } from '../src/persist/save.js';

describe('district foundations', () => {
  it('keeps three materials, five regions, and a navigable exchange', () => {
    expect(MATERIALS.map((item) => item.id)).toEqual(['vey', 'oru', 'sera']);
    expect(MATERIALS.find((item) => item.id === 'sera')?.resonant).toBe(true);
    expect(PALETTES.map((item) => item.id)).toEqual(['exchange', 'basin', 'industrial', 'cultivation', 'unmapped']);
    const district = buildDistrict();
    const residence = buildResidence();
    expect(district.width).toBe(32);
    expect(district.height).toBe(24);
    expect(validateManifest(ASSET_MANIFEST)).toEqual([]);
    expect(new Set(ARTWORK.map((item) => item.pixelKey)).size).toBe(ARTWORK.length);
    expect(ARTWORK.every((item) => item.status === 'temporary' && item.svgRef.length > 0)).toBe(true);
    expect(ARTWORK.filter((item) => item.plateFile).map((item) => item.definitionId).sort()).toEqual([
      'amber-hourglass',
      'blue-fault',
      'bone-dice',
      'catalogue-eye',
      'closed-city',
      'counterfeit-seal',
      'cracked-saucer',
      'dream-receiver',
      'dust-telescope',
      'eclipse-monocle',
      'glass-saint',
      'green-filter',
      'kiln-ghost',
      'late-bell',
      'memory-lens',
      'moon-clock',
      'mute-candle',
      'null-magnet',
      'orchid-vessel',
      'paper-charm',
      'pocket-static',
      'prism-ticket',
      'red-box',
      'red-coil',
      'saltwater-watch',
      'second-mouth',
      'silent-telephone',
      'spare-key',
      'station-pendulum',
      'tea-for-nobody',
      'tomorrow-receiver',
      'travellers-weight',
      'twin-left',
      'twin-right',
      'white-jar',
      'wire-hymnal',
    ]);
    expect(ARTWORK.every((item) => item.plateFile === `catalogue/item-${item.definitionId}.png`)).toBe(true);
    expect(ASSET_MANIFEST.every((item) => item.status === 'temporary')).toBe(true);
    const goals = ['ivo', 'ness', 'archivist', 'stall', 'research-door', 'duel-door', 'auction-door', 'to-residence'] as const;
    for (const id of goals) {
      const actor = district.actors.find((item) => item.id === id) ?? district.exits.find((item) => item.id === id);
      expect(actor, id).toBeTruthy();
      const stand = neighbor(district, actor!.tx, actor!.ty);
      expect(stand, id).toBeTruthy();
      expect(reachable(district.solid, GATE, stand!)).toBe(true);
      expect(inRange(stand!.tx, stand!.ty, actor!.tx, actor!.ty)).toBe(true);
    }
    const home = poseFor('residence', 'door');
    expect(residence.solid[6]?.[7]).toBe(false);
    expect(home.locationId).toBe('residence');
    expect(LOCATIONS['district-01']?.audioBed).toBeNull();
  });

  it('normalises diagonal speed and slides along a wall', () => {
    const diagonal = wish(1, 1, 100, 0.5);
    expect(Math.hypot(diagonal.dx, diagonal.dy)).toBeCloseTo(50, 5);
    const cardinal = wish(0, 1, 100, 0.5);
    expect(Math.hypot(cardinal.dx, cardinal.dy)).toBeCloseTo(50, 5);
    const solid = [
      [false, true, false],
      [false, false, false],
    ];
    const blocked = move(solid, 8, 8, 40, 0, 4);
    expect(blocked.x).toBe(8);
    expect(move(solid, 8, 8, 0, 10, 4).y).toBe(18);
  });

  it('drops a displayed object when it is no longer owned', () => {
    const displays = reconcileDisplays({ 'shelf-a': 'keep', 'shelf-b': 'sold' }, ['keep']);
    expect(displays).toEqual({ 'shelf-a': 'keep', 'shelf-b': null });
    const feet = feetOf(GATE.tx, GATE.ty);
    expect(defaultWorld()).toMatchObject({ locationId: 'district-01', x: feet.x, y: feet.y, facing: 'n' });
  });
});

describe('asset pipeline', () => {
  it('reads a png header, slices a sheet, and clears a backdrop', () => {
    const bytes = new Uint8Array(24);
    bytes.set([137, 80, 78, 71, 13, 10, 26, 10]);
    const view = new DataView(bytes.buffer);
    view.setUint32(8, 13);
    bytes.set([73, 72, 68, 82], 12);
    view.setUint32(16, 64);
    view.setUint32(20, 32);
    expect(readPngSize(bytes)).toEqual({ width: 64, height: 32 });
    expect(sliceGrid(64, 32, 32, 32)).toHaveLength(2);
    expect(sliceGrid(30, 32, 32, 32)).toEqual([]);
    const pixels = new Uint8ClampedArray([255, 0, 255, 255, 10, 20, 30, 255]);
    expect(chromaKey(pixels, [255, 0, 255], 2)).toBe(1);
    expect(pixels[3]).toBe(0);
    expect(pixels[7]).toBe(255);
  });

  it('moves a resonance ring without storing frames', () => {
    const spec = { id: 't', rings: 3, periodMs: 1000, color: '#d29a3a', maxRadius: 18, meaning: '' };
    expect(ringRadius(spec, 0, 0)).toBeGreaterThan(0);
    expect(ringRadius(spec, 0, 1000)).toBeCloseTo(ringRadius(spec, 0, 0), 5);
  });
});

describe('pack 04 connectors', () => {
  it('names corners, tees and openings the way the manifest does', () => {
    expect(pieceFile('wall', ['n', 'w'], 'outer')).toBe('wall-outer-wn.png');
    expect(pieceFile('wall', ['n', 'w'], 'inner')).toBe('wall-inner-wn.png');
    expect(pieceFile('wall', ['n', 's', 'w'], 'outer')).toBe('wall-t-swn.png');
    expect(pieceFile('wall', ['n', 'e', 'w'], 'outer')).toBe('wall-t-wne.png');
    expect(pieceFile('wall', ['n', 'e', 's', 'w'], 'outer')).toBe('wall-cross.png');
    expect(pieceFile('roof', ['e', 's'], 'outer')).toBe('roof-corner-es.png');
    expect(pieceFile('roof', ['n', 'e', 's'], 'outer')).toBe('roof-straight-ns.png');
    expect(pieceFile('roof', ['e', 's', 'w'], 'outer')).toBe('roof-straight-ew.png');
    expect(pieceFile('rail', ['e', 'w'], 'inner')).toBe('rail-straight-ew.png');
    expect(openingFile('door', ['e', 'w'])).toBe('door-frame-open.png');
    expect(openingFile('window', ['n', 's'])).toBeNull();
    expect(openingFile('door', ['n', 's'], 'e')).toBe('door-frame-open-e.png');
    expect(openingFile('door', ['n', 's'], 'w')).toBe('door-frame-open-w.png');
    expect(openingFile('window', ['n', 's'], 'e')).toBe('window-frame-open-e.png');
    expect(openingFile('window', ['n', 's'], 'w')).toBe('window-frame-open-w.png');
    expect(eaveFiles(['e', 'w'], false)).toEqual({ roof: 'roof-straight-ew-bottom.png', bridge: true });
    expect(eaveFiles(['n', 'e', 'w'], false)).toEqual({ roof: 'roof-straight-ew-bottom.png', bridge: true });
    expect(eaveFiles(['e', 'w'], true)).toEqual({ roof: 'roof-straight-ew.png', bridge: false });
    expect(eaveFiles(['n', 'e'], false).bridge).toBe(false);
    expect(glassItemOffset(64)).toEqual({ x: 0, y: -18, size: 20 });
    expect(cornerDiagonal(['e', 's'])).toEqual({ x: 1, y: 1 });
    expect(cornerDiagonal(['n', 's'])).toBeNull();
  });

  it('uses straight and corner transitions from the neighbor sides', () => {
    expect(floorKey('bone-ceramic', { n: 'mineral-paving', e: 'bone-ceramic', s: 'bone-ceramic', w: 'bone-ceramic' })).toBe(
      'bone-ceramic-to-mineral-paving-n',
    );
    expect(floorKey('bone-ceramic', { n: 'mineral-paving', e: 'mineral-paving' }, { ne: 'mineral-paving' })).toBe(
      'bone-ceramic-to-mineral-paving-outer-ne',
    );
    expect(floorKey('bone-ceramic', { s: 'mineral-paving', w: 'mineral-paving' }, { sw: 'mineral-paving' })).toBe(
      'bone-ceramic-to-mineral-paving-outer-sw',
    );
    expect(floorKey('bone-ceramic', { n: 'bone-ceramic', e: 'bone-ceramic', s: 'bone-ceramic', w: 'bone-ceramic' }, { ne: 'mineral-paving' })).toBe(
      'bone-ceramic-to-mineral-paving-inner-ne',
    );
    expect(floorKey('bone-ceramic', { e: 'resonance-path' })).toBe('bone-ceramic-to-resonance-path-e');
    expect(floorKey('bone-ceramic', { n: 'resonance-path', w: 'resonance-path' }, { nw: 'resonance-path' })).toBe(
      'bone-ceramic-to-resonance-path-outer-wn',
    );
    expect(floorKey('bone-ceramic', { n: 'mineral-paving', e: 'resonance-path' })).toBe('floor-bone-ceramic');
    expect(floorKey('bone-ceramic', { n: 'mineral-paving', s: 'mineral-paving' })).toBe('floor-bone-ceramic');
    expect(floorKey('mineral-paving', { w: 'soil' })).toBe('mineral-paving-to-soil-w');
    expect(floorKey('mineral-paving', { n: 'resonance-path' })).toBe('paving-to-path-n');
    expect(floorKey('mineral-paving', { e: 'resonance-path' })).toBe('paving-to-path-e');
    expect(floorKey('mineral-paving', { s: 'resonance-path' })).toBe('paving-to-path-s');
    expect(floorKey('mineral-paving', { w: 'resonance-path' })).toBe('paving-to-path-w');
    expect(floorKey('mineral-paving', { n: 'resonance-path', e: 'resonance-path' })).toBe('paving-to-path-outer-ne');
    expect(floorKey('mineral-paving', { e: 'resonance-path', s: 'resonance-path' })).toBe('paving-to-path-outer-es');
    expect(floorKey('mineral-paving', { s: 'resonance-path', w: 'resonance-path' })).toBe('paving-to-path-outer-sw');
    expect(floorKey('mineral-paving', { w: 'resonance-path', n: 'resonance-path' })).toBe('paving-to-path-outer-wn');
    expect(floorKey('mineral-paving', { n: 'resonance-path', s: 'resonance-path' })).toBe('floor-mineral-paving');
    expect(floorKey('mineral-paving', { n: 'resonance-path', e: 'resonance-path', w: 'resonance-path' })).toBe('floor-mineral-paving');
    expect(floorKey('mineral-paving', { w: 'soil', n: 'resonance-path' })).toBe('paving-to-path-n');
    expect(floorKey('resonance-path', { n: 'mineral-paving' })).toBe('floor-resonance-path');
    expect(floorKey('interior-floor', {})).toBe('floor-interior-floor');
    expect(floorKey('residence-inlay', { n: 'mineral-paving' })).toBe('floor-residence-inlay');
    expect(pavingToPathKeys()).toHaveLength(8);
    const keys = new Set(ceramicTransitionKeys());
    expect(keys.has('bone-ceramic-to-resonance-path-outer-es')).toBe(true);
    expect(keys.has('bone-ceramic-to-mineral-paving-inner-wn')).toBe(true);
  });

  it('follows District 01 neighbors and does not invent a path join', () => {
    const district = buildDistrict();
    const at = (x: number, y: number): string => {
      const neighbors: Partial<Record<Dir, FloorMaterial | null>> = {};
      const diagonals: Partial<Record<'ne' | 'es' | 'sw' | 'nw', FloorMaterial | null>> = {};
      for (const dir of DIRS) {
        const step = stepOf(dir);
        neighbors[dir] = floorMaterial(district.id, district.tiles[y + step.y]?.[x + step.x] ?? null);
      }
      for (const diag of DIAGONALS) diagonals[diag.corner] = floorMaterial(district.id, district.tiles[y + diag.y]?.[x + diag.x] ?? null);
      return floorKey(floorMaterial(district.id, district.tiles[y]![x]!) ?? 'mineral-paving', neighbors, diagonals);
    };
    expect(at(10, 1)).toBe('bone-ceramic-to-mineral-paving-outer-ne');
    expect(at(2, 6)).toBe('bone-ceramic-to-mineral-paving-outer-sw');
    expect(at(3, 1)).toBe('bone-ceramic-to-mineral-paving-n');
    const pathJoins: string[] = [];
    for (let y = 0; y < district.height; y += 1) {
      for (let x = 0; x < district.width; x += 1) {
        const key = at(x, y);
        if (key.includes('resonance-path') && key.startsWith('bone-ceramic')) pathJoins.push(`${x},${y}`);
      }
    }
    expect(pathJoins).toEqual([]);
    const used = new Set<string>();
    for (let y = 0; y < district.height; y += 1) {
      for (let x = 0; x < district.width; x += 1) {
        const key = at(x, y);
        if (key.startsWith('paving-to-path')) used.add(key);
      }
    }
    expect([...used].sort()).toEqual([...pavingToPathKeys()].sort());
    const home = buildResidence();
    expect(floorMaterial(home.id, home.tiles[1]![1]!)).toBe('residence-inlay');
    expect(home.tiles.flat().includes(TILE.counter)).toBe(false);
    expect(home.furnishings.map((item) => [item.id, item.tx, item.ty, item.span])).toEqual([
      ['sleeping-ledge', 1, 1, 1],
      ['bedside-cabinet', 2, 1, 1],
      ['work-bench', 12, 1, 1],
    ]);
    expect(home.solid[1]?.[1]).toBe(true);
    expect(home.solid[1]?.[2]).toBe(true);
    expect(home.solid[1]?.[12]).toBe(true);
    expect(home.solid[6]?.[7]).toBe(false);
    expect(home.tiles[8]?.[7]).toBe(TILE.door);
    expect(home.actors.find((item) => item.id === 'shelf-a')).toMatchObject({ tx: 10, ty: 3, slot: 'shelf-a' });
    expect(home.actors.find((item) => item.id === 'shelf-b')).toMatchObject({ tx: 12, ty: 3, slot: 'shelf-b' });
    expect(reachable(home.solid, { tx: 7, ty: 6 }, { tx: 1, ty: 2 })).toBe(true);
    expect(reachable(home.solid, { tx: 7, ty: 6 }, { tx: 12, ty: 2 })).toBe(true);
    expect(reachable(home.solid, { tx: 7, ty: 6 }, { tx: 7, ty: 7 })).toBe(true);
    const counter = district.furnishings.find((item) => item.id === 'exchange-counter');
    expect(counter).toMatchObject({ sprite: 'exchange-counter', tx: 5, ty: 5, span: 2 });
    expect(district.tiles[counter!.ty]?.[counter!.tx]).not.toBe(TILE.door);
    expect(district.tiles[6]?.[6]).toBe(TILE.door);
    expect(district.furnishings.find((item) => item.id === 'paper-rack')).toMatchObject({ tx: 22, ty: 5, span: 1 });
    expect(district.furnishings.find((item) => item.id === 'research-bench')).toMatchObject({ tx: 28, ty: 5, span: 1 });
    const doorCells = new Set(['6,6', '25,6']);
    for (const prop of district.furnishings) {
      for (let index = 0; index < prop.span; index += 1) expect(doorCells.has(`${prop.tx + index},${prop.ty}`)).toBe(false);
    }
  });
});

describe('save migration', () => {
  it('keeps a v1 wallet and adds a district pose', () => {
    let duel = createDuel(15, { rules: { rounds: 2 } });
    const passed = submit(duel, 'p0', { type: 'pass' });
    if (!passed.ok) throw new Error(passed.reason);
    const both = submit(passed.value, 'p1', { type: 'pass' });
    if (!both.ok) throw new Error(both.reason);
    duel = both.value;
    const profile = createProfile('Ada', 6);
    const legacy = JSON.stringify({ version: 1, profile, duel, settings: defaultSettings(), lastResult: null });
    const loaded = decodeSave(legacy);
    expect(loaded?.version).toBe(2);
    expect(loaded?.profile.wallets.permanent).toBe(profile.wallets.permanent);
    expect(loaded?.duel?.players.p0.cash).toBe(duel.players.p0.cash);
    expect(loaded?.world.locationId).toBe('district-01');
    expect(loaded?.world.displays['shelf-a']).toBeNull();
    const again = decodeSave(encodeSave(loaded!));
    expect(again?.world.x).toBe(loaded?.world.x);
    expect(chooseSave(1, { ...loaded!, revision: 4 })).toBe('adopt');
    expect(chooseSave(4, { ...loaded!, revision: 4 })).toBe('keep');
    const tampered = JSON.parse(legacy) as { duel: { players: { p0: { cash: number } } } };
    tampered.duel.players.p0.cash = 999_999;
    expect(decodeSave(JSON.stringify(tampered))?.duel?.players.p0.cash).toBe(duel.players.p0.cash);
  });
});

const neighbor = (location: ReturnType<typeof buildDistrict>, tx: number, ty: number): { tx: number; ty: number } | null => {
  for (const [dx, dy] of [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ] as const) {
    const next = { tx: tx + dx, ty: ty + dy };
    if (location.solid[next.ty]?.[next.tx] === false) return next;
  }
  return null;
};
