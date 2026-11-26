import { TILE, TILE_SIZE } from './tiles.js';
import type { Facing, LocationDef } from './types.js';

/** Pack 08 is drawn at 2× and shown at 1×. Logical cells stay 32px. */
export const IDENTITY_SCALE = 0.5;

/**
 * Pack 05's physical exchange instrument is not on this branch.
 * The duel building uses the Pack 08 front. This hook is where that instrument mounts.
 * Do not build a second duel screen to fill it.
 */
export const DUEL_INSTRUMENT_HOOK = 'pack-05-exchange-instrument';

/**
 * Frame names for the tap-to-walk branch.
 * Idle 0 is the approved Pack 02 sprite. Idle 1 and use are pixel shifts of that sprite.
 * On interact: face the thing, play `playerUse`, then settle back to idle.
 */
export const identityFrame = {
  playerIdle: (facing: Facing, frame: 0 | 1): string => (frame === 0 ? `you-${facing}-0` : `you-${facing}-idle-1`),
  playerUse: (facing: Facing): string => `you-${facing}-use`,
  npcIdle: (id: string, facing: Facing, frame: 0 | 1): string => (frame === 0 ? `person-${id}-${facing}` : `person-${id}-${facing}-idle-1`),
  npcUse: (id: string, facing: Facing): string => `person-${id}-${facing}-use`,
};

export const IDENTITY_PEOPLE = ['player', 'ivo', 'ness', 'archivist'] as const;
export const IDENTITY_FACINGS: readonly Facing[] = ['n', 'e', 's', 'w'];

export const identityFrameFile = (person: string, facing: Facing, pose: 'idle-1' | 'use'): string =>
  `identity/frames/${person}-${facing}-${pose}.png`;

const STEP: Record<Facing, { x: number; y: number }> = {
  n: { x: 0, y: -1 },
  e: { x: 1, y: 0 },
  s: { x: 0, y: 1 },
  w: { x: -1, y: 0 },
};

const SHELL = new Set<number>([TILE.roof, TILE.interior, TILE.door, TILE.window, TILE.pipe, TILE.vent]);

/** Opaque source bounds, so transparent padding does not hide a neighbouring wall. */
const OPAQUE_TOP: Record<string, number> = {
  exchange: 22,
  research: 39,
  duel: 30,
  auction: 63,
  residence: 52,
};

export interface Footprint {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

export interface Entrance {
  id: 'exchange' | 'research' | 'duel' | 'auction' | 'residence';
  facing: Facing;
  tx: number;
  ty: number;
  footprint: Footprint;
}

export interface IdentitySheet {
  id: string;
  file: string;
  sourceW: number;
  sourceH: number;
  anchorX: number;
  anchorY: number;
  worldX: number;
  worldY: number;
  depth: number;
  foreground: boolean;
  /** Always upright. A front sheet is never turned and reused as a side wall. */
  rotation: 0;
  /** Structure cells hidden because this picture already draws them. Collision is unchanged. */
  covers: readonly string[];
}

export const shownSize = (sheet: Pick<IdentitySheet, 'sourceW' | 'sourceH'>): { w: number; h: number } => ({
  w: sheet.sourceW * IDENTITY_SCALE,
  h: sheet.sourceH * IDENTITY_SCALE,
});

export const facingToward = (fromTx: number, fromTy: number, toTx: number, toTy: number, current: Facing): Facing => {
  const dx = toTx - fromTx;
  const dy = toTy - fromTy;
  if (dx === 0 && dy === 0) return current;
  if (Math.abs(dx) > Math.abs(dy)) return dx < 0 ? 'w' : 'e';
  return dy < 0 ? 'n' : 's';
};

const tile = (tiles: readonly (readonly number[])[], x: number, y: number): number | null => tiles[y]?.[x] ?? null;

export const footprintFrom = (tiles: readonly (readonly number[])[], tx: number, ty: number): Footprint => {
  const seen = new Set<string>();
  const queue: [number, number][] = [[tx, ty]];
  let x0 = tx;
  let y0 = ty;
  let x1 = tx;
  let y1 = ty;
  while (queue.length) {
    const next = queue.pop();
    if (!next) break;
    const [x, y] = next;
    const key = `${x},${y}`;
    if (seen.has(key) || !SHELL.has(tile(tiles, x, y) ?? -1)) continue;
    seen.add(key);
    x0 = Math.min(x0, x);
    y0 = Math.min(y0, y);
    x1 = Math.max(x1, x);
    y1 = Math.max(y1, y);
    queue.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
  }
  return { x0, y0, x1, y1 };
};

const facingOfDoor = (tiles: readonly (readonly number[])[], tx: number, ty: number): Facing => {
  for (const facing of IDENTITY_FACINGS) {
    const step = STEP[facing];
    if (tile(tiles, tx + step.x, ty + step.y) === TILE.awning) return facing;
  }
  for (const facing of IDENTITY_FACINGS) {
    const step = STEP[facing];
    if (!SHELL.has(tile(tiles, tx + step.x, ty + step.y) ?? TILE.wall)) return facing;
  }
  return 's';
};

export const entrancesOf = (location: LocationDef): Entrance[] => {
  const named = new Map<string, Entrance['id']>();
  for (const actor of location.actors) {
    if (actor.id === 'research-door') named.set(`${actor.tx},${actor.ty}`, 'research');
    if (actor.id === 'duel-door') named.set(`${actor.tx},${actor.ty}`, 'duel');
    if (actor.id === 'auction-door') named.set(`${actor.tx},${actor.ty}`, 'auction');
  }
  for (const exit of location.exits) {
    if (exit.id === 'to-residence') named.set(`${exit.tx},${exit.ty}`, 'residence');
  }
  const found: Entrance[] = [];
  for (let y = 0; y < location.height; y += 1) {
    for (let x = 0; x < location.width; x += 1) {
      if (location.tiles[y]?.[x] !== TILE.door) continue;
      const id = named.get(`${x},${y}`) ?? 'exchange';
      found.push({ id, facing: facingOfDoor(location.tiles, x, y), tx: x, ty: y, footprint: footprintFrom(location.tiles, x, y) });
    }
  }
  return found;
};

const coversIn = (location: LocationDef, left: number, top: number, right: number, bottom: number): string[] => {
  const hits: string[] = [];
  for (let y = 0; y < location.height; y += 1) {
    for (let x = 0; x < location.width; x += 1) {
      if (!SHELL.has(location.tiles[y]?.[x] ?? -1)) continue;
      const cx = x * TILE_SIZE + TILE_SIZE / 2;
      const cy = y * TILE_SIZE + TILE_SIZE / 2;
      if (cx >= left && cx < right && cy >= top && cy < bottom) hits.push(`${x},${y}`);
    }
  }
  return hits;
};

const facadeSheet = (entrance: Entrance, location: LocationDef): IdentitySheet => {
  const sourceW = 256;
  const sourceH = 256;
  const doorX = entrance.tx * TILE_SIZE + TILE_SIZE / 2;
  const doorBottom = (entrance.ty + 1) * TILE_SIZE;
  const southMass = entrance.facing === 'n';
  const worldX = southMass ? ((entrance.footprint.x0 + entrance.footprint.x1 + 1) * TILE_SIZE) / 2 : doorX;
  const worldY = southMass ? (entrance.footprint.y1 + 1) * TILE_SIZE : doorBottom;
  const topPad = OPAQUE_TOP[entrance.id] ?? 0;
  const shownH = (sourceH - topPad) * IDENTITY_SCALE;
  const shownW = sourceW * IDENTITY_SCALE;
  const left = worldX - shownW / 2;
  const top = worldY - shownH;
  const footprintCovers: string[] = [];
  if (entrance.id === 'residence') {
    for (let y = entrance.footprint.y0; y <= entrance.footprint.y1; y += 1) {
      for (let x = entrance.footprint.x0; x <= entrance.footprint.x1; x += 1) {
        if (SHELL.has(location.tiles[y]?.[x] ?? -1)) footprintCovers.push(`${x},${y}`);
      }
    }
  }
  return {
    id: `facade-${entrance.id}`,
    file: `identity/front-${entrance.id}.png`,
    sourceW,
    sourceH,
    anchorX: sourceW / 2,
    anchorY: sourceH,
    worldX,
    worldY,
    depth: worldY,
    foreground: true,
    rotation: 0,
    covers: entrance.id === 'residence' ? footprintCovers : coversIn(location, left, top, left + shownW, top + shownH),
  };
};

const courseSheet = (id: string, file: string, tx: number, ty: number, sourceW: number, sourceH: number): IdentitySheet => ({
  id,
  file,
  sourceW,
  sourceH,
  anchorX: sourceW / 2,
  anchorY: sourceH,
  worldX: tx * TILE_SIZE + TILE_SIZE / 2,
  worldY: (ty + 1) * TILE_SIZE,
  depth: 1,
  foreground: false,
  rotation: 0,
  covers: [],
});

/** Corner returns at the ends of an east-west front. The sheet is a corner, not a seamless tile, so it is not repeated along the wall. */
const foundationFor = (entrance: Entrance): IdentitySheet[] => {
  const front = STEP[entrance.facing];
  const ty = entrance.ty + front.y;
  const tx = entrance.tx + front.x;
  if (entrance.facing === 'e' || entrance.facing === 'w') {
    const file = entrance.facing === 'w' ? 'identity/foundation-corner-e.png' : 'identity/foundation-corner.png';
    return [courseSheet(`step-${entrance.id}`, file, tx, ty, 97, 88)];
  }
  const { x0, x1 } = entrance.footprint;
  return [
    courseSheet(`course-${entrance.id}-w`, 'identity/foundation-corner.png', x0, ty, 97, 88),
    courseSheet(`course-${entrance.id}-e`, 'identity/foundation-corner-e.png', x1, ty, 97, 88),
  ];
};

const prop = (
  id: string,
  file: string,
  tx: number,
  ty: number,
  sourceW: number,
  sourceH: number,
  foreground: boolean,
  depth?: number,
): IdentitySheet => ({
  id,
  file,
  sourceW,
  sourceH,
  anchorX: sourceW / 2,
  anchorY: sourceH,
  worldX: tx * TILE_SIZE + TILE_SIZE / 2,
  worldY: (ty + 1) * TILE_SIZE,
  depth: depth ?? (ty + 1) * TILE_SIZE,
  foreground,
  rotation: 0,
  covers: [],
});

export const DISTRICT_SOLIDS: readonly { tx: number; ty: number }[] = [
  { tx: 10, ty: 17 },
  { tx: 13, ty: 17 },
  { tx: 9, ty: 9 },
];

export const RESIDENCE_SOLIDS: readonly { tx: number; ty: number }[] = [{ tx: 4, ty: 2 }];

export const extraSolids = (locationId: string): readonly { tx: number; ty: number }[] => {
  if (locationId === 'district-01') return DISTRICT_SOLIDS;
  if (locationId === 'residence') return RESIDENCE_SOLIDS;
  return [];
};

const lanterns = (location: LocationDef): IdentitySheet[] => {
  const sheets: IdentitySheet[] = [];
  for (let y = 0; y < location.height; y += 1) {
    for (let x = 0; x < location.width; x += 1) {
      if (location.tiles[y]?.[x] === TILE.lantern) sheets.push(prop(`lantern-${x}-${y}`, 'identity/lantern-plant.png', x, y, 96, 128, true));
    }
  }
  return sheets;
};

export const identitySheets = (location: LocationDef): IdentitySheet[] => {
  const sheets: IdentitySheet[] = [];
  if (location.id === 'district-01') {
    for (const entrance of entrancesOf(location)) {
      sheets.push(facadeSheet(entrance, location));
      sheets.push(...foundationFor(entrance));
    }
    sheets.push(prop('plaza-tree', 'identity/plaza-tree.png', 10, 17, 192, 160, true));
    sheets.push(prop('plaza-bench', 'identity/plaza-bench.png', 13, 17, 128, 96, false));
    sheets.push(prop('notice-board', 'identity/notice-board.png', 9, 9, 128, 128, true));
    sheets.push({
      id: 'district-gate',
      file: 'identity/district-gate.png',
      sourceW: 256,
      sourceH: 160,
      anchorX: 128,
      anchorY: 160,
      worldX: 16 * TILE_SIZE + TILE_SIZE / 2,
      worldY: 18 * TILE_SIZE,
      depth: 18 * TILE_SIZE,
      foreground: true,
      rotation: 0,
      covers: [],
    });
    if (location.resonance) {
      sheets.push(prop('resonance-mark', 'identity/resonance-mark.png', location.resonance.tx, location.resonance.ty, 128, 96, false, 2));
    }
  }
  if (location.id === 'residence') {
    sheets.push(prop('vault-door', 'identity/vault-door.png', 4, 2, 128, 128, true));
  }
  sheets.push(...lanterns(location));
  return sheets;
};

/** The awning in front of a Pack 08 door. The foundation course is the step, so the old stall graphic stays off it. */
export const entranceFronts = (location: LocationDef): ReadonlySet<string> => {
  const fronts = new Set<string>();
  if (location.id !== 'district-01') return fronts;
  for (const entrance of entrancesOf(location)) {
    const step = STEP[entrance.facing];
    fronts.add(`${entrance.tx + step.x},${entrance.ty + step.y}`);
  }
  return fronts;
};

export const coveredTiles = (location: LocationDef): ReadonlySet<string> => {
  const covered = new Set<string>();
  for (const sheet of identitySheets(location)) for (const key of sheet.covers) covered.add(key);
  return covered;
};

/** Sealed stays sealed until the rules already reveal the words. Pictures never carry the words. */
export const envelopeFile = (kind: 'collector' | 'duel', revealed: boolean): string => {
  if (kind === 'duel') return revealed ? 'identity/duel-contract-open.png' : 'identity/duel-contract-sealed.png';
  return revealed ? 'identity/contract-open.png' : 'identity/contract-sealed.png';
};

export const duelObjectiveGraphic = (who: 'you' | 'opponent', seated: boolean): { file: string; revealed: boolean } => {
  if (who === 'opponent' || !seated) return { file: envelopeFile('duel', false), revealed: false };
  return { file: envelopeFile('duel', true), revealed: true };
};

export const collectorGraphic = (readable: boolean): { file: string; revealed: boolean } => ({
  file: envelopeFile('collector', readable),
  revealed: readable,
});
