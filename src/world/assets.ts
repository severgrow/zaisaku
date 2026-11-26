export type AssetCategory = 'terrain' | 'architecture' | 'flora' | 'character' | 'object' | 'collectible' | 'furniture' | 'interface';
export type AssetStatus = 'temporary' | 'approved';

export interface AssetRecord {
  id: string;
  category: AssetCategory;
  width: number;
  height: number;
  status: AssetStatus;
  anchorX: number;
  anchorY: number;
  note: string;
}

const TEMP = 'Mineral Analog pack 04, temporary until the creator approves screenshots. A 64px drawing is shown on the 32px cell.';
const PACK02 = 'Mineral Analog pack 02, temporary. Kept: characters and loose props the new pack does not replace.';

const tile = (id: string, category: AssetCategory, width = 32, height = 32, note = TEMP): AssetRecord => ({
  id,
  category,
  width,
  height,
  status: 'temporary',
  anchorX: width / 2,
  anchorY: height,
  note,
});

export const ASSET_MANIFEST: readonly AssetRecord[] = [
  tile('ground', 'terrain'),
  tile('path', 'terrain'),
  tile('roof', 'architecture'),
  tile('wall', 'architecture'),
  tile('window', 'architecture'),
  tile('door', 'architecture'),
  tile('awning', 'architecture', 32, 32, 'Pack 02 awning, temporary. East, south, and west doors keep this. It is not used on a north door.'),
  tile('awning-north-door', 'architecture', 64, 64, 'Pack 07 north-door canopy, temporary. One cell north of the door. The lower half is clear, so it is not a doorway.'),
  tile('counter', 'furniture', 32, 32, PACK02),
  tile('pipe', 'architecture', 32, 32, PACK02),
  tile('vent', 'architecture', 32, 32, PACK02),
  tile('lamp', 'object', 32, 32, PACK02),
  tile('tree', 'flora', 32, 32, PACK02),
  tile('reed', 'flora', 32, 32, PACK02),
  tile('vein', 'flora', 32, 32, PACK02),
  tile('lantern', 'flora', 32, 32, PACK02),
  tile('interior', 'architecture'),
  tile('player', 'character', 24, 32, 'Mineral Analog pack 02. Four directions, four walk frames, 48×64 drawn at 24×32. Temporary until approved.'),
  tile('person', 'character', 24, 32, 'Mineral Analog pack 02. Ivo, Ness and the Archivist, four idle facings, 48×64 drawn at 24×32. Temporary until approved.'),
  tile('terminal', 'object', 32, 32, PACK02),
  tile('floor-mineral-paving', 'terrain', 32, 32, TEMP),
  tile('floor-bone-ceramic', 'terrain', 32, 32, TEMP),
  tile('floor-resonance-path', 'terrain', 32, 32, TEMP),
  tile('floor-interior-floor', 'terrain', 32, 32, 'Pack 04 interior floor, temporary. Reads as a brick course, so the residence uses bone ceramic instead.'),
  tile('floor-industrial-metal', 'terrain', 32, 32, TEMP),
  tile('floor-soil', 'terrain', 32, 32, 'Pack 04 soil, temporary. The current maps have no soil region, and the pack has no corner transitions.'),
  tile('floor-residence-inlay', 'terrain', 32, 32, 'Pack 10 residence inlay, temporary. Used across the residence, not as exterior street paving.'),
  tile('transition-bone-paving', 'terrain', 32, 32, 'Pack 04 straights and Pack 07 outer and inner corners, temporary. Two paving sides use the corner named by those sides.'),
  tile('transition-ceramic-path', 'terrain', 32, 32, 'Pack 07 bone ceramic to resonance path, temporary. Straights and corners. A cell uses one only when that neighbor is actually the path.'),
  tile('transition-paving-path', 'terrain', 32, 32, 'Pack 10 paving-to-resonance-path joins. One path-facing side or an approved two-side outer corner; all temporary.'),
  tile('transition-paving-soil', 'terrain', 32, 32, TEMP),
  tile('wall-kit', 'architecture', 32, 32, 'Pack 04 connected walls, temporary. East-west doors and windows keep those frames. North-south runs use the Pack 07 east and west openings.'),
  tile('roof-kit', 'architecture', 32, 32, 'Pack 04 roof caps, temporary. A straight east-west eave uses the Pack 07 extended roof with the wall bridge on the cell below. Corners stay Pack 04.'),
  tile('roof-straight-ew-bottom', 'architecture', 64, 64, 'Pack 07 extended east-west roof, temporary. Paired with the wall bridge directly below. Not mixed into a corner.'),
  tile('wall-straight-ew-top-bridge', 'architecture', 64, 64, 'Pack 07 wall cap, temporary. Its top row matches the extended roof. Drawn on the cell south of that eave.'),
  tile('rail-kit', 'architecture', 32, 32, 'Pack 04 railings, temporary. The current maps have no railing cells, so the kit is in the workshop only.'),
  tile('display-shelf', 'furniture', 32, 32, 'Pack 04 empty shelf, temporary. Owned pictures are drawn on top, not baked in.'),
  tile('display-glass', 'furniture', 32, 32, 'Pack 04 glass plate kept on disk, temporary. The residence case is the Pack 07 base, the owned plate, and the front rails.'),
  tile('glass-case-base', 'furniture', 128, 128, 'Pack 07 glass case back, temporary. The owned plate is drawn at [64, 92], then the front rails.'),
  tile('glass-case-front', 'furniture', 128, 128, 'Pack 07 glass rails, temporary. The center is clear so the owned plate stays visible.'),
  tile('display-pedestal', 'furniture', 32, 32, 'Pack 04 empty pedestal, temporary. Drawn on the residence counter that has no actor.'),
  { id: 'collectible-plate', category: 'collectible', width: 64, height: 64, status: 'temporary', anchorX: 32, anchorY: 64, note: 'Shared fallback plate for catalogue objects Pack 04 does not draw. Temporary.' },
  ...[
    'bone-dice',
    'spare-key',
    'late-bell',
    'second-mouth',
    'station-pendulum',
    'green-filter',
    'eclipse-monocle',
    'prism-ticket',
    'paper-charm',
    'counterfeit-seal',
    'travellers-weight',
    'cracked-saucer',
    'blue-fault',
    'closed-city',
    'twin-left',
    'twin-right',
  ].map((id) => ({
    id: `item-${id}`,
    category: 'collectible' as const,
    width: 64,
    height: 64,
    status: 'temporary' as const,
    anchorX: 32,
    anchorY: 64,
    note: 'Pack 04 catalogue plate, temporary. The 128px runtime file is the picture in the market, the vault, and the world. The definition is unchanged.',
  })),
  ...[
    'tomorrow-receiver',
    'dream-receiver',
    'null-magnet',
    'silent-telephone',
    'wire-hymnal',
    'pocket-static',
    'red-coil',
    'moon-clock',
    'amber-hourglass',
    'saltwater-watch',
    'memory-lens',
    'dust-telescope',
    'catalogue-eye',
    'orchid-vessel',
    'kiln-ghost',
    'tea-for-nobody',
    'white-jar',
    'red-box',
    'glass-saint',
    'mute-candle',
  ].map((id) => ({
    id: `item-${id}`,
    category: 'collectible' as const,
    width: 64,
    height: 64,
    status: 'temporary' as const,
    anchorX: 32,
    anchorY: 64,
    note: 'Pack 07 catalogue plate, temporary. The same 128px file is used in the market, the vault, the auction, the duel, inspection, and the residence. The definition is unchanged.',
  })),
  ...['chair', 'low-table', 'sleeping-pallet', 'standing-lamp', 'crate-large', 'crate-small', 'wrapped-parcel', 'scale', 'customer-counter', 'auction-stand', 'research-flask', 'research-crystal-flask', 'research-jar', 'research-vial', 'research-rack', 'research-tray'].map(
    (id) => tile(id, 'furniture', 32, 32, 'Pack 09 everyday prop, temporary. 64px source drawn at 32px. Not approved from the archive.'),
  ),
  tile('duel-door-terminal', 'object', 32, 32, 'Pack 09 door terminal, temporary. One cell on the District 01 duel entrance. The earlier scaled table is not on this branch.'),
  tile('roof-eave', 'architecture', 96, 32, 'Pack 09 foreground eave, temporary. 192×64 drawn at 96×32. No collision. Fades only while the player is under it.'),
  tile('tree-canopy', 'architecture', 96, 32, 'Pack 09 foreground canopy, temporary. 192×64 drawn at 96×32. No collision. The trunk stays Pack 02.'),
  ...['threshold-n', 'threshold-s', 'threshold-e', 'threshold-w'].map((id) =>
    tile(id, 'terrain', 32, 32, 'Pack 09 threshold, temporary. Outer pixels match floor-resonance-path. Used only on a path cell that meets an entrance.'),
  ),
  { id: 'bid-minus', category: 'interface', width: 64, height: 64, status: 'temporary', anchorX: 32, anchorY: 64, note: 'Pack 09 bid control, temporary. Independent of the plus control and of the timer.' },
  { id: 'bid-plus', category: 'interface', width: 64, height: 64, status: 'temporary', anchorX: 32, anchorY: 64, note: 'Pack 09 bid control, temporary.' },
  { id: 'frame-nine-slice', category: 'interface', width: 64, height: 64, status: 'temporary', anchorX: 32, anchorY: 64, note: 'Pack 09 nine-slice frame, temporary. Slice 12 on each side.' },
  { id: 'variable-object-tray', category: 'interface', width: 64, height: 64, status: 'temporary', anchorX: 32, anchorY: 64, note: 'Pack 09 tray, temporary. Slice 12. Length follows the objects actually held.' },
  { id: 'mobile-exchange-recess', category: 'interface', width: 360, height: 156, status: 'temporary', anchorX: 180, anchorY: 156, note: 'Pack 09 compact exchange recess, temporary. Content inset 38, 24, 38, 28. Not a full-screen illustration.' },
  { id: 'portrait-ivo', category: 'interface', width: 128, height: 128, status: 'temporary', anchorX: 64, anchorY: 128, note: 'Pack 09 bust cropped from the Pack 02 Ivo sprite. Same clothes. Temporary.' },
  { id: 'portrait-ness', category: 'interface', width: 128, height: 128, status: 'temporary', anchorX: 64, anchorY: 128, note: 'Pack 09 bust cropped from the Pack 02 Ness sprite. Same clothes. Temporary.' },
  { id: 'portrait-archivist', category: 'interface', width: 128, height: 128, status: 'temporary', anchorX: 64, anchorY: 128, note: 'Pack 09 bust cropped from the Pack 02 Archivist sprite. Same clothes. Temporary.' },
];

const SIZE: Record<AssetCategory, (width: number, height: number) => boolean> = {
  terrain: (w, h) => w === 32 && h === 32,
  architecture: (w, h) => w > 0 && h > 0 && w % 32 === 0 && h % 32 === 0,
  flora: (w, h) => w === 32 && h === 32,
  character: (w, h) => w === 24 && h === 32,
  object: (w, h) => w === 32 && h === 32,
  collectible: (w, h) => w === 64 && h === 64,
  furniture: (w, h) => w > 0 && h > 0 && w % 32 === 0 && h % 32 === 0,
  interface: (w, h) => w > 0 && h > 0,
};

export const validateManifest = (records: readonly AssetRecord[]): string[] => {
  const issues: string[] = [];
  const seen = new Set<string>();
  for (const record of records) {
    if (!record.id || seen.has(record.id)) issues.push(`${record.id || '(blank)'}: duplicate or empty id`);
    seen.add(record.id);
    if (!SIZE[record.category]?.(record.width, record.height)) issues.push(`${record.id}: ${record.width}×${record.height} is not valid for ${record.category}`);
    if (record.anchorX < 0 || record.anchorY < 0 || record.anchorX > record.width || record.anchorY > record.height) {
      issues.push(`${record.id}: anchor outside the frame`);
    }
    if (record.status !== 'temporary' && record.status !== 'approved') issues.push(`${record.id}: unknown status`);
  }
  return issues;
};

export const readPngSize = (bytes: Uint8Array): { width: number; height: number } | null => {
  const sig = [137, 80, 78, 71, 13, 10, 26, 10];
  if (bytes.length < 24 || sig.some((value, index) => bytes[index] !== value)) return null;
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const length = view.getUint32(8);
  const kind = String.fromCharCode(bytes[12]!, bytes[13]!, bytes[14]!, bytes[15]!);
  if (length < 8 || kind !== 'IHDR') return null;
  return { width: view.getUint32(16), height: view.getUint32(20) };
};

export const sliceGrid = (sheetW: number, sheetH: number, frameW: number, frameH: number): { x: number; y: number; w: number; h: number }[] => {
  if (frameW <= 0 || frameH <= 0 || sheetW % frameW !== 0 || sheetH % frameH !== 0) return [];
  const frames: { x: number; y: number; w: number; h: number }[] = [];
  for (let y = 0; y < sheetH; y += frameH) {
    for (let x = 0; x < sheetW; x += frameW) frames.push({ x, y, w: frameW, h: frameH });
  }
  return frames;
};

/** Clears pixels near an approved backdrop colour. Mutates the buffer. Returns how many pixels were cleared. */
export const chromaKey = (rgba: Uint8ClampedArray, key: readonly [number, number, number], tolerance: number): number => {
  let cleared = 0;
  const limit = tolerance * tolerance;
  for (let i = 0; i < rgba.length; i += 4) {
    const dr = (rgba[i] ?? 0) - key[0];
    const dg = (rgba[i + 1] ?? 0) - key[1];
    const db = (rgba[i + 2] ?? 0) - key[2];
    if (dr * dr + dg * dg + db * db <= limit) {
      rgba[i + 3] = 0;
      cleared += 1;
    }
  }
  return cleared;
};
