import type { Facing } from './types.js';
import { TILE } from './tiles.js';

export interface Shell {
  x: number;
  y: number;
  w: number;
  h: number;
  facing: Facing;
  doorTx: number;
  doorTy: number;
  frontTx: number;
  frontTy: number;
}

/** A reusable exterior shell: roof, walls, one door, one round window. The whole footprint is solid. */
export const stampShell = (tiles: number[][], x0: number, y0: number, w: number, h: number, door: Facing): Shell => {
  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      const roof = y < Math.max(1, Math.ceil(h * 0.34));
      tiles[y0 + y]![x0 + x] = roof ? TILE.roof : TILE.interior;
    }
  }
  let doorTx = x0 + Math.floor(w / 2);
  let doorTy = y0 + h - 1;
  if (door === 'n') doorTy = y0;
  if (door === 'w') {
    doorTx = x0;
    doorTy = y0 + Math.floor(h / 2);
  }
  if (door === 'e') {
    doorTx = x0 + w - 1;
    doorTy = y0 + Math.floor(h / 2);
  }
  tiles[doorTy]![doorTx] = TILE.door;
  const windowTx = Math.min(x0 + w - 1, doorTx + (door === 'w' ? 0 : 1));
  const windowTy = door === 'n' || door === 's' ? doorTy : Math.max(y0, doorTy - 1);
  if ((windowTx !== doorTx || windowTy !== doorTy) && tiles[windowTy] && tiles[windowTy]![windowTx] !== undefined) {
    tiles[windowTy]![windowTx] = TILE.window;
  }
  const front =
    door === 'n' ? [doorTx, doorTy - 1] : door === 's' ? [doorTx, doorTy + 1] : door === 'w' ? [doorTx - 1, doorTy] : [doorTx + 1, doorTy];
  const frontTy = front[1]!;
  const frontTx = front[0]!;
  if (tiles[frontTy]?.[frontTx] === TILE.ground) tiles[frontTy]![frontTx] = TILE.awning;
  return { x: x0, y: y0, w, h, facing: door, doorTx, doorTy, frontTx, frontTy };
};
