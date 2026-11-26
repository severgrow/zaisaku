import { ASSET_MANIFEST } from '../../../src/world/assets.js';
import { DISTRICT_RESONANCE, ringRadius } from '../../../src/world/resonance.js';
import { MINERAL_TILES, NPCS, PLAYER_FACINGS, mineralUrl, npcFile, playerFile } from './mineral.js';

/** Developer preview. Canvas only, so it does not start a second Phaser game. */

export const workshopScreen = (): string => `
  <p class="kicker">Development</p>
  <h1>Asset workshop</h1>
  <p class="lede">Mineral Analog pack 02. Still temporary until you approve the screenshots. Each sprite is shown at its 64px source and at the 32px cell it occupies.</p>
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
    ...Object.values(MINERAL_TILES),
    ...PLAYER_FACINGS.flatMap((facing) => [0, 1, 2, 3].map((frame) => playerFile(facing, frame))),
    ...NPCS.flatMap((id) => PLAYER_FACINGS.map((facing) => npcFile(id, facing))),
  ];
  let placed = 0;
  const pen = grid.getContext('2d');
  if (pen) pen.imageSmoothingEnabled = false;
  for (const file of files) {
    const image = new Image();
    image.onload = () => {
      sheet.append(scaled(image, image.width), scaled(image, Math.max(1, Math.round(image.width / 2))));
      if (pen && placed < 16 && file.startsWith('terrain')) {
        const col = placed % 8;
        pen.drawImage(image, col * 64, file.includes('path') ? 64 : 0, 64, 64);
        placed += 1;
      }
      if (pen && file.startsWith('player-s')) {
        const frame = Number(file.at(-5));
        if (!Number.isNaN(frame)) pen.drawImage(image, frame * 48, 160);
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
