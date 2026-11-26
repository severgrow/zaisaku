export type AssetCategory = 'terrain' | 'architecture' | 'flora' | 'character' | 'object' | 'collectible' | 'furniture';
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
  tile('awning', 'architecture', 32, 32, PACK02),
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
  tile('transition-bone-paving', 'terrain', 32, 32, 'Pack 04 straight edges only, temporary. A cell with two paving sides keeps plain bone ceramic.'),
  tile('transition-paving-soil', 'terrain', 32, 32, TEMP),
  tile('wall-kit', 'architecture', 32, 32, 'Pack 04 connected walls, temporary. Chosen by n/e/s/w. Door and window frames are east-west only.'),
  tile('roof-kit', 'architecture', 32, 32, 'Pack 04 roof caps, temporary. Drawn on the north edge of a roof run. No T or cross piece, so those masks use a straight roof.'),
  tile('rail-kit', 'architecture', 32, 32, 'Pack 04 railings, temporary. The current maps have no railing cells, so the kit is in the workshop only.'),
  tile('display-shelf', 'furniture', 32, 32, 'Pack 04 empty shelf, temporary. Owned pictures are drawn on top, not baked in.'),
  tile('display-glass', 'furniture', 32, 32, 'Pack 04 empty case, temporary. The glass image is one opaque plate, so the owned picture sits on it.'),
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
    note: 'Pack 04 catalogue plate, temporary. The 128px runtime file is shown at 64px. The definition is unchanged.',
  })),
];

const SIZE: Record<AssetCategory, (width: number, height: number) => boolean> = {
  terrain: (w, h) => w === 32 && h === 32,
  architecture: (w, h) => w > 0 && h > 0 && w % 32 === 0 && h % 32 === 0,
  flora: (w, h) => w === 32 && h === 32,
  character: (w, h) => w === 24 && h === 32,
  object: (w, h) => w === 32 && h === 32,
  collectible: (w, h) => w === 64 && h === 64,
  furniture: (w, h) => w > 0 && h > 0 && w % 32 === 0 && h % 32 === 0,
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
