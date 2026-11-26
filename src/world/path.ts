import { TILE_SIZE } from './tiles.js';
import { bodyBlocked, feetOf, isSolidPixel, tileAt } from './movement.js';

export interface Cell {
  tx: number;
  ty: number;
}

export interface Pixel {
  x: number;
  y: number;
}

const CARDINAL = 1;
const DIAGONAL = Math.SQRT2;

const STEPS = [
  { dx: 1, dy: 0, cost: CARDINAL },
  { dx: -1, dy: 0, cost: CARDINAL },
  { dx: 0, dy: 1, cost: CARDINAL },
  { dx: 0, dy: -1, cost: CARDINAL },
  { dx: 1, dy: 1, cost: DIAGONAL },
  { dx: 1, dy: -1, cost: DIAGONAL },
  { dx: -1, dy: 1, cost: DIAGONAL },
  { dx: -1, dy: -1, cost: DIAGONAL },
] as const;

/** A diagonal is legal only when both adjacent cardinal tiles are free. */
export const walkable = (solid: readonly (readonly boolean[])[], tx: number, ty: number): boolean => {
  const row = solid[ty];
  if (!row || tx < 0 || tx >= row.length) return false;
  return row[tx] !== true;
};

export const cellKey = (cell: Cell): string => `${cell.tx},${cell.ty}`;

const octile = (a: Cell, b: Cell): number => {
  const dx = Math.abs(a.tx - b.tx);
  const dy = Math.abs(a.ty - b.ty);
  const smaller = Math.min(dx, dy);
  return smaller * DIAGONAL + (Math.max(dx, dy) - smaller);
};

export const canStep = (solid: readonly (readonly boolean[])[], from: Cell, dx: number, dy: number): boolean => {
  if (dx === 0 && dy === 0) return false;
  const tx = from.tx + dx;
  const ty = from.ty + dy;
  if (!walkable(solid, tx, ty)) return false;
  if (dx !== 0 && dy !== 0) {
    if (!walkable(solid, from.tx + dx, from.ty)) return false;
    if (!walkable(solid, from.tx, from.ty + dy)) return false;
  }
  return true;
};

/** Grid line of sight that refuses to shave a blocked corner. */
export const lineOfSight = (solid: readonly (readonly boolean[])[], a: Cell, b: Cell): boolean => {
  if (a.tx === b.tx && a.ty === b.ty) return walkable(solid, a.tx, a.ty);
  let x = a.tx;
  let y = a.ty;
  const dx = b.tx - a.tx;
  const dy = b.ty - a.ty;
  const stepX = Math.sign(dx);
  const stepY = Math.sign(dy);
  const absDx = Math.abs(dx);
  const absDy = Math.abs(dy);
  let tMaxX = stepX === 0 ? Number.POSITIVE_INFINITY : 0.5 / absDx;
  let tMaxY = stepY === 0 ? Number.POSITIVE_INFINITY : 0.5 / absDy;
  const tDeltaX = stepX === 0 ? Number.POSITIVE_INFINITY : 1 / absDx;
  const tDeltaY = stepY === 0 ? Number.POSITIVE_INFINITY : 1 / absDy;
  if (!walkable(solid, b.tx, b.ty)) return false;
  const limit = absDx + absDy + 2;
  for (let guard = 0; (x !== b.tx || y !== b.ty) && guard < limit; guard += 1) {
    if (Math.abs(tMaxX - tMaxY) < 1e-9) {
      if (!walkable(solid, x + stepX, y) || !walkable(solid, x, y + stepY)) return false;
      x += stepX;
      y += stepY;
      tMaxX += tDeltaX;
      tMaxY += tDeltaY;
    } else if (tMaxX < tMaxY) {
      x += stepX;
      tMaxX += tDeltaX;
    } else {
      y += stepY;
      tMaxY += tDeltaY;
    }
    if (!walkable(solid, x, y)) return false;
  }
  return x === b.tx && y === b.ty;
};

interface HeapNode<T> {
  f: number;
  tie: number;
  value: T;
}

class Heap<T> {
  private data: HeapNode<T>[] = [];

  get size(): number {
    return this.data.length;
  }

  push(f: number, tie: number, value: T): void {
    this.data.push({ f, tie, value });
    this.up(this.data.length - 1);
  }

  pop(): T | undefined {
    const data = this.data;
    if (!data.length) return undefined;
    const top = data[0];
    const last = data.pop();
    if (!top || !last) return undefined;
    if (data.length) {
      data[0] = last;
      this.down(0);
    }
    return top.value;
  }

  private less(i: number, j: number): boolean {
    const left = this.data[i];
    const right = this.data[j];
    if (!left || !right) return false;
    if (left.f !== right.f) return left.f < right.f;
    return left.tie < right.tie;
  }

  private up(index: number): void {
    let i = index;
    while (i > 0) {
      const parent = (i - 1) >> 1;
      if (!this.less(i, parent)) break;
      this.swap(i, parent);
      i = parent;
    }
  }

  private down(index: number): void {
    let i = index;
    const count = this.data.length;
    for (;;) {
      let best = i;
      const left = i * 2 + 1;
      const right = left + 1;
      if (left < count && this.less(left, best)) best = left;
      if (right < count && this.less(right, best)) best = right;
      if (best === i) break;
      this.swap(i, best);
      i = best;
    }
  }

  private swap(i: number, j: number): void {
    const data = this.data;
    const saved = data[i];
    const other = data[j];
    if (!saved || !other) return;
    data[i] = other;
    data[j] = saved;
  }
}

export interface FoundPath {
  cells: Cell[];
  cost: number;
}

/** A* on the solid grid. One search per tap, not per frame. Diagonal steps do not cut corners. */
export const findPath = (solid: readonly (readonly boolean[])[], from: Cell, to: Cell): FoundPath | null => {
  if (!walkable(solid, from.tx, from.ty) || !walkable(solid, to.tx, to.ty)) return null;
  if (from.tx === to.tx && from.ty === to.ty) return { cells: [from], cost: 0 };
  const height = solid.length;
  const width = solid[0]?.length ?? 0;
  const open = new Heap<Cell>();
  const cost = new Map<string, number>();
  const parent = new Map<string, string>();
  const startKey = cellKey(from);
  cost.set(startKey, 0);
  open.push(octile(from, to), from.ty * width + from.tx, from);
  const closed = new Set<string>();
  const limit = width * height;
  while (open.size && closed.size <= limit) {
    const current = open.pop();
    if (!current) break;
    const key = cellKey(current);
    if (closed.has(key)) continue;
    closed.add(key);
    if (current.tx === to.tx && current.ty === to.ty) {
      const cells: Cell[] = [];
      let cursor: string | undefined = key;
      while (cursor) {
        const [tx, ty] = cursor.split(',');
        cells.push({ tx: Number(tx), ty: Number(ty) });
        cursor = parent.get(cursor);
      }
      cells.reverse();
      return { cells, cost: cost.get(key) ?? 0 };
    }
    const soFar = cost.get(key) ?? 0;
    for (const step of STEPS) {
      if (!canStep(solid, current, step.dx, step.dy)) continue;
      const next = { tx: current.tx + step.dx, ty: current.ty + step.dy };
      const nextKey = cellKey(next);
      const nextCost = soFar + step.cost;
      const previous = cost.get(nextKey);
      if (previous !== undefined && nextCost >= previous - 1e-9) continue;
      cost.set(nextKey, nextCost);
      parent.set(nextKey, key);
      const h = octile(next, to);
      open.push(nextCost + h, h * 10_000 + next.ty * width + next.tx, next);
    }
  }
  return null;
};

/** Drop waypoints that a clear line already covers, so a route does not stair-step. */
export const smoothPath = (solid: readonly (readonly boolean[])[], cells: readonly Cell[]): Cell[] => {
  if (cells.length <= 2) return [...cells];
  const out: Cell[] = [];
  const first = cells[0];
  if (!first) return [];
  out.push(first);
  let anchor = 0;
  while (anchor < cells.length - 1) {
    let furthest = anchor + 1;
    for (let i = cells.length - 1; i > anchor + 1; i -= 1) {
      const from = cells[anchor];
      const to = cells[i];
      if (from && to && lineOfSight(solid, from, to)) {
        furthest = i;
        break;
      }
    }
    const next = cells[furthest];
    if (!next) break;
    out.push(next);
    anchor = furthest;
  }
  return out;
};

/** Chebyshev distance in tiles. */
export const chebyshev = (a: Cell, b: Cell): number => Math.max(Math.abs(a.tx - b.tx), Math.abs(a.ty - b.ty));

const distancesFrom = (solid: readonly (readonly boolean[])[], from: Cell): Map<string, number> => {
  const dist = new Map<string, number>();
  if (!walkable(solid, from.tx, from.ty)) return dist;
  const open = new Heap<Cell>();
  const width = solid[0]?.length ?? 0;
  dist.set(cellKey(from), 0);
  open.push(0, 0, from);
  while (open.size) {
    const current = open.pop();
    if (!current) break;
    const key = cellKey(current);
    const soFar = dist.get(key);
    if (soFar === undefined) continue;
    for (const step of STEPS) {
      if (!canStep(solid, current, step.dx, step.dy)) continue;
      const next = { tx: current.tx + step.dx, ty: current.ty + step.dy };
      const nextKey = cellKey(next);
      const nextCost = soFar + step.cost;
      const previous = dist.get(nextKey);
      if (previous !== undefined && nextCost >= previous - 1e-9) continue;
      dist.set(nextKey, nextCost);
      open.push(nextCost, next.ty * width + next.tx, next);
    }
  }
  return dist;
};

/**
 * If the tapped cell is free and reachable, use it.
 * If it is blocked, take the nearest free cell that does not require walking
 * around a building. A long detour is refused so a wall beside the player
 * does not send them round the block.
 */
export const sensibleCell = (
  solid: readonly (readonly boolean[])[],
  from: Cell,
  want: Cell,
  maxRadius = 4,
): Cell | null => {
  const height = solid.length;
  const width = solid[0]?.length ?? 0;
  if (width === 0 || height === 0) return null;
  const target = {
    tx: Math.min(width - 1, Math.max(0, want.tx)),
    ty: Math.min(height - 1, Math.max(0, want.ty)),
  };
  const dist = distancesFrom(solid, from);
  if (!dist.has(cellKey(from))) return null;
  if (walkable(solid, target.tx, target.ty) && dist.has(cellKey(target))) return target;
  const slack = 6;
  for (let radius = 1; radius <= maxRadius; radius += 1) {
    let best: Cell | null = null;
    let bestScore = Number.POSITIVE_INFINITY;
    for (let ty = target.ty - radius; ty <= target.ty + radius; ty += 1) {
      for (let tx = target.tx - radius; tx <= target.tx + radius; tx += 1) {
        if (chebyshev({ tx, ty }, target) !== radius) continue;
        if (!walkable(solid, tx, ty)) continue;
        const reached = dist.get(cellKey({ tx, ty }));
        if (reached === undefined) continue;
        const straight = octile(from, { tx, ty });
        if (reached > straight + slack) continue;
        const score = reached + radius * 3;
        if (score < bestScore - 1e-6) {
          best = { tx, ty };
          bestScore = score;
        }
      }
    }
    if (best) return best;
  }
  return null;
};

export interface Route {
  cells: Cell[];
  goal: Cell;
  cost: number;
}

/** Resolve a tap to a smoothed route. Returns null when nothing sensible is reachable. */
export const planRoute = (solid: readonly (readonly boolean[])[], from: Cell, want: Cell): Route | null => {
  const goal = sensibleCell(solid, from, want);
  if (!goal) return null;
  if (goal.tx === from.tx && goal.ty === from.ty) return { cells: [{ ...from }], goal, cost: 0 };
  const found = findPath(solid, from, goal);
  if (!found) return null;
  return { cells: smoothPath(solid, found.cells), goal, cost: found.cost };
};

export const clampFeet = (cell: Cell, x: number, y: number, radius: number): Pixel => {
  const inset = Math.min(Math.max(radius, 1), TILE_SIZE / 2 - 1);
  return {
    x: Math.min((cell.tx + 1) * TILE_SIZE - inset, Math.max(cell.tx * TILE_SIZE + inset, x)),
    y: Math.min((cell.ty + 1) * TILE_SIZE - inset, Math.max(cell.ty * TILE_SIZE + inset, y)),
  };
};

export const segmentClear = (
  solid: readonly (readonly boolean[])[],
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  radius: number,
): boolean => {
  const distance = Math.hypot(x1 - x0, y1 - y0);
  const steps = Math.max(1, Math.ceil(distance / 4));
  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps;
    if (bodyBlocked(solid, x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, radius)) return false;
  }
  return true;
};

/** Pixel waypoints. The last point is where the player was tapped, not a tile centre. */
export const layPoints = (
  solid: readonly (readonly boolean[])[],
  fromX: number,
  fromY: number,
  cells: readonly Cell[],
  goalX: number,
  goalY: number,
  radius: number,
): Pixel[] => {
  const points: Pixel[] = [{ x: fromX, y: fromY }];
  for (let i = 1; i < cells.length; i += 1) {
    const cell = cells[i];
    if (!cell) continue;
    const last = i === cells.length - 1;
    const aimed = last ? clampFeet(cell, goalX, goalY, radius) : feetOf(cell.tx, cell.ty);
    const prev = points[points.length - 1];
    if (!prev) continue;
    const point = last && !segmentClear(solid, prev.x, prev.y, aimed.x, aimed.y, radius) ? feetOf(cell.tx, cell.ty) : aimed;
    if (Math.hypot(point.x - prev.x, point.y - prev.y) > 0.5) points.push(point);
  }
  if (points.length <= 2) return points;
  const out: Pixel[] = [points[0]!];
  let anchor = 0;
  while (anchor < points.length - 1) {
    let furthest = anchor + 1;
    for (let i = points.length - 1; i > anchor + 1; i -= 1) {
      const from = points[anchor];
      const to = points[i];
      if (from && to && segmentClear(solid, from.x, from.y, to.x, to.y, radius)) {
        furthest = i;
        break;
      }
    }
    const next = points[furthest];
    if (!next) break;
    out.push(next);
    anchor = furthest;
  }
  return out;
};

/** If a saved pose is inside a solid, step to the nearest free feet position. */
export const recoverFeet = (
  solid: readonly (readonly boolean[])[],
  x: number,
  y: number,
  radius: number,
): Pixel => {
  if (!bodyBlocked(solid, x, y, radius) && !isSolidPixel(solid, x, y)) return { x, y };
  const start = tileAt(x, y);
  const height = solid.length;
  const width = solid[0]?.length ?? 0;
  const limit = Math.max(width, height);
  for (let radiusTiles = 0; radiusTiles <= limit; radiusTiles += 1) {
    for (let ty = start.ty - radiusTiles; ty <= start.ty + radiusTiles; ty += 1) {
      for (let tx = start.tx - radiusTiles; tx <= start.tx + radiusTiles; tx += 1) {
        if (chebyshev({ tx, ty }, start) !== radiusTiles) continue;
        if (!walkable(solid, tx, ty)) continue;
        const feet = feetOf(tx, ty);
        if (!bodyBlocked(solid, feet.x, feet.y, radius)) return feet;
      }
    }
  }
  return { x, y };
};
