import { PALETTES } from '../../../src/world/palettes.js';
import { ASSET_MANIFEST } from '../../../src/world/assets.js';
import { DISTRICT_RESONANCE, ringRadius } from '../../../src/world/resonance.js';
import { paintActor, paintTile } from './art.js';

/** Developer preview. Canvas only, so it does not start a second Phaser game. */

export const workshopScreen = (): string => `
  <p class="kicker">Development</p>
  <h1>Asset workshop</h1>
  <p class="lede">Temporary procedural stand-ins. Not approved production art. Compare native size, gameplay zoom, and a coarse mobile zoom before replacing a sprite.</p>
  <div data-workshop class="workshop"></div>
`;

export const mountWorkshop = (): void => {
  const root = document.querySelector('[data-workshop]');
  if (!root) return;
  root.replaceChildren();
  const exchange = PALETTES[0];
  if (!exchange) return;
  const sheet = document.createElement('div');
  sheet.className = 'sheet';
  for (let tile = 0; tile <= 15; tile += 1) {
    const native = paintTile(tile, exchange);
    sheet.append(cell(native, 1), cell(native, 2), cell(native, 3));
  }
  for (const facing of ['s', 'n', 'e', 'w'] as const) {
    for (let frame = 0; frame < 4; frame += 1) {
      const native = paintActor(facing, frame, '#2c2824', 'visor', exchange);
      sheet.append(cell(native, 1), cell(native, 2), cell(native, 3));
    }
  }
  root.append(sheet);
  const note = document.createElement('p');
  note.className = 'meta';
  note.textContent = `${ASSET_MANIFEST.length} manifest records, all temporary. Resonance radius ${ringRadius(DISTRICT_RESONANCE, 0, 0).toFixed(1)} to ${DISTRICT_RESONANCE.maxRadius}.`;
  root.append(note);
  const grid = document.createElement('canvas');
  grid.width = 32 * 8;
  grid.height = 32 * 4;
  const pen = grid.getContext('2d');
  if (pen) {
    pen.imageSmoothingEnabled = false;
    for (let i = 0; i < 8; i += 1) pen.drawImage(paintTile(i, exchange), i * 32, 0);
    pen.drawImage(paintActor('s', 0, '#c9b59a', 'none', exchange), 16, 64);
    pen.drawImage(paintActor('s', 1, '#6d7550', 'hood', exchange), 48, 64);
    pen.drawImage(paintActor('s', 2, '#2c2824', 'visor', exchange), 80, 64);
  }
  grid.className = 'sheet-grid';
  root.append(grid);
};

const cell = (source: HTMLCanvasElement, scale: number): HTMLCanvasElement => {
  const copy = document.createElement('canvas');
  copy.width = source.width * scale;
  copy.height = source.height * scale;
  const pen = copy.getContext('2d');
  if (pen) {
    pen.imageSmoothingEnabled = false;
    pen.drawImage(source, 0, 0, copy.width, copy.height);
  }
  return copy;
};
