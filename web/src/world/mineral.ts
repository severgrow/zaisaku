/** Pack 02 runtime files. Logical cells stay 32px. These images are the double-resolution drawings. */

export const mineralUrl = (file: string): string => new URL(`mineral/${file}`, document.baseURI).toString();

export const MINERAL_TILES: Readonly<Record<string, string>> = {
  ground: 'terrain-ground.png',
  path: 'terrain-path.png',
  stone: 'architecture-stone.png',
  interior: 'architecture-interior.png',
  roof: 'architecture-roof.png',
  door: 'architecture-door.png',
  window: 'architecture-window.png',
  wall: 'architecture-wall.png',
  awning: 'architecture-awning.png',
  pipe: 'architecture-pipe.png',
  vent: 'architecture-vent.png',
  counter: 'furniture-counter.png',
  tree: 'flora-tree.png',
  reed: 'flora-reed.png',
  lantern: 'flora-lantern.png',
  vein: 'flora-vein.png',
  lamp: 'object-lamp.png',
  terminal: 'object-terminal.png',
  plate: 'collectible-collectible-plate.png',
};

export const PLAYER_FACINGS = ['n', 'e', 's', 'w'] as const;
export const NPCS = ['ivo', 'ness', 'archivist'] as const;

export const playerFile = (facing: string, frame: number): string => `player-${facing}-${frame}.png`;
export const npcFile = (id: string, facing: string): string => `person-${id}-${facing}.png`;
