import { TILE_SIZE } from '../../../src/world/tiles.js';
import type { LocationDef } from '../../../src/world/types.js';

/** Large surface features baked into the ground texture once per scene. */
export const paintGroundDetails = (pen: CanvasRenderingContext2D, place: LocationDef): void => {
  pen.save();
  if (place.id === 'residence') {
    pen.fillStyle = '#36322646';
    pen.fillRect(0, 0, place.width * TILE_SIZE, place.height * TILE_SIZE);
    // Woven floor sections define the alcove and work area and leave the through-route clear.
    for (const [x, y, w, h] of [[46, 43, 134, 120], [310, 136, 104, 102]] as const) {
      pen.fillStyle = '#37362ee0';
      pen.fillRect(x, y, w, h);
      pen.fillStyle = '#71594b';
      pen.fillRect(x + 2, y + 2, w - 4, h - 4);
      pen.fillStyle = '#745d50';
      pen.fillRect(x + 6, y + 6, w - 12, h - 12);
      pen.fillStyle = '#bba48429';
      for (let yy = y + 8; yy < y + h - 6; yy += 4) pen.fillRect(x + 6, yy, w - 12, 1);
      pen.strokeStyle = '#a18769';
      pen.strokeRect(x + 4.5, y + 4.5, w - 9, h - 9);
    }
    // A dark apron beneath the back fittings and a lit lip where wall meets floor.
    const width = place.width * TILE_SIZE;
    const wall = pen.createLinearGradient(0, 18, 0, 46);
    wall.addColorStop(0, '#262722dc');
    wall.addColorStop(1, '#4f453789');
    pen.fillStyle = wall;
    pen.fillRect(18, 18, width - 36, 28);
    pen.fillStyle = '#2b2c2340';
    pen.fillRect(17, 35, 9, 250);
    pen.fillRect(width - 25, 35, 8, 250);
    pen.fillStyle = '#e0bd7b5e';
    pen.fillRect(24, 43, width - 48, 2);
  } else {
    // Three paving courses read as a gathering area from the street, including on portrait screens.
    const points = [[432, 328], [624, 328], [652, 356], [652, 462], [624, 488], [432, 488], [404, 462], [404, 356]] as const;
    for (const [color, width] of [['#4d493858', 3], ['#c9ba927d', 1]] as const) {
      pen.strokeStyle = color;
      pen.lineWidth = width;
      pen.beginPath();
      points.forEach(([x, y], i) => { if (i === 0) pen.moveTo(x, y); else pen.lineTo(x, y); });
      pen.closePath();
      pen.stroke();
    }
    for (const [x, y, w, h] of [[56, 561, 126, 61], [836, 561, 132, 61], [637, 318, 96, 60], [437, 120, 174, 83]] as const) {
      pen.fillStyle = '#303b303b';
      pen.fillRect(x, y, w, h);
      pen.strokeStyle = '#494e3d9e';
      pen.lineWidth = 3;
      pen.strokeRect(x + 1.5, y + 1.5, w - 3, h - 3);
      pen.strokeStyle = '#a59f7e87';
      pen.lineWidth = 1;
      pen.strokeRect(x + 3.5, y + 3.5, w - 7, h - 7);
    }
    pen.fillStyle = '#2229232b';
    for (const building of place.buildings ?? []) {
      const x = building.x * TILE_SIZE;
      const y = (building.y + building.h) * TILE_SIZE;
      const width = building.w * TILE_SIZE;
      pen.fillRect(x + 8, y - 11, width - 6, 16);
      pen.fillRect(x + 17, y + 5, width - 22, 4);
    }
  }
  pen.restore();
};

/** One reusable radial light texture. Lighting is behind actors and architecture. */
export const paintLight = (): HTMLCanvasElement => {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 96;
  const pen = canvas.getContext('2d')!;
  const light = pen.createRadialGradient(48, 48, 0, 48, 48, 48);
  light.addColorStop(0, '#f2b867bd');
  light.addColorStop(0.44, '#eeb16870');
  light.addColorStop(1, '#d6944200');
  pen.fillStyle = light;
  pen.fillRect(0, 0, 96, 96);
  return canvas;
};
