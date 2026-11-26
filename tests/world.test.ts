import { describe, expect, it } from 'vitest';
import { ASSET_MANIFEST, chromaKey, readPngSize, sliceGrid, validateManifest } from '../src/world/assets.js';
import { ARTWORK } from '../src/world/artwork.js';
import { buildDistrict, buildResidence, LOCATIONS, poseFor } from '../src/world/locations.js';
import { MATERIALS } from '../src/world/materials.js';
import { feetOf, inRange, move, reachable, wish } from '../src/world/movement.js';
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
