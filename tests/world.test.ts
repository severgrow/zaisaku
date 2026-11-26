import { describe, expect, it } from 'vitest';
import { ASSET_MANIFEST, chromaKey, readPngSize, sliceGrid, validateManifest } from '../src/world/assets.js';
import { ARTWORK } from '../src/world/artwork.js';
import { thresholdFor } from '../src/world/fixtures.js';
import { buildDistrict, buildResidence, LOCATIONS, poseFor } from '../src/world/locations.js';
import {
  ceramicTransitionKeys,
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
    expect(floorKey('resonance-path', { n: 'mineral-paving' })).toBe('floor-resonance-path');
    expect(floorKey('interior-floor', {})).toBe('floor-interior-floor');
    const keys = new Set(ceramicTransitionKeys());
    expect(keys.has('bone-ceramic-to-resonance-path-outer-es')).toBe(true);
    expect(keys.has('bone-ceramic-to-mineral-paving-inner-wn')).toBe(true);
  });

  it('follows District 01 neighbors and preserves validated material joins', () => {
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
    const home = buildResidence();
    expect(floorMaterial(home.id, home.tiles[1]![1]!)).toBe('residence-inlay');
  });
});

describe('pack 09 placement', () => {
  it('lays a threshold only where the entrance step is the resonance path', () => {
    const ground = [
      [TILE.ground, TILE.ground],
      [TILE.ground, TILE.ground],
    ];
    expect(thresholdFor(ground, { facing: 'e', doorTx: 0, doorTy: 0, frontTx: 0, frontTy: 0 })).toBeNull();
    const path = [
      [TILE.ground, TILE.ground],
      [TILE.path, TILE.ground],
    ];
    const laid = thresholdFor(path, { facing: 's', doorTx: 0, doorTy: 0, frontTx: 0, frontTy: 0 });
    expect(laid?.file).toBe('threshold-s');
    expect(laid?.tx).toBe(0);
    expect(laid?.ty).toBe(1);
    expect(laid?.footprint).toEqual([]);
    expect(laid?.foreground).toBe(false);
  });

  it('keeps furniture off doors and leaves an approach', () => {
    const district = buildDistrict();
    const home = buildResidence();
    const door = district.actors.find((actor) => actor.id === 'duel-door');
    const terminals = district.fixtures.filter((fixture) => fixture.role === 'terminal');
    expect(terminals).toHaveLength(1);
    expect(terminals[0]?.file).toBe('duel-door-terminal');
    expect(terminals[0]?.tx).toBe(door?.tx);
    expect(terminals[0]?.ty).toBe(door?.ty);
    expect(terminals[0]?.footprint).toEqual([]);
    expect(district.solid[terminals[0]!.approach!.ty]?.[terminals[0]!.approach!.tx]).toBe(false);
    expect(reachable(district.solid, GATE, terminals[0]!.approach!)).toBe(true);

    const thresholds = district.fixtures.filter((fixture) => fixture.role === 'threshold');
    expect(thresholds.map((fixture) => fixture.file).sort()).toEqual(['threshold-n', 'threshold-s', 'threshold-s']);
    for (const fixture of thresholds) {
      expect(district.tiles[fixture.ty]?.[fixture.tx]).toBe(TILE.path);
      expect(district.solid[fixture.ty]?.[fixture.tx]).toBe(false);
    }
    expect(home.fixtures.some((fixture) => fixture.role === 'threshold' || fixture.role === 'foreground')).toBe(false);
    expect(home.fixtures.map((fixture) => fixture.file).sort()).toEqual(['chair', 'low-table', 'sleeping-pallet', 'standing-lamp']);

    for (const place of [district, home]) {
      const spawn = place.id === 'residence' ? { tx: 7, ty: 6 } : GATE;
      for (const fixture of place.fixtures) {
        expect(fixture.foreground).toBe(fixture.role === 'foreground');
        if (fixture.foreground) {
          expect(fixture.footprint).toEqual([]);
          expect(fixture.cover.length).toBeGreaterThan(0);
          continue;
        }
        for (const foot of fixture.footprint) {
          expect(place.tiles[foot.ty]?.[foot.tx]).not.toBe(TILE.door);
          expect(place.tiles[foot.ty]?.[foot.tx]).not.toBe(TILE.window);
          expect(place.exits.some((exit) => exit.tx === foot.tx && exit.ty === foot.ty)).toBe(false);
        }
        if (!fixture.approach) continue;
        expect(place.solid[fixture.approach.ty]?.[fixture.approach.tx]).toBe(false);
        expect(reachable(place.solid, spawn, fixture.approach)).toBe(true);
      }
    }

    const shared = home.actors.filter((actor) =>
      home.fixtures.some((fixture) => fixture.footprint.some((foot) => foot.tx === actor.tx && foot.ty === actor.ty)),
    );
    expect(shared.map((actor) => actor.id)).toEqual(['bed']);
    expect(home.solid[6]?.[7]).toBe(false);
    expect(ASSET_MANIFEST.some((item) => item.id === 'window-glass' || item.id === 'preview')).toBe(false);
    expect(ASSET_MANIFEST.filter((item) => item.id.startsWith('threshold-')).every((item) => item.status === 'temporary')).toBe(true);
    expect(ASSET_MANIFEST.find((item) => item.id === 'duel-door-terminal')?.status).toBe('temporary');
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
