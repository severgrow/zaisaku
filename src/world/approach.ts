import { findPath } from './path.js';
import type { Cell } from './path.js';
import { walkable } from './path.js';
import type { Facing } from './types.js';

export interface Anchor {
  tx: number;
  ty: number;
  /** The way the player faces once they are standing here. */
  facing: Facing;
}

const CARDINALS: readonly { facing: Facing; dx: number; dy: number }[] = [
  { facing: 'n', dx: 0, dy: -1 },
  { facing: 'e', dx: 1, dy: 0 },
  { facing: 's', dx: 0, dy: 1 },
  { facing: 'w', dx: -1, dy: 0 },
];

const OPPOSITE: Readonly<Record<Facing, Facing>> = { n: 's', s: 'n', e: 'w', w: 'e' };

const stepOf = (facing: Facing): { dx: number; dy: number } => CARDINALS.find((item) => item.facing === facing) ?? { dx: 0, dy: 1 };

/**
 * Free cardinal neighbours of an entity. `preferred` is the side to stand on
 * (the way a person faces, the front of a shelf, the operating side of a terminal).
 * The player faces back toward the entity and never occupies its tile.
 */
export const anchorsAround = (
  solid: readonly (readonly boolean[])[],
  tx: number,
  ty: number,
  preferred: Facing | null,
): Anchor[] => {
  const order: Facing[] = preferred ? [preferred, ...CARDINALS.map((item) => item.facing).filter((facing) => facing !== preferred)] : ['n', 'e', 's', 'w'];
  const anchors: Anchor[] = [];
  for (const facing of order) {
    const step = stepOf(facing);
    const ax = tx + step.dx;
    const ay = ty + step.dy;
    if (!walkable(solid, ax, ay)) continue;
    anchors.push({ tx: ax, ty: ay, facing: OPPOSITE[facing] });
  }
  return anchors;
};

/** The open side in front of a door. North, south, east, or west. */
export const entranceFacing = (solid: readonly (readonly boolean[])[], tx: number, ty: number): Facing | null => {
  let best: Facing | null = null;
  let bestScore = -1;
  for (const card of CARDINALS) {
    const nx = tx + card.dx;
    const ny = ty + card.dy;
    if (!walkable(solid, nx, ny)) continue;
    let score = 1;
    if (walkable(solid, nx + card.dx, ny + card.dy)) score += 3;
    if (walkable(solid, nx + card.dy, ny + card.dx)) score += 1;
    if (walkable(solid, nx - card.dy, ny - card.dx)) score += 1;
    if (score > bestScore) {
      bestScore = score;
      best = card.facing;
    }
  }
  return best;
};

export const anchorsForDoor = (solid: readonly (readonly boolean[])[], tx: number, ty: number): Anchor[] =>
  anchorsAround(solid, tx, ty, entranceFacing(solid, tx, ty));

/**
 * Prefer the front slot when it is only a few steps longer than the nearest slot.
 * Otherwise take the short walk, so a counter is approached from the customer side
 * without touring the building to reach a point beside the player.
 */
export const chooseAnchor = (solid: readonly (readonly boolean[])[], from: Cell, anchors: readonly Anchor[]): Anchor | null => {
  let best: { anchor: Anchor; cost: number } | null = null;
  let preferred: { anchor: Anchor; cost: number } | null = null;
  for (let index = 0; index < anchors.length; index += 1) {
    const anchor = anchors[index];
    if (!anchor) continue;
    const path = findPath(solid, from, anchor);
    if (!path) continue;
    if (!best || path.cost < best.cost - 1e-6) best = { anchor, cost: path.cost };
    if (index === 0) preferred = { anchor, cost: path.cost };
  }
  if (!best) return null;
  if (preferred && preferred.cost <= best.cost + 4) return preferred.anchor;
  return best.anchor;
};
