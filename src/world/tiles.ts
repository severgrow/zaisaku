export const TILE_SIZE = 32;

export const TILE = {
  ground: 0,
  path: 1,
  roof: 2,
  wall: 3,
  window: 4,
  door: 5,
  awning: 6,
  counter: 7,
  pipe: 8,
  vent: 9,
  lamp: 10,
  tree: 11,
  reed: 12,
  vein: 13,
  lantern: 14,
  interior: 15,
} as const;

export type TileId = (typeof TILE)[keyof typeof TILE];

/** Tiles a person cannot enter. Lamps and awnings stay walkable so a path can pass a thin post. */
export const SOLID_TILES: ReadonlySet<number> = new Set([
  TILE.roof,
  TILE.wall,
  TILE.window,
  TILE.door,
  TILE.counter,
  TILE.pipe,
  TILE.vent,
  TILE.tree,
  TILE.reed,
  TILE.vein,
  TILE.lantern,
  TILE.interior,
]);

export const blank = (width: number, height: number, tile: number): number[][] =>
  Array.from({ length: height }, () => Array.from({ length: width }, () => tile));

export const solidFrom = (tiles: number[][]): boolean[][] => tiles.map((row) => row.map((tile) => SOLID_TILES.has(tile)));
