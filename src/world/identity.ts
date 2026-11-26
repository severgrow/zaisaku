import { TILE, TILE_SIZE } from './tiles.js';

/**
 * Pack 08B runtime sprites only. Pack 08 is superseded and must not be imported:
 * its facades, district gate, foundation course, character poses and portrait were not
 * validated. These stay temporary until a person approves screenshots.
 * Tree and lantern plant overhang; collision is the ground tile, not the image bounds.
 * The vault door is a closed overlay on a south opening and does not change collision.
 */

export interface RuntimeSprite {
  id: string;
  file: string;
  sourceWidth: number;
  sourceHeight: number;
  width: number;
  height: number;
  originX: number;
  originY: number;
  layer: 'world-prop' | 'ground-overlay' | 'ui';
  sha256: string;
}

export const IDENTITY_SPRITES: readonly RuntimeSprite[] = [
  { id: 'contact-shadow', file: 'identity/contact-shadow.png', sourceWidth: 64, sourceHeight: 32, width: 32, height: 16, originX: 0.5, originY: 0.5, layer: 'ground-overlay', sha256: 'f84b1269860b68b5dab8b3cb3f442d1288bac60661c7d8f58dfe9d3b0752867d' },
  { id: 'contract-open', file: 'identity/contract-open.png', sourceWidth: 128, sourceHeight: 128, width: 64, height: 64, originX: 0.5, originY: 0.5, layer: 'ui', sha256: 'a46379185e8a8a2a82c2a71ef97d19a4d98f8ed8d8cf4bb4cec16831d8c4d232' },
  { id: 'contract-sealed', file: 'identity/contract-sealed.png', sourceWidth: 128, sourceHeight: 128, width: 64, height: 64, originX: 0.5, originY: 0.5, layer: 'ui', sha256: '772de88a136e83ed17285ae70502afe48625b53260e149e8d15dfd34aae4c5df' },
  { id: 'duel-contract-open', file: 'identity/duel-contract-open.png', sourceWidth: 128, sourceHeight: 128, width: 64, height: 64, originX: 0.5, originY: 0.5, layer: 'ui', sha256: 'd5830360433138e42f1ed412bc8df1f3fe7ee437c5b0bd04a205b072e3b6401f' },
  { id: 'duel-contract-sealed', file: 'identity/duel-contract-sealed.png', sourceWidth: 128, sourceHeight: 128, width: 64, height: 64, originX: 0.5, originY: 0.5, layer: 'ui', sha256: '8e2c106d8661cfb8d935f711a7b714a336ab0fba89374fc0916932563c01ffdd' },
  { id: 'lantern-plant', file: 'identity/lantern-plant.png', sourceWidth: 64, sourceHeight: 128, width: 32, height: 64, originX: 0.5, originY: 1, layer: 'world-prop', sha256: '5ae6041616f352b123914267ac380115f9624e6f64168607bd6efbc604f90e16' },
  { id: 'notice-board', file: 'identity/notice-board.png', sourceWidth: 128, sourceHeight: 128, width: 64, height: 64, originX: 0.5, originY: 1, layer: 'world-prop', sha256: '7c036c1317d95be0919f61d5f819e0e668b9cb34e7528441c067325a9ae96af6' },
  { id: 'plaza-bench', file: 'identity/plaza-bench.png', sourceWidth: 128, sourceHeight: 64, width: 64, height: 32, originX: 0.5, originY: 1, layer: 'world-prop', sha256: '5211162fef92dc53da651f789beee9726c91ad6ad84a2a65ed06cfd5c1b190ae' },
  { id: 'plaza-tree', file: 'identity/plaza-tree.png', sourceWidth: 192, sourceHeight: 192, width: 96, height: 96, originX: 0.5, originY: 1, layer: 'world-prop', sha256: 'cc0b570f51eaeb3ce06754098389620ea4576dfc5488607c4b163a7b232a2bfb' },
  { id: 'resonance-mark', file: 'identity/resonance-mark.png', sourceWidth: 64, sourceHeight: 64, width: 32, height: 32, originX: 0.5, originY: 0.5, layer: 'ground-overlay', sha256: 'a6b7de100548ee5313d4c686ba2ef4e4a0ee13b6d983969b170445041624cbbf' },
  { id: 'vault-door', file: 'identity/vault-door.png', sourceWidth: 64, sourceHeight: 64, width: 32, height: 32, originX: 0.5, originY: 1, layer: 'world-prop', sha256: 'e0f56b48fa994ad440c1a6d6bbb4a514b43cb585df626903fd31adfccd0d0486' },
];

export const spriteById = (id: string): RuntimeSprite | undefined => IDENTITY_SPRITES.find((sprite) => sprite.id === id);

/** Open while the request is active. Sealed once it is complete or expired. Match scope uses the duel envelopes. */
export const contractPicture = (scope: 'match' | 'persistent', status: 'active' | 'complete' | 'expired'): string => {
  const open = status === 'active';
  if (scope === 'match') return open ? 'identity/duel-contract-open.png' : 'identity/duel-contract-sealed.png';
  return open ? 'identity/contract-open.png' : 'identity/contract-sealed.png';
};

export interface PropPlacement {
  id: string;
  /** Centre tile when the width is an odd number of cells. Left tile when it is even. */
  tx: number;
  /** South row. Feet sit on this row. */
  ty: number;
  /** Body rows north of the feet that also block. Overhanging plants stay at 0. */
  rowsNorth: number;
}

export const DISTRICT_PLACEMENTS: readonly PropPlacement[] = [
  { id: 'plaza-tree', tx: 10, ty: 18, rowsNorth: 0 },
  { id: 'notice-board', tx: 12, ty: 15, rowsNorth: 1 },
  { id: 'plaza-bench', tx: 6, ty: 15, rowsNorth: 0 },
];

/** Tiles a person cannot enter. The plaza tree keeps only its trunk; the canopy is not solid. */
export const occupiedTiles = (placement: PropPlacement): { tx: number; ty: number }[] => {
  const sprite = spriteById(placement.id);
  if (!sprite || sprite.layer !== 'world-prop') return [];
  if (sprite.id === 'plaza-tree' || sprite.id === 'lantern-plant') return [{ tx: placement.tx, ty: placement.ty }];
  const wide = Math.max(1, Math.round(sprite.width / TILE_SIZE));
  const left = wide % 2 === 1 ? placement.tx - Math.floor(wide / 2) : placement.tx;
  const cells: { tx: number; ty: number }[] = [];
  for (let dy = 0; dy <= placement.rowsNorth; dy += 1) {
    for (let dx = 0; dx < wide; dx += 1) cells.push({ tx: left + dx, ty: placement.ty - dy });
  }
  return cells;
};

/** Bottom-centre foot point for a standing prop. Matches the character foot line. */
export const anchorPixel = (sprite: RuntimeSprite, tx: number, ty: number): { x: number; y: number } => {
  const wide = Math.max(1, Math.round(sprite.width / TILE_SIZE));
  const x = wide % 2 === 1 ? tx * TILE_SIZE + TILE_SIZE / 2 : (tx + wide / 2) * TILE_SIZE;
  const y = (ty + 1) * TILE_SIZE - 8;
  return { x, y };
};

const STRUCTURE = new Set<number>([TILE.roof, TILE.wall, TILE.interior, TILE.door, TILE.window, TILE.pipe, TILE.vent]);

const isStructure = (tiles: readonly (readonly number[])[], tx: number, ty: number): boolean => {
  const tile = tiles[ty]?.[tx];
  return tile !== undefined && STRUCTURE.has(tile);
};

/** A door in an east-west wall with the building to the north. Other facings are not this sprite. */
export const isSouthOpening = (tiles: readonly (readonly number[])[], tx: number, ty: number): boolean => {
  if (tiles[ty]?.[tx] !== TILE.door) return false;
  const eastWest = isStructure(tiles, tx - 1, ty) && isStructure(tiles, tx + 1, ty);
  const northSouth = isStructure(tiles, tx, ty - 1) && isStructure(tiles, tx, ty + 1);
  return eastWest && !northSouth && isStructure(tiles, tx, ty - 1) && !isStructure(tiles, tx, ty + 1);
};
