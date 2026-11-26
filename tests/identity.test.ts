import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { readPngSize } from '../src/world/assets.js';
import {
  IDENTITY_FACINGS,
  IDENTITY_PEOPLE,
  IDENTITY_SCALE,
  collectorGraphic,
  coveredTiles,
  duelObjectiveGraphic,
  entrancesOf,
  extraSolids,
  facingToward,
  identityFrame,
  identityFrameFile,
  identitySheets,
  shownSize,
} from '../src/world/identity.js';
import { buildDistrict, buildResidence } from '../src/world/locations.js';
import { GATE } from '../src/world/state.js';
import { reachable } from '../src/world/movement.js';
import { TILE_SIZE } from '../src/world/tiles.js';

describe('district identity', () => {
  const district = buildDistrict();
  const residence = buildResidence();

  it('puts an upright front on each entrance and leaves the long side modular', () => {
    const entrances = entrancesOf(district);
    expect(entrances.map((item) => item.id).sort()).toEqual(['auction', 'duel', 'exchange', 'research', 'residence']);
    expect(entrances.find((item) => item.id === 'exchange')?.facing).toBe('s');
    expect(entrances.find((item) => item.id === 'research')?.facing).toBe('s');
    expect(entrances.find((item) => item.id === 'duel')?.facing).toBe('e');
    expect(entrances.find((item) => item.id === 'auction')?.facing).toBe('w');
    expect(entrances.find((item) => item.id === 'residence')?.facing).toBe('n');
    const sheets = identitySheets(district);
    expect(sheets.every((sheet) => sheet.rotation === 0)).toBe(true);
    for (const id of ['exchange', 'research', 'duel', 'auction', 'residence'] as const) {
      const facade = sheets.find((sheet) => sheet.id === `facade-${id}`);
      const entrance = entrances.find((item) => item.id === id);
      expect(facade?.file).toBe(`identity/front-${id}.png`);
      expect(shownSize(facade!).w).toBe(facade!.sourceW * IDENTITY_SCALE);
      if (id === 'residence') {
        expect(facade?.worldY).toBe((entrance!.footprint.y1 + 1) * TILE_SIZE);
      } else {
        expect(facade?.worldX).toBe(entrance!.tx * TILE_SIZE + TILE_SIZE / 2);
        expect(facade?.worldY).toBe((entrance!.ty + 1) * TILE_SIZE);
      }
    }
    const duel = sheets.find((sheet) => sheet.id === 'facade-duel');
    const auction = sheets.find((sheet) => sheet.id === 'facade-auction');
    for (const x of [2, 3, 4, 5, 6, 7]) expect(duel?.covers.includes(`${x},14`)).toBe(false);
    for (const x of [24, 25, 26, 27, 28, 29]) expect(auction?.covers.includes(`${x},14`)).toBe(false);
    expect(sheets.some((sheet) => sheet.id === 'residence-entrance')).toBe(false);
    expect(sheets.find((sheet) => sheet.id === 'facade-residence')?.covers.includes('16,19')).toBe(true);
  });

  it('keeps the gate, the doors and the new props walkable from the square', () => {
    const goals = ['ivo', 'ness', 'archivist', 'stall', 'research-door', 'duel-door', 'auction-door', 'to-residence'] as const;
    for (const id of goals) {
      const actor = district.actors.find((item) => item.id === id) ?? district.exits.find((item) => item.id === id);
      expect(actor, id).toBeTruthy();
      const stand = neighbor(district, actor!.tx, actor!.ty);
      expect(reachable(district.solid, GATE, stand!), id).toBe(true);
    }
    const blocked = new Set(extraSolids('district-01').map((item) => `${item.tx},${item.ty}`));
    expect(blocked.has('16,16')).toBe(false);
    expect(blocked.has('6,7')).toBe(false);
    expect(blocked.has('8,12')).toBe(false);
    expect(blocked.has('23,12')).toBe(false);
    expect(blocked.has('16,18')).toBe(false);
    expect(residence.solid[2]?.[4]).toBe(true);
    expect(residence.solid[6]?.[7]).toBe(false);
    expect(reachable(residence.solid, { tx: 7, ty: 6 }, { tx: 7, ty: 7 })).toBe(true);
  });

  it('names Pack 02 idle and use frames without replacing the walk cycle', () => {
    expect(identityFrame.playerIdle('s', 0)).toBe('you-s-0');
    expect(identityFrame.playerIdle('e', 1)).toBe('you-e-idle-1');
    expect(identityFrame.playerUse('w')).toBe('you-w-use');
    expect(identityFrame.npcIdle('ivo', 'n', 0)).toBe('person-ivo-n');
    expect(identityFrame.npcUse('archivist', 's')).toBe('person-archivist-s-use');
    expect(facingToward(4, 4, 4, 2, 's')).toBe('n');
    expect(facingToward(4, 4, 8, 5, 'n')).toBe('e');
    for (const person of IDENTITY_PEOPLE) {
      for (const facing of IDENTITY_FACINGS) {
        for (const pose of ['idle-1', 'use'] as const) {
          const file = `web/public/mineral/${identityFrameFile(person, facing, pose)}`;
          const size = readPngSize(readFileSync(file));
          expect(size, file).toEqual({ width: 48, height: 64 });
        }
      }
    }
  });

  it('keeps a sealed envelope sealed until the rules reveal it', () => {
    expect(duelObjectiveGraphic('opponent', false).revealed).toBe(false);
    expect(duelObjectiveGraphic('opponent', true).revealed).toBe(false);
    expect(duelObjectiveGraphic('opponent', true).file).toContain('sealed');
    expect(duelObjectiveGraphic('you', false).revealed).toBe(false);
    expect(duelObjectiveGraphic('you', true).revealed).toBe(true);
    expect(duelObjectiveGraphic('you', true).file).toContain('open');
    expect(collectorGraphic(false).file).toContain('sealed');
    expect(collectorGraphic(true).file).toContain('open');
    expect(collectorGraphic(true).file).not.toContain('duel');
    const mark = identitySheets(district).find((sheet) => sheet.id === 'resonance-mark');
    expect(mark?.file).toBe('identity/resonance-mark.png');
    expect(mark?.foreground).toBe(false);
    expect(coveredTiles(district).has('6,7')).toBe(false);
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
