import { TILE_SIZE } from './tiles.js';

export const feetOf = (tx: number, ty: number): { x: number; y: number } => ({
  x: tx * TILE_SIZE + TILE_SIZE / 2,
  y: ty * TILE_SIZE + TILE_SIZE - 8,
});

/** Unit-length input times speed. Diagonal travel matches cardinal travel. */
export const wish = (ix: number, iy: number, speed: number, dt: number): { dx: number; dy: number } => {
  const len = Math.hypot(ix, iy);
  if (len < 0.01 || speed <= 0 || dt <= 0) return { dx: 0, dy: 0 };
  return { dx: (ix / len) * speed * dt, dy: (iy / len) * speed * dt };
};

export const tileAt = (x: number, y: number): { tx: number; ty: number } => ({
  tx: Math.floor(x / TILE_SIZE),
  ty: Math.floor(y / TILE_SIZE),
});

export const isSolidPixel = (solid: readonly (readonly boolean[])[], x: number, y: number): boolean => {
  const { tx, ty } = tileAt(x, y);
  const row = solid[ty];
  if (!row || tx < 0 || tx >= row.length) return true;
  return row[tx] === true;
};

const hits = (solid: readonly (readonly boolean[])[], x: number, y: number, radius: number): boolean =>
  isSolidPixel(solid, x - radius, y) ||
  isSolidPixel(solid, x + radius, y) ||
  isSolidPixel(solid, x, y - radius) ||
  isSolidPixel(solid, x, y + radius);

/** Slide along a blocked axis instead of stopping dead. */
export const move = (
  solid: readonly (readonly boolean[])[],
  x: number,
  y: number,
  dx: number,
  dy: number,
  radius: number,
): { x: number; y: number } => {
  let nx = x + dx;
  if (hits(solid, nx, y, radius)) nx = x;
  let ny = y + dy;
  if (hits(solid, nx, ny, radius)) ny = y;
  return { x: nx, y: ny };
};

export const inRange = (ax: number, ay: number, bx: number, by: number, limit = 1.65): boolean =>
  Math.hypot(ax - bx, ay - by) <= limit;

export const reachable = (
  solid: readonly (readonly boolean[])[],
  from: { tx: number; ty: number },
  to: { tx: number; ty: number },
): boolean => {
  const height = solid.length;
  const width = solid[0]?.length ?? 0;
  if (from.tx < 0 || from.ty < 0 || to.tx < 0 || to.ty < 0 || to.tx >= width || to.ty >= height) return false;
  if (solid[from.ty]?.[from.tx] || solid[to.ty]?.[to.tx]) return false;
  const seen = new Set<string>();
  const queue = [from];
  const steps = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ] as const;
  while (queue.length) {
    const current = queue.shift()!;
    const key = `${current.tx},${current.ty}`;
    if (seen.has(key)) continue;
    seen.add(key);
    if (current.tx === to.tx && current.ty === to.ty) return true;
    for (const [dx, dy] of steps) {
      const tx = current.tx + dx;
      const ty = current.ty + dy;
      if (tx < 0 || ty < 0 || tx >= width || ty >= height || solid[ty]?.[tx]) continue;
      queue.push({ tx, ty });
    }
  }
  return false;
};

export const nearest = <T extends { tx: number; ty: number }>(
  items: readonly T[],
  tx: number,
  ty: number,
  limit = 1.65,
): T | null => {
  let best: T | null = null;
  let bestD = limit;
  for (const item of items) {
    const distance = Math.hypot(item.tx - tx, item.ty - ty);
    if (distance <= bestD) {
      best = item;
      bestD = distance;
    }
  }
  return best;
};
