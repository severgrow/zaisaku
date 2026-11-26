import { describe, expect, it } from 'vitest';
import { anchorsAround, anchorsForDoor, chooseAnchor } from '../src/world/approach.js';
import { buildDistrict, buildResidence } from '../src/world/locations.js';
import { feetOf } from '../src/world/movement.js';
import {
  advanceNavigation,
  arrivalMode,
  EXTENSION_INTENTS,
  interpretTap,
  offeredActions,
  pickTarget,
  primaryIntent,
  replaceCourse,
  targetBoxes,
  withinApproach,
} from '../src/world/navigation.js';
import type { NavActor, NavExit } from '../src/world/navigation.js';
import { findPath, lineOfSight, planRoute, recoverFeet, sensibleCell, smoothPath, walkable } from '../src/world/path.js';
import type { Cell } from '../src/world/path.js';
import { TILE } from '../src/world/tiles.js';
import type { InteractionKind } from '../src/world/types.js';

const open = (width: number, height: number): boolean[][] => Array.from({ length: height }, () => Array.from({ length: width }, () => false));

const cutsCorner = (solid: readonly (readonly boolean[])[], cells: readonly Cell[]): boolean => {
  for (let i = 1; i < cells.length; i += 1) {
    const a = cells[i - 1];
    const b = cells[i];
    if (!a || !b) return true;
    const dx = b.tx - a.tx;
    const dy = b.ty - a.ty;
    if (Math.abs(dx) > 1 || Math.abs(dy) > 1) {
      if (!lineOfSight(solid, a, b)) return true;
      continue;
    }
    if (!walkable(solid, b.tx, b.ty)) return true;
    if (dx !== 0 && dy !== 0 && (!walkable(solid, a.tx + dx, a.ty) || !walkable(solid, a.tx, a.ty + dy))) return true;
  }
  return false;
};

const actor = (partial: Partial<NavActor> & Pick<NavActor, 'id' | 'kind'>): NavActor => ({
  name: partial.name ?? partial.id,
  tx: partial.tx ?? 2,
  ty: partial.ty ?? 2,
  facing: partial.facing ?? 's',
  form: partial.form ?? 'person',
  line: partial.line ?? 'A line.',
  ...partial,
});

describe('pathfinding', () => {
  it('walks around a wall and refuses a diagonal through a blocked corner', () => {
    const solid = [
      [false, true, false],
      [false, false, false],
      [false, true, false],
    ];
    const around = findPath(solid, { tx: 0, ty: 0 }, { tx: 2, ty: 0 });
    expect(around).not.toBeNull();
    expect(around?.cells.some((cell) => cell.tx === 1 && cell.ty === 1)).toBe(true);
    expect(cutsCorner(solid, around?.cells ?? [])).toBe(false);
    expect(findPath(solid, { tx: 0, ty: 0 }, { tx: 1, ty: 0 })).toBeNull();

    const pinched = [
      [false, true],
      [true, false],
    ];
    expect(findPath(pinched, { tx: 0, ty: 0 }, { tx: 1, ty: 1 })).toBeNull();
    expect(lineOfSight(pinched, { tx: 0, ty: 0 }, { tx: 1, ty: 1 })).toBe(false);

    const openCorner = [
      [false, false],
      [false, false],
    ];
    const diagonal = findPath(openCorner, { tx: 0, ty: 0 }, { tx: 1, ty: 1 });
    expect(diagonal?.cells).toEqual([
      { tx: 0, ty: 0 },
      { tx: 1, ty: 1 },
    ]);
    expect(cutsCorner(openCorner, diagonal?.cells ?? [])).toBe(false);
  });

  it('smooths a staircase into a straight run and keeps constant speed', () => {
    const field = open(8, 8);
    const raw = findPath(field, { tx: 0, ty: 0 }, { tx: 6, ty: 2 });
    expect(raw).not.toBeNull();
    const smooth = smoothPath(field, raw?.cells ?? []);
    expect(smooth.length).toBeLessThan(raw?.cells.length ?? 0);
    expect(smooth[0]).toEqual({ tx: 0, ty: 0 });
    expect(smooth.at(-1)).toEqual({ tx: 6, ty: 2 });
    expect(cutsCorner(field, smooth)).toBe(false);

    const straight = advanceNavigation(field, 48, 48, [{ x: 48, y: 48 }, { x: 248, y: 48 }], 0, 88, 0.5, 6);
    expect(straight.x - 48).toBeCloseTo(44, 1);
    expect(straight.y).toBeCloseTo(48, 1);
    const diagonal = advanceNavigation(field, 48, 48, [{ x: 48, y: 48 }, { x: 248, y: 248 }], 0, 88, 0.5, 6);
    expect(Math.hypot(diagonal.x - 48, diagonal.y - 48)).toBeCloseTo(44, 1);

    const finished = advanceNavigation(field, 48, 48, [{ x: 58, y: 48 }], 0, 88, 1, 6);
    expect(finished.arrived).toBe(true);
    expect(Math.hypot(finished.x - 58, finished.y - 48)).toBeLessThan(3);
  });

  it('stops beside a blocked tile instead of touring the building, and says when there is no route', () => {
    const solid = open(12, 7);
    for (let y = 0; y < 7; y += 1) solid[y]![5] = true;
    const beside = sensibleCell(solid, { tx: 4, ty: 3 }, { tx: 5, ty: 3 });
    expect(beside).toEqual({ tx: 4, ty: 3 });
    expect(beside?.tx).not.toBe(6);

    const sealed = planRoute(solid, { tx: 2, ty: 3 }, { tx: 8, ty: 3 });
    expect(sealed?.goal.tx).toBeLessThan(5);
    expect(sealed?.cells.some((cell) => cell.tx === 5)).toBe(false);
    const gap = solid.map((row) => [...row]);
    gap[0]![5] = false;
    const around = planRoute(gap, { tx: 2, ty: 3 }, { tx: 8, ty: 3 });
    expect(around?.goal).toEqual({ tx: 8, ty: 3 });
    expect(cutsCorner(gap, around?.cells ?? [])).toBe(false);
    expect(around?.cells.some((cell) => cell.tx === 5 && cell.ty !== 0)).toBe(false);

    const pocket = [
      [true, true, true],
      [false, true, true],
      [true, true, true],
    ];
    expect(sensibleCell(pocket, { tx: 0, ty: 1 }, { tx: 2, ty: 1 })).toEqual({ tx: 0, ty: 1 });
    const decision = interpretTap({
      solid: pocket,
      actors: [],
      exits: [],
      playerX: 10,
      playerY: 48,
      worldX: 80,
      worldY: 48,
      pad: 6,
      radius: 6,
    });
    expect(decision.type).toBe('blocked');

    const walled = [
      [true, true],
      [true, true],
    ];
    expect(recoverFeet(walled, 10, 10, 4)).toEqual({ x: 10, y: 10 });
    const spilled = open(4, 4);
    spilled[1]![1] = true;
    const recovered = recoverFeet(spilled, 40, 40, 6);
    expect(walkable(spilled, Math.floor(recovered.x / 32), Math.floor(recovered.y / 32))).toBe(true);
  });

  it('gets stuck on a wall instead of walking through it', () => {
    const solid = [
      [false, true],
      [false, true],
    ];
    const step = advanceNavigation(solid, 10, 10, [{ x: 50, y: 10 }], 0, 100, 1, 6);
    expect(step.stuck).toBe(true);
    expect(step.x).toBe(10);
  });
});

describe('approach and intents', () => {
  it('stands on the customer side, the shelf front, and the door entrance', () => {
    const district = buildDistrict();
    const gate = { tx: 16, ty: 16 };
    const ivo = district.actors.find((item) => item.id === 'ivo');
    expect(ivo).toBeTruthy();
    const merchant = chooseAnchor(district.solid, gate, anchorsAround(district.solid, ivo!.tx, ivo!.ty, ivo!.facing));
    expect(merchant).toEqual({ tx: ivo!.tx, ty: ivo!.ty + 1, facing: 'n' });

    const stall = district.actors.find((item) => item.id === 'stall');
    const counter = chooseAnchor(district.solid, gate, anchorsAround(district.solid, stall!.tx, stall!.ty, stall!.facing));
    expect(counter?.ty).toBe(stall!.ty + 1);
    expect(counter?.facing).toBe('n');

    const door = district.exits[0];
    expect(door).toBeTruthy();
    const entrance = chooseAnchor(district.solid, gate, anchorsForDoor(district.solid, door!.tx, door!.ty));
    expect(entrance).toEqual({ tx: door!.tx, ty: door!.ty - 1, facing: 's' });
    const route = planRoute(district.solid, gate, entrance!);
    expect(route).not.toBeNull();
    expect(cutsCorner(district.solid, route?.cells ?? [])).toBe(false);
    expect(route?.cells.every((cell) => walkable(district.solid, cell.tx, cell.ty))).toBe(true);

    const home = buildResidence();
    const out = home.exits[0];
    const leaving = chooseAnchor(home.solid, { tx: 7, ty: 6 }, anchorsForDoor(home.solid, out!.tx, out!.ty));
    expect(leaving).toEqual({ tx: out!.tx, ty: out!.ty - 1, facing: 's' });
    const shelf = home.actors.find((item) => item.id === 'shelf-a');
    const front = chooseAnchor(home.solid, { tx: 7, ty: 6 }, anchorsAround(home.solid, shelf!.tx, shelf!.ty, shelf!.facing));
    expect(front).toEqual({ tx: shelf!.tx, ty: shelf!.ty + 1, facing: 'n' });
    const terminal = home.actors.find((item) => item.id === 'terminal');
    const operate = chooseAnchor(home.solid, { tx: 7, ty: 6 }, anchorsAround(home.solid, terminal!.tx, terminal!.ty, terminal!.facing));
    expect(operate).toEqual({ tx: terminal!.tx + 1, ty: terminal!.ty, facing: 'w' });

    for (const facing of ['n', 'e', 's', 'w'] as const) {
      const grid = open(5, 5);
      grid[2]![2] = true;
      const anchors = anchorsForDoor(grid, 2, 2);
      expect(anchors.map((item) => item.facing).sort()).toEqual(['e', 'n', 's', 'w']);
      expect(anchorsAround(grid, 2, 2, facing)[0]?.tx).toBe(2 + (facing === 'e' ? 1 : facing === 'w' ? -1 : 0));
      void facing;
    }
  });

  it('maps kinds to the actions the game already has, and does not offer extensions', () => {
    const kinds: InteractionKind[] = ['merchant', 'auction', 'research', 'contract', 'duel', 'terminal', 'storage', 'display', 'rest', 'flora', 'resonance'];
    for (const kind of kinds) {
      const actions = offeredActions({ kind });
      expect(actions.every((item) => !EXTENSION_INTENTS.includes(item.kind as (typeof EXTENSION_INTENTS)[number]))).toBe(true);
      expect(primaryIntent({ kind })).not.toBe('sit');
    }
    expect(primaryIntent({ kind: 'merchant' })).toBe('trade');
    expect(primaryIntent({ kind: 'flora' })).toBe('inspect');
    expect(primaryIntent({ kind: 'resonance' })).toBe('inspect');
    expect(offeredActions({ kind: 'contract' })[0]).toMatchObject({ label: 'Request', opens: 'contract' });
    expect(offeredActions({ kind: 'display' }).map((item) => item.kind)).toEqual(['inspect', 'display']);
    expect(offeredActions({ kind: 'flora' })).toEqual([]);
    expect(arrivalMode('actor', 'person', offeredActions({ kind: 'merchant' }))).toBe('conversation');
    expect(arrivalMode('actor', 'terminal', offeredActions({ kind: 'merchant' }))).toBe('direct');
    expect(arrivalMode('actor', 'furnishing', offeredActions({ kind: 'display' }))).toBe('menu');
    expect(arrivalMode('exit', null, [])).toBe('travel');
    expect(EXTENSION_INTENTS).toEqual(['sit', 'collect', 'open', 'follow']);
  });

  it('replaces the previous course and interacts immediately when already on the approach side', () => {
    const first = { id: 1, targetId: null, points: [{ x: 0, y: 0 }, { x: 80, y: 0 }], index: 1 };
    const second = { id: 2, targetId: 'ivo', points: [{ x: 0, y: 0 }, { x: 0, y: 40 }], index: 0 };
    expect(replaceCourse(first, second)).toBe(second);
    expect(replaceCourse(second, null)).toBeNull();

    const district = buildDistrict();
    const ivo = district.actors.find((item) => item.id === 'ivo')!;
    const anchor = { tx: ivo.tx, ty: ivo.ty + 1, facing: 'n' as const };
    expect(withinApproach({ tx: ivo.tx, ty: ivo.ty + 1 }, ivo, anchor)).toBe(true);
    expect(withinApproach({ tx: ivo.tx, ty: ivo.ty - 1 }, ivo, anchor)).toBe(false);

    const feet = feetOf(anchor.tx, anchor.ty);
    const actors: NavActor[] = district.actors.map((item) => ({
      id: item.id,
      name: item.name,
      tx: item.tx,
      ty: item.ty,
      facing: item.facing,
      kind: item.kind,
      form: item.form,
      line: item.line,
    }));
    const exits: NavExit[] = district.exits.map((item) => ({
      id: item.id,
      name: item.label,
      tx: item.tx,
      ty: item.ty,
      symbol: item.symbol,
      to: item.to,
    }));
    const here = interpretTap({
      solid: district.solid,
      actors,
      exits,
      playerX: feet.x,
      playerY: feet.y,
      worldX: feetOf(ivo.tx, ivo.ty).x,
      worldY: feetOf(ivo.tx, ivo.ty).y - 8,
      pad: 8,
      radius: 6,
    });
    expect(here.type).toBe('approach');
    if (here.type === 'approach') {
      expect(here.immediate).toBe(true);
      expect(here.kind).toBe('trade');
      expect(here.arrival).toBe('conversation');
      expect(here.targetId).toBe('ivo');
    }

    const away = feetOf(16, 16);
    const walk = interpretTap({
      solid: district.solid,
      actors,
      exits,
      playerX: away.x,
      playerY: away.y,
      worldX: 20 * 32 + 8,
      worldY: 16 * 32 + 20,
      pad: 6,
      radius: 6,
    });
    expect(walk.type).toBe('move');
    if (walk.type === 'move') {
      expect(walk.trivial).toBe(false);
      expect(walk.points.at(-1)?.x).not.toBe(20 * 32 + 16);
      const replaced = interpretTap({
        solid: district.solid,
        actors,
        exits,
        playerX: away.x,
        playerY: away.y,
        worldX: feetOf(ivo.tx, ivo.ty).x,
        worldY: feetOf(ivo.tx, ivo.ty).y - 10,
        pad: 8,
        radius: 6,
      });
      expect(replaced.type).toBe('approach');
      if (replaced.type === 'approach') expect(replaced.targetId).not.toBe(walk.goal.tx);
    }
  });

  it('prefers the visually front entity and lets decoration stay ground', () => {
    const boxes = targetBoxes(
      [
        actor({ id: 'back', kind: 'flora', form: 'flora', tx: 2, ty: 2 }),
        actor({ id: 'front', kind: 'merchant', form: 'person', tx: 2, ty: 3 }),
      ],
      [],
      10,
    );
    const frontFeet = feetOf(2, 3);
    const hit = pickTarget(boxes, frontFeet.x, frontFeet.y - 16);
    expect(hit?.id).toBe('front');
    const backOnly = pickTarget(boxes, feetOf(2, 2).x, 2 * 32 + 4);
    expect(backOnly?.id).toBe('back');

    const solid = open(6, 6);
    solid[4]![4] = true;
    const treeTap = interpretTap({
      solid,
      actors: [],
      exits: [],
      playerX: feetOf(1, 1).x,
      playerY: feetOf(1, 1).y,
      worldX: 4 * 32 + 16,
      worldY: 4 * 32 + 16,
      pad: 14,
      radius: 6,
    });
    expect(treeTap.type).toBe('move');
    if (treeTap.type === 'move') expect(treeTap.goal).not.toEqual({ tx: 4, ty: 4 });
    expect(TILE.tree).toBe(11);
  });
});
