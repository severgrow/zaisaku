import { ASSET_MANIFEST } from '../../../src/world/assets.js';
import { ARTWORK } from '../../../src/world/artwork.js';
import { DISTRICT_RESONANCE, ringRadius } from '../../../src/world/resonance.js';
import { ARCHITECTURE_FILES, EVERYDAY_FILES, FLOOR_FILES, FURNITURE_FILES, INSTRUMENT_FILES, MINERAL_TILES, NPCS, PLAYER_FACINGS, TRANSITION_FILES, mineralUrl, npcFile, playerFile } from './mineral.js';

/** Developer preview. Canvas only, so it does not start a second Phaser game. */

export const workshopScreen = (): string => `
  <p class="kicker">Development</p>
  <h1>Asset workshop</h1>
  <p class="lede">Mineral Analog pack 04 floors and walls, pack 07 plates and joins, and pack 09 everyday props. Still temporary until you approve the screenshots. Characters and loose props remain pack 02. Each sprite is shown at its source size and at half size.</p>
  <div data-workshop class="workshop"></div>
`;

export const mountWorkshop = (): void => {
  const root = document.querySelector('[data-workshop]');
  if (!root) return;
  root.replaceChildren();
  const sheet = document.createElement('div');
  sheet.className = 'sheet';
  root.append(sheet);
  const note = document.createElement('p');
  note.className = 'meta';
  note.textContent = `${ASSET_MANIFEST.length} manifest records, all temporary. Resonance radius ${ringRadius(DISTRICT_RESONANCE, 0, 0).toFixed(1)} to ${DISTRICT_RESONANCE.maxRadius}.`;
  root.append(note);
  const grid = document.createElement('canvas');
  grid.width = 64 * 8;
  grid.height = 64 * 4;
  grid.className = 'sheet-grid';
  root.append(grid);
  const files = [
    ...Object.values(FLOOR_FILES),
    ...Object.values(TRANSITION_FILES),
    ...ARCHITECTURE_FILES.map((file) => `architecture/${file}`),
    ...Object.values(FURNITURE_FILES),
    ...ARTWORK.flatMap((item) => (item.plateFile ? [item.plateFile] : [])),
    ...Object.values(MINERAL_TILES),
    ...Object.values(EVERYDAY_FILES),
    ...Object.values(INSTRUMENT_FILES),
    ...PLAYER_FACINGS.flatMap((facing) => [0, 1, 2, 3].map((frame) => playerFile(facing, frame))),
    ...NPCS.flatMap((id) => PLAYER_FACINGS.map((facing) => npcFile(id, facing))),
  ];
  const pen = grid.getContext('2d');
  if (pen) pen.imageSmoothingEnabled = false;
  const paving = new Image();
  paving.onload = () => {
    if (!pen) return;
    for (let y = 0; y < 3; y += 1) {
      for (let x = 0; x < 3; x += 1) pen.drawImage(paving, x * 64, y * 64, 64, 64);
    }
  };
  paving.src = mineralUrl('floors/floor-mineral-paving.png');
  for (const file of files) {
    const image = new Image();
    image.onload = () => {
      sheet.append(scaled(image, image.width), scaled(image, Math.max(1, Math.round(image.width / 2))));
      if (pen && file.startsWith('player-s')) {
        const frame = Number(file.at(-5));
        if (!Number.isNaN(frame)) pen.drawImage(image, frame * 48, 192);
      }
    };
    image.src = mineralUrl(file);
  }
};

const scaled = (source: HTMLImageElement, width: number): HTMLCanvasElement => {
  const copy = document.createElement('canvas');
  copy.width = width;
  copy.height = Math.max(1, Math.round(source.height * (width / source.width)));
  const pen = copy.getContext('2d');
  if (pen) {
    pen.imageSmoothingEnabled = false;
    pen.drawImage(source, 0, 0, copy.width, copy.height);
  }
  return copy;
};
