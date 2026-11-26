import { anchorsAround, anchorsForDoor, chooseAnchor } from './approach.js';
import type { Anchor } from './approach.js';
import { feetOf, inRange, move, tileAt, wish } from './movement.js';
import { clampFeet, layPoints, planRoute, walkable } from './path.js';
import type { Cell, Pixel } from './path.js';
import type { Facing, InteractionKind, SymbolId } from './types.js';

/** Actions the district already knows how to perform. */
export const LIVE_INTENTS = ['move', 'approach', 'talk', 'inspect', 'trade', 'enter', 'exit', 'operate', 'display', 'research'] as const;

/**
 * Named so a later agent can attach them. Nothing offers or runs them.
 * Sit is not a fake rest animation. Collect, open, and follow are the same.
 */
export const EXTENSION_INTENTS = ['sit', 'collect', 'open', 'follow'] as const;

export type IntentKind = (typeof LIVE_INTENTS)[number] | (typeof EXTENSION_INTENTS)[number];

export type Arrival = 'walk' | 'conversation' | 'menu' | 'direct' | 'travel';

export interface ActionDef {
  kind: IntentKind;
  label: string;
  /** Null keeps the existing line on screen and does not open a ledger. */
  opens: 'merchant' | 'auction' | 'research' | 'contract' | 'duel' | 'terminal' | 'storage' | 'display' | null;
}

export interface NavActor {
  id: string;
  name: string;
  tx: number;
  ty: number;
  facing: Facing;
  kind: InteractionKind;
  form: 'person' | 'terminal' | 'flora' | 'furnishing';
  line: string;
}

export interface NavExit {
  id: string;
  name: string;
  tx: number;
  ty: number;
  symbol: SymbolId;
  to: string;
}

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface TargetBox {
  id: string;
  name: string;
  role: 'actor' | 'exit';
  depth: number;
  core: Rect;
  pad: Rect;
}

const TILE = 32;

const expand = (rect: Rect, pad: number): Rect => ({
  x: rect.x - pad,
  y: rect.y - pad,
  w: rect.w + pad * 2,
  h: rect.h + pad * 2,
});

const inside = (rect: Rect, x: number, y: number): boolean => x >= rect.x && y >= rect.y && x < rect.x + rect.w && y < rect.y + rect.h;

const centerDistance = (rect: Rect, x: number, y: number): number => {
  const cx = rect.x + rect.w / 2;
  const cy = rect.y + rect.h / 2;
  return Math.hypot(x - cx, y - cy);
};

/** Logical hit areas. Decorative tiles are simply absent, so they cannot eat a ground tap. */
export const targetBoxes = (actors: readonly NavActor[], exits: readonly NavExit[], pad: number): TargetBox[] => {
  const boxes: TargetBox[] = [];
  for (const actor of actors) {
    const feet = feetOf(actor.tx, actor.ty);
    const core =
      actor.form === 'person'
        ? { x: feet.x - 12, y: feet.y - 32, w: 24, h: 32 }
        : { x: actor.tx * TILE, y: actor.ty * TILE, w: TILE, h: TILE };
    boxes.push({ id: actor.id, name: actor.name, role: 'actor', depth: feet.y, core, pad: expand(core, pad) });
  }
  for (const exit of exits) {
    const core = { x: exit.tx * TILE, y: exit.ty * TILE, w: TILE, h: TILE };
    boxes.push({
      id: exit.id,
      name: exit.name,
      role: 'exit',
      depth: feetOf(exit.tx, exit.ty).y - 1,
      core,
      pad: expand(core, pad),
    });
  }
  return boxes;
};

/** Depth wins, then a core hit beats padding, then the nearer centre. Adjacent targets stay distinct. */
export const pickTarget = (boxes: readonly TargetBox[], x: number, y: number): TargetBox | null => {
  const padded = boxes.filter((box) => inside(box.pad, x, y));
  if (!padded.length) return null;
  const cores = padded.filter((box) => inside(box.core, x, y));
  const pool = cores.length ? cores : padded;
  return [...pool].sort((a, b) => b.depth - a.depth || centerDistance(a.core, x, y) - centerDistance(b.core, x, y))[0] ?? null;
};

/** The one intent a new actor gets from its kind. No separate navigator. */
export const primaryIntent = (actor: Pick<NavActor, 'kind'>): IntentKind => {
  switch (actor.kind) {
    case 'merchant':
      return 'trade';
    case 'contract':
      return 'talk';
    case 'research':
      return 'research';
    case 'display':
      return 'display';
    case 'flora':
    case 'resonance':
      return 'inspect';
    case 'rest':
      return 'talk';
    case 'auction':
    case 'duel':
    case 'terminal':
    case 'storage':
      return 'operate';
    default:
      return 'talk';
  }
};

/** Buttons that do something the ledger already does. Extension intents are never included. */
export const offeredActions = (actor: Pick<NavActor, 'kind'>): ActionDef[] => {
  switch (actor.kind) {
    case 'merchant':
      return [{ kind: 'trade', label: 'Trade', opens: 'merchant' }];
    case 'contract':
      return [{ kind: 'talk', label: 'Request', opens: 'contract' }];
    case 'research':
      return [{ kind: 'research', label: 'Research', opens: 'research' }];
    case 'auction':
      return [{ kind: 'operate', label: 'Auction', opens: 'auction' }];
    case 'duel':
      return [{ kind: 'operate', label: 'Duel', opens: 'duel' }];
    case 'terminal':
      return [{ kind: 'operate', label: 'Terminal', opens: 'terminal' }];
    case 'storage':
      return [{ kind: 'operate', label: 'Vault', opens: 'storage' }];
    case 'display':
      return [
        { kind: 'inspect', label: 'Inspect', opens: null },
        { kind: 'display', label: 'Manage', opens: 'display' },
      ];
    default:
      return [];
  }
};

export const arrivalMode = (role: 'actor' | 'exit', form: NavActor['form'] | null, actions: readonly ActionDef[]): Arrival => {
  if (role === 'exit') return 'travel';
  if (form === 'person') return 'conversation';
  if (actions.length > 1) return 'menu';
  if (actions.length === 1) return 'direct';
  return 'conversation';
};

export const exitIntent = (symbol: SymbolId): { kind: 'enter' | 'exit'; label: string } =>
  symbol === 'transit' ? { kind: 'exit', label: 'Leave' } : { kind: 'enter', label: 'Enter' };

export const destinationMissing = (knownIds: readonly string[], to: string): boolean => !knownIds.includes(to);

/** True when the player is already on the approach side and in range, so the tap must not wait. */
export const withinApproach = (player: Cell, target: Cell, anchor: Anchor): boolean => {
  if (player.tx === target.tx && player.ty === target.ty) return true;
  if (Math.hypot(player.tx - anchor.tx, player.ty - anchor.ty) <= 0.8) return true;
  const towardX = anchor.tx - target.tx;
  const towardY = anchor.ty - target.ty;
  const fromX = player.tx - target.tx;
  const fromY = player.ty - target.ty;
  return fromX * towardX + fromY * towardY > 0 && inRange(player.tx, player.ty, target.tx, target.ty);
};

export interface MoveDecision {
  type: 'move';
  kind: 'move';
  goal: Cell;
  points: Pixel[];
  trivial: boolean;
}

export interface ApproachDecision {
  type: 'approach';
  kind: IntentKind;
  role: 'actor' | 'exit';
  targetId: string;
  title: string;
  line: string;
  facing: Facing;
  goal: Cell;
  points: Pixel[];
  immediate: boolean;
  arrival: Arrival;
  actions: ActionDef[];
}

export interface BlockedDecision {
  type: 'blocked';
}

export interface NoneDecision {
  type: 'none';
}

export type TapDecision = MoveDecision | ApproachDecision | BlockedDecision | NoneDecision;

export interface TapInput {
  solid: readonly (readonly boolean[])[];
  actors: readonly NavActor[];
  exits: readonly NavExit[];
  playerX: number;
  playerY: number;
  worldX: number;
  worldY: number;
  pad: number;
  radius: number;
}

const standPoint = (cell: Cell, lookAt: Cell, radius: number): Pixel => {
  const feet = feetOf(cell.tx, cell.ty);
  const dx = lookAt.tx - cell.tx;
  const dy = lookAt.ty - cell.ty;
  const len = Math.hypot(dx, dy) || 1;
  return clampFeet(cell, feet.x + (dx / len) * 6, feet.y + (dy / len) * 6, radius);
};

export const interpretTap = (input: TapInput): TapDecision => {
  const from = tileAt(input.playerX, input.playerY);
  const hit = pickTarget(targetBoxes(input.actors, input.exits, input.pad), input.worldX, input.worldY);
  if (!hit) {
    const raw = tileAt(input.worldX, input.worldY);
    const height = input.solid.length;
    const width = input.solid[0]?.length ?? 0;
    const want = {
      tx: Math.min(width - 1, Math.max(0, raw.tx)),
      ty: Math.min(height - 1, Math.max(0, raw.ty)),
    };
    const obstructed = !walkable(input.solid, want.tx, want.ty);
    const route = planRoute(input.solid, from, want);
    if (!route) return { type: 'blocked' };
    if (obstructed && route.goal.tx === from.tx && route.goal.ty === from.ty) return { type: 'blocked' };
    const point = clampFeet(route.goal, input.worldX, input.worldY, input.radius);
    const points = layPoints(input.solid, input.playerX, input.playerY, route.cells, point.x, point.y, input.radius);
    const end = points[points.length - 1] ?? point;
    const trivial = Math.hypot(end.x - input.playerX, end.y - input.playerY) < 4;
    return { type: 'move', kind: 'move', goal: route.goal, points, trivial };
  }
  if (hit.role === 'exit') {
    const exit = input.exits.find((item) => item.id === hit.id);
    if (!exit) return { type: 'blocked' };
    return approachExit(input, from, exit);
  }
  const actor = input.actors.find((item) => item.id === hit.id);
  if (!actor) return { type: 'blocked' };
  return approachActor(input, from, actor);
};

const approachActor = (input: TapInput, from: Cell, actor: NavActor): TapDecision => {
  const anchors = anchorsAround(input.solid, actor.tx, actor.ty, actor.facing);
  const anchor = chooseAnchor(input.solid, from, anchors);
  if (!anchor) return { type: 'blocked' };
  const actions = offeredActions(actor);
  const immediate = withinApproach(from, actor, anchor);
  const point = standPoint(anchor, actor, input.radius);
  const points = immediate
    ? [{ x: input.playerX, y: input.playerY }]
    : pointsTo(input, from, anchor, point);
  if (!points) return { type: 'blocked' };
  return {
    type: 'approach',
    kind: primaryIntent(actor),
    role: 'actor',
    targetId: actor.id,
    title: actor.name,
    line: actor.line,
    facing: anchor.facing,
    goal: anchor,
    points,
    immediate,
    arrival: arrivalMode('actor', actor.form, actions),
    actions,
  };
};

const approachExit = (input: TapInput, from: Cell, exit: NavExit): TapDecision => {
  const anchors = anchorsForDoor(input.solid, exit.tx, exit.ty);
  const anchor = chooseAnchor(input.solid, from, anchors);
  if (!anchor) return { type: 'blocked' };
  const intent = exitIntent(exit.symbol);
  const immediate = withinApproach(from, exit, anchor);
  const point = standPoint(anchor, exit, input.radius);
  const points = immediate ? [{ x: input.playerX, y: input.playerY }] : pointsTo(input, from, anchor, point);
  if (!points) return { type: 'blocked' };
  return {
    type: 'approach',
    kind: intent.kind,
    role: 'exit',
    targetId: exit.id,
    title: exit.name,
    line: '',
    facing: anchor.facing,
    goal: anchor,
    points,
    immediate,
    arrival: 'travel',
    actions: [{ kind: intent.kind, label: intent.label, opens: null }],
  };
};

const pointsTo = (input: TapInput, from: Cell, anchor: Anchor, point: Pixel): Pixel[] | null => {
  const route = planRoute(input.solid, from, anchor);
  if (!route) return null;
  return layPoints(input.solid, input.playerX, input.playerY, route.cells, point.x, point.y, input.radius);
};

export interface CourseRun {
  id: number;
  targetId: string | null;
  points: Pixel[];
  index: number;
}

/** Most recent tap wins. There is no queue of ordinary taps. */
export const replaceCourse = (current: CourseRun | null, next: CourseRun | null): CourseRun | null => {
  void current;
  return next;
};

const ARRIVE_PX = 2.5;

export interface StepResult {
  x: number;
  y: number;
  index: number;
  arrived: boolean;
  stuck: boolean;
}

/** Constant-speed follow. Does not search. Diagonal travel matches cardinal travel. */
export const advanceNavigation = (
  solid: readonly (readonly boolean[])[],
  x: number,
  y: number,
  points: readonly Pixel[],
  index: number,
  speed: number,
  dt: number,
  radius: number,
): StepResult => {
  let cx = x;
  let cy = y;
  let cursor = index;
  let remaining = dt;
  let stuck = false;
  let guard = 0;
  while (cursor < points.length && remaining > 1e-6 && guard < 6) {
    guard += 1;
    const point = points[cursor];
    if (!point) break;
    const distance = Math.hypot(point.x - cx, point.y - cy);
    if (distance <= ARRIVE_PX) {
      cursor += 1;
      continue;
    }
    const stepDt = Math.min(remaining, distance / speed);
    const step = wish(point.x - cx, point.y - cy, speed, stepDt);
    const next = move(solid, cx, cy, step.dx, step.dy, radius);
    if (next.x === cx && next.y === cy) {
      stuck = true;
      break;
    }
    cx = next.x;
    cy = next.y;
    remaining -= stepDt;
    if (Math.hypot(point.x - cx, point.y - cy) <= ARRIVE_PX) cursor += 1;
  }
  return { x: cx, y: cy, index: cursor, arrived: cursor >= points.length, stuck };
};
